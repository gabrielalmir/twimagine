import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SQSEvent, SQSRecord } from "aws-lambda";
import Stripe from "stripe";
import { TwitterApi } from "twitter-api-v2";
import { QueueMessage } from "../../core/src/types";
import { DynamoDBService } from "../../core/src/utils/dynamodb";

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET!,
    accessToken: process.env.TWITTER_ACCESS_TOKEN!,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
});

export const handler = async (event: SQSEvent): Promise<void> => {
    for (const record of event.Records) {
        try {
            await processMessage(record);
        } catch (error) {
            console.error("Error processing message:", error);
            // Let SQS retry the message
            throw error;
        }
    }
};

async function processMessage(record: SQSRecord): Promise<void> {
    const message: QueueMessage = JSON.parse(record.body);
    console.log("Processing message:", message);

    if (message.type !== "generate_image") {
        console.log("Skipping non-image generation message");
        return;
    }

    const request = await DynamoDBService.getImageRequest(message.requestId);
    if (!request) {
        console.error("Request not found:", message.requestId);
        return;
    }

    // Create Stripe payment intent
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 500, // $5.00 in cents
            currency: "usd",
            metadata: {
                requestId: request.id,
                tweetId: request.tweetId,
            },
            description: `AI Image Generation: ${request.prompt.substring(0, 100)}`,
        });

        // Update request with payment info
        await DynamoDBService.updateImageRequest(request.id, {
            paymentIntentId: paymentIntent.id,
            paymentUrl: `https://checkout.stripe.com/pay/${paymentIntent.client_secret}`,
        });

        // Reply to tweet with payment link
        const replyText = `🎨 Hi @${request.authorUsername}! I'd love to create that image for you.\n\n💳 Please complete your payment here: https://checkout.stripe.com/pay/${paymentIntent.client_secret}\n\n⏱️ I'll generate your image as soon as payment is confirmed!`;

        await twitterClient.v2.tweet(replyText, {
            reply: { in_reply_to_tweet_id: request.tweetId },
        });

        console.log(`Payment link sent for request: ${request.id}`);
    } catch (error) {
        console.error("Error creating payment intent:", error);

        // Update request status to failed
        await DynamoDBService.updateImageRequest(request.id, {
            status: "failed",
        });
    }
}

// Placeholder for actual image generation service
async function generateImage(prompt: string): Promise<Buffer> {
    // TODO: Integrate with actual AI image generation service
    // For now, return a placeholder
    console.log("Generating image for prompt:", prompt);

    // This would be replaced with actual API call to image generation service
    // Examples: OpenAI DALL-E, Stability AI, Replicate, etc.
    throw new Error("Image generation service not implemented yet");
}

async function uploadImageToS3(imageBuffer: Buffer, filename: string): Promise<string> {
    const key = `generated-images/${filename}`;

    await s3Client.send(
        new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME!,
            Key: key,
            Body: imageBuffer,
            ContentType: "image/png",
            ACL: "public-read",
        })
    );

    // Return public URL
    return `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${key}`;
}
