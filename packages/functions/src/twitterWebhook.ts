import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import crypto from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import { ImageRequest, QueueMessage } from "../../core/src/types";
import { DynamoDBService } from "../../core/src/utils/dynamodb";

const sqsClient = new SQSClient({ region: process.env.AWS_REGION || "us-east-1" });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        console.log("Twitter webhook received:", JSON.stringify(event.body));

        // Verify Twitter webhook signature
        if (!verifyTwitterSignature(event)) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: "Invalid signature" }),
            };
        }

        const body = JSON.parse(event.body || "{}");

        // Handle Twitter CRC challenge
        if (event.queryStringParameters?.crc_token) {
            const crcToken = event.queryStringParameters.crc_token;
            const responseToken = crypto
                .HmacSHA256(crcToken, process.env.TWITTER_WEBHOOK_SECRET!)
                .toString(crypto.enc.Base64);

            return {
                statusCode: 200,
                body: JSON.stringify({ response_token: `sha256=${responseToken}` }),
            };
        }

        // Process tweet mention
        if (body.tweet_create_events) {
            for (const tweet of body.tweet_create_events) {
                // Skip if it's our own tweet or a retweet
                if (tweet.user.screen_name === process.env.TWITTER_BOT_USERNAME || tweet.retweeted_status) {
                    continue;
                }

                // Check if bot is mentioned
                const botMentioned = tweet.entities.user_mentions?.some(
                    (mention: any) => mention.screen_name === process.env.TWITTER_BOT_USERNAME
                );

                if (!botMentioned) continue;

                // Extract prompt from tweet text
                const prompt = extractPromptFromTweet(tweet.text);
                if (!prompt) continue;

                // Create image request
                const requestId = uuidv4();
                const imageRequest: ImageRequest = {
                    id: requestId,
                    tweetId: tweet.id_str,
                    authorId: tweet.user.id_str,
                    authorUsername: tweet.user.screen_name,
                    prompt,
                    status: "pending_payment",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                // Save to database
                await DynamoDBService.saveImageRequest(imageRequest);

                // Send message to SQS queue for payment processing
                const queueMessage: QueueMessage = {
                    type: "generate_image",
                    requestId,
                };

                await sqsClient.send(
                    new SendMessageCommand({
                        QueueUrl: process.env.IMAGE_QUEUE_URL!,
                        MessageBody: JSON.stringify(queueMessage),
                    })
                );

                console.log(`Image request created: ${requestId} for tweet: ${tweet.id_str}`);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Webhook processed successfully" }),
        };
    } catch (error) {
        console.error("Error processing Twitter webhook:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" }),
        };
    }
};

function verifyTwitterSignature(event: APIGatewayProxyEvent): boolean {
    const signature = event.headers["x-twitter-webhooks-signature"];
    const secret = process.env.TWITTER_WEBHOOK_SECRET!;

    if (!signature || !secret) return false;

    const hash = crypto.HmacSHA256(event.body || "", secret).toString(crypto.enc.Base64);
    const expectedSignature = `sha256=${hash}`;

    return signature === expectedSignature;
}

function extractPromptFromTweet(text: string): string | null {
    // Remove bot mention and extract the prompt
    const botUsername = process.env.TWITTER_BOT_USERNAME;
    const mentionRegex = new RegExp(`@${botUsername}\\s*`, "gi");
    const prompt = text.replace(mentionRegex, "").trim();

    // Minimum prompt length check
    if (prompt.length < 10) return null;

    return prompt;
}
