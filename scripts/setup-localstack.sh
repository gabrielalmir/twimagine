#!/bin/bash

# Wait for LocalStack to be ready
echo "🔄 Waiting for LocalStack to be ready..."
while ! curl -s http://localhost:4566/_localstack/health | grep -q '"dynamodb": "available"'; do
  echo "⏳ Waiting for LocalStack..."
  sleep 2
done

echo "✅ LocalStack is ready!"

# Set LocalStack endpoint
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

echo "🗄️ Creating DynamoDB table..."
aws dynamodb create-table \
    --endpoint-url http://localhost:4566 \
    --table-name twimagine-dev-TwimagineTable \
    --attribute-definitions \
        AttributeName=pk,AttributeType=S \
        AttributeName=sk,AttributeType=S \
        AttributeName=gsi1pk,AttributeType=S \
        AttributeName=gsi1sk,AttributeType=S \
    --key-schema \
        AttributeName=pk,KeyType=HASH \
        AttributeName=sk,KeyType=RANGE \
    --global-secondary-indexes \
        IndexName=GSI1,KeySchema=[{AttributeName=gsi1pk,KeyType=HASH},{AttributeName=gsi1sk,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

echo "🪣 Creating S3 bucket..."
aws s3 mb s3://twimagine-dev-imagebucket --endpoint-url http://localhost:4566

echo "📬 Creating SQS queues..."
aws sqs create-queue \
    --endpoint-url http://localhost:4566 \
    --queue-name twimagine-dev-ImageGenerationQueue

aws sqs create-queue \
    --endpoint-url http://localhost:4566 \
    --queue-name twimagine-dev-TwitterReplyQueue

echo "🎉 LocalStack setup complete!"
echo ""
echo "🔍 Available resources:"
echo "  - DynamoDB table: twimagine-dev-TwimagineTable"
echo "  - S3 bucket: twimagine-dev-imagebucket"
echo "  - SQS queues: twimagine-dev-ImageGenerationQueue, twimagine-dev-TwitterReplyQueue"
echo ""
echo "🚀 You can now run 'npm run dev' to start the development server"
