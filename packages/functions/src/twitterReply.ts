import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SQSEvent, SQSRecord } from "aws-lambda";
import { TwitterApi } from "twitter-api-v2";
import { QueueMessage } from "../../core/src/types";
import { DynamoDBService } from "../../core/src/utils/dynamodb";

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });

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

    if (message.type !== "reply_tweet") {
        console.log("Skipping non-reply message");
        return;
    }

    const request = await DynamoDBService.getImageRequest(message.requestId);
    if (!request) {
        console.error("Request not found:", message.requestId);
        return;
    }

    if (request.status !== "payment_confirmed") {
        console.error("Payment not confirmed for request:", message.requestId);
        return;
    }

    try {
        // Update status to generating
        await DynamoDBService.updateImageRequest(request.id, {
            status: "generating",
        });

        // Generate image
        console.log("Generating image for prompt:", request.prompt);
        const imageBuffer = await generateImage(request.prompt);

        // Upload to S3
        const filename = `${request.id}-${Date.now()}.png`;
        const imageUrl = await uploadImageToS3(imageBuffer, filename);

        // Update request with image URL
        await DynamoDBService.updateImageRequest(request.id, {
            status: "completed",
            imageUrl,
        });

        // Reply to original tweet with generated image
        const replyText = `🎨 Here's your AI-generated image based on: "${request.prompt}"\n\n✨ Hope you love it! Feel free to mention me again for more creations.`;

        // Upload image to Twitter and tweet
        const mediaId = await twitterClient.v1.uploadMedia(imageBuffer, {
            mimeType: "image/png",
        });

        await twitterClient.v2.tweet(replyText, {
            reply: { in_reply_to_tweet_id: request.tweetId },
            media: { media_ids: [mediaId] },
        });

        console.log(`Image generated and replied for request: ${request.id}`);
    } catch (error) {
        console.error("Error generating/replying image:", error);

        // Update request status to failed
        await DynamoDBService.updateImageRequest(request.id, {
            status: "failed",
        });

        // Send error reply to user
        try {
            const errorReply = `😔 Sorry @${request.authorUsername}, I encountered an error generating your image. Please try again later or contact support.`;

            await twitterClient.v2.tweet(errorReply, {
                reply: { in_reply_to_tweet_id: request.tweetId },
            });
        } catch (replyError) {
            console.error("Failed to send error reply:", replyError);
        }
    }
}

// Placeholder for actual image generation service
async function generateImage(prompt: string): Promise<Buffer> {
    // TODO: Integrate with actual AI image generation service
    console.log("Generating image for prompt:", prompt);

    // Simulate image generation delay
    await new Promise(resolve => setTimeout(resolve, 5000));

    // For now, create a simple placeholder image buffer
    // In production, this would call an actual AI service like:
    // - OpenAI DALL-E API
    // - Stability AI API
    // - Replicate API
    // - etc.

    // Create a simple placeholder image (1x1 pink pixel as PNG)
    const pinkPixelPng = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x5C, 0xC2, 0xD2, 0x4E, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    return pinkPixelPng;
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
