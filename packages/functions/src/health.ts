import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
            message: "Twimagine API is healthy! 🎨✨",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            status: "ok",
        }),
    };
};
