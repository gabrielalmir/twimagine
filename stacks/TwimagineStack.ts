import { Api, Bucket, Queue, StackContext, Table } from "sst/constructs";

export function TwimagineStack({ stack }: StackContext) {
    // DynamoDB table for storing requests, payments, and statuses
    const table = new Table(stack, "TwimagineTable", {
        fields: {
            pk: "string",
            sk: "string",
            gsi1pk: "string",
            gsi1sk: "string",
        },
        primaryIndex: { partitionKey: "pk", sortKey: "sk" },
        globalIndexes: {
            GSI1: { partitionKey: "gsi1pk", sortKey: "gsi1sk" },
        },
    });

    // S3 bucket for storing generated images
    const bucket = new Bucket(stack, "ImageBucket", {
        cors: [
            {
                allowedMethods: ["GET"],
                allowedOrigins: ["*"],
                allowedHeaders: ["*"],
            },
        ],
    });

    // SQS queue for image generation jobs
    const imageQueue = new Queue(stack, "ImageGenerationQueue", {
        consumer: {
            function: {
                handler: "packages/functions/src/imageProcessor.handler",
                timeout: "15 minutes",
                environment: {
                    TABLE_NAME: table.tableName,
                    BUCKET_NAME: bucket.bucketName,
                },
            },
        },
    });

    // SQS queue for Twitter reply jobs
    const twitterQueue = new Queue(stack, "TwitterReplyQueue", {
        consumer: {
            function: {
                handler: "packages/functions/src/twitterReply.handler",
                timeout: "2 minutes",
                environment: {
                    TABLE_NAME: table.tableName,
                    BUCKET_NAME: bucket.bucketName,
                },
            },
        },
    });

    // API Gateway with Lambda functions
    const api = new Api(stack, "TwimagineApi", {
        routes: {
            "POST /webhook/twitter": {
                function: {
                    handler: "packages/functions/src/twitterWebhook.handler",
                    environment: {
                        TABLE_NAME: table.tableName,
                        IMAGE_QUEUE_URL: imageQueue.queueUrl,
                    },
                },
            },
            "POST /webhook/stripe": {
                function: {
                    handler: "packages/functions/src/stripeWebhook.handler",
                    environment: {
                        TABLE_NAME: table.tableName,
                        TWITTER_QUEUE_URL: twitterQueue.queueUrl,
                    },
                },
            },
            "GET /health": {
                function: {
                    handler: "packages/functions/src/health.handler",
                },
            },
        },
    });

    // Grant permissions
    api.bind([table]);
    imageQueue.bind([table, bucket]);
    twitterQueue.bind([table, bucket]);

    // Grant SQS send permissions
    api.attachPermissions(["sqs:SendMessage"]);

    // Output important values
    stack.addOutputs({
        ApiEndpoint: api.url,
        TableName: table.tableName,
        BucketName: bucket.bucketName,
        ImageQueueUrl: imageQueue.queueUrl,
        TwitterQueueUrl: twitterQueue.queueUrl,
    });
}
