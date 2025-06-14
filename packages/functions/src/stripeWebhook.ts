import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Stripe from "stripe";
import { QueueMessage } from "../../core/src/types";
import { DynamoDBService } from "../../core/src/utils/dynamodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

const sqsClient = new SQSClient({ region: process.env.AWS_REGION || "us-east-1" });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const sig = event.headers["stripe-signature"];
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

        if (!sig) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Missing signature" }),
            };
        }

        // Verify webhook signature
        let stripeEvent: Stripe.Event;
        try {
            stripeEvent = stripe.webhooks.constructEvent(event.body!, sig, endpointSecret);
        } catch (err) {
            console.error("Webhook signature verification failed:", err);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Webhook signature verification failed" }),
            };
        }

        console.log("Stripe webhook received:", stripeEvent.type);

        // Handle payment intent succeeded
        if (stripeEvent.type === "payment_intent.succeeded") {
            const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
            const requestId = paymentIntent.metadata.requestId;

            if (!requestId) {
                console.error("No requestId in payment intent metadata");
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "Missing requestId in metadata" }),
                };
            }

            // Update request status
            await DynamoDBService.updateImageRequest(requestId, {
                status: "payment_confirmed",
                paymentIntentId: paymentIntent.id,
            });

            // Send message to Twitter reply queue
            const queueMessage: QueueMessage = {
                type: "reply_tweet",
                requestId,
                data: {
                    paymentIntentId: paymentIntent.id,
                },
            };

            await sqsClient.send(
                new SendMessageCommand({
                    QueueUrl: process.env.TWITTER_QUEUE_URL!,
                    MessageBody: JSON.stringify(queueMessage),
                })
            );

            console.log(`Payment confirmed for request: ${requestId}`);
        }

        // Handle payment intent failed
        if (stripeEvent.type === "payment_intent.payment_failed") {
            const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
            const requestId = paymentIntent.metadata.requestId;

            if (requestId) {
                await DynamoDBService.updateImageRequest(requestId, {
                    status: "failed",
                    paymentIntentId: paymentIntent.id,
                });

                console.log(`Payment failed for request: ${requestId}`);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ received: true }),
        };
    } catch (error) {
        console.error("Error processing Stripe webhook:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal server error" }),
        };
    }
};
