import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DatabaseRecord, ImageRequest } from "../types";

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

export class DynamoDBService {
    static async saveImageRequest(request: ImageRequest): Promise<void> {
        const record: DatabaseRecord = {
            pk: `REQUEST#${request.id}`,
            sk: `REQUEST#${request.id}`,
            gsi1pk: `USER#${request.authorId}`,
            gsi1sk: `REQUEST#${request.createdAt}`,
            ...request,
        };

        await docClient.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: record,
            })
        );
    }

    static async getImageRequest(requestId: string): Promise<ImageRequest | null> {
        const result = await docClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    pk: `REQUEST#${requestId}`,
                    sk: `REQUEST#${requestId}`,
                },
            })
        );

        if (!result.Item) return null;

        const { pk, sk, gsi1pk, gsi1sk, ...request } = result.Item;
        return request as ImageRequest;
    }

    static async updateImageRequest(requestId: string, updates: Partial<ImageRequest>): Promise<void> {
        const updateExpression = Object.keys(updates)
            .map((key) => `#${key} = :${key}`)
            .join(", ");

        const expressionAttributeNames = Object.keys(updates).reduce(
            (acc, key) => ({ ...acc, [`#${key}`]: key }),
            {}
        );

        const expressionAttributeValues = Object.entries(updates).reduce(
            (acc, [key, value]) => ({ ...acc, [`:${key}`]: value }),
            {}
        );

        await docClient.send(
            new UpdateCommand({
                TableName: TABLE_NAME,
                Key: {
                    pk: `REQUEST#${requestId}`,
                    sk: `REQUEST#${requestId}`,
                },
                UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt`,
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: {
                    ...expressionAttributeValues,
                    ":updatedAt": new Date().toISOString(),
                },
            })
        );
    }

    static async getRequestByPaymentIntent(paymentIntentId: string): Promise<ImageRequest | null> {
        const result = await docClient.send(
            new QueryCommand({
                TableName: TABLE_NAME,
                IndexName: "GSI1",
                KeyConditionExpression: "gsi1pk = :pk",
                FilterExpression: "paymentIntentId = :paymentIntentId",
                ExpressionAttributeValues: {
                    ":pk": "PAYMENT",
                    ":paymentIntentId": paymentIntentId,
                },
            })
        );

        if (!result.Items || result.Items.length === 0) return null;

        const { pk, sk, gsi1pk, gsi1sk, ...request } = result.Items[0];
        return request as ImageRequest;
    }
}
