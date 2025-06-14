# Twimagine 🎨✨

**Twimagine** is a serverless Twitter (X) bot that generates AI-powered images based on user prompts. Users interact by mentioning the bot on Twitter with a text description of the desired image. The bot responds with a payment link, and once the payment is confirmed, Twimagine generates the image and replies to the original tweet with the result.

## :rocket: Features

- :robot: Twitter bot integration via Twitter API webhooks
- :brain: AI image generation based on user text prompts
- :credit_card: Payment workflow using Stripe
- :link: Automatic reply with the generated image after payment confirmation
- :cloud: Fully serverless architecture on AWS using SST
- :computer: Local development with LocalStack

## :scroll: Project Goals

- Build a production-grade, event-driven serverless application
- Showcase skills in cloud architecture, asynchronous processing, and API integration
- Explore serverless patterns using SST and AWS services
- Deliver a simple and scalable product suitable for portfolio demonstration

## :building_construction: Architecture

This application follows a serverless architecture on AWS with the following components:

- **API Gateway + Lambda**: Handles inbound events (Twitter webhook, payment webhook)
- **DynamoDB**: Persistent storage for requests, payments, and statuses
- **SQS**: Asynchronous job orchestration (image generation and Twitter replies)
- **Lambda Workers**: Process SQS jobs for image generation and publishing
- **S3**: Store generated images
- **SST**: Infrastructure as Code for simplified development and deployment

For detailed architecture decisions, see the [ADRs](./docs/adr/) folder.

## :gear: Tech Stack

- **Language**: TypeScript (Node.js runtime)
- **Framework**: Native AWS Lambda functions (no heavy frameworks)
- **Infrastructure**: SST (Serverless Stack) using AWS CDK
- **Database**: DynamoDB (NoSQL)
- **Message Queue**: Amazon SQS
- **File Storage**: Amazon S3
- **Payment**: Stripe
- **Image Generation**: External AI API (configurable)
- **Development**: LocalStack for local AWS emulation

## :computer: Local Development

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- AWS CLI (for LocalStack setup)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd twimagine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your actual API keys and credentials
   ```

4. **Start LocalStack and development server**
   ```bash
   npm run dev:local
   ```

   This command will:
   - Start LocalStack containers
   - Create local AWS resources (DynamoDB, S3, SQS)
   - Start SST development server

### Individual Commands

- `npm run localstack:start` - Start LocalStack containers
- `npm run localstack:stop` - Stop LocalStack containers
- `npm run localstack:setup` - Create AWS resources in LocalStack
- `npm run dev` - Start SST development server
- `npm run build` - Build the project
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests

## :cloud: Production Deployment

### Prerequisites

- AWS CLI configured with appropriate permissions
- Stripe account with API keys
- Twitter Developer account with API keys

### Deploy to AWS

1. **Configure environment variables for production**
   ```bash
   # Set up production environment variables
   export TWITTER_API_KEY=your_production_key
   export TWITTER_API_SECRET=your_production_secret
   # ... other environment variables
   ```

2. **Deploy the application**
   ```bash
   npm run deploy
   ```

3. **Set up webhooks**
   - Configure Twitter webhook URL: `https://your-api-gateway-url.com/webhook/twitter`
   - Configure Stripe webhook URL: `https://your-api-gateway-url.com/webhook/stripe`

## :wrench: Configuration

### Environment Variables

See `env.example` for all required environment variables:

- **Twitter API**: Keys and secrets from Twitter Developer Portal
- **Stripe**: API keys and webhook secrets
- **AWS**: Region and credentials (for production)
- **LocalStack**: Endpoint URL for local development

### Twitter Bot Setup

1. Create a Twitter Developer account
2. Create a new App and generate API keys
3. Set up webhook subscriptions for mentions
4. Configure the bot username in environment variables

### Stripe Setup

1. Create a Stripe account
2. Get API keys from the Stripe Dashboard
3. Set up webhook endpoints to receive payment confirmations
4. Configure webhook secrets

## :test_tube: Testing

Run tests with:
```bash
npm test
```

The project uses Vitest for testing with a Node.js environment.

## :books: Documentation

- [ADR 001: Serverless Architecture](./docs/adr/001-architecture-serverless-sst.md)
- [ADR 002: Technology Stack](./docs/adr/002-tech-stack.md)
- [ADR 003: LocalStack Integration](./docs/adr/003-localstack.md)

## :handshake: Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## :page_facing_up: License

MIT License - see LICENSE file for details

## :warning: Important Notes

- The image generation service is currently a placeholder and needs to be integrated with an actual AI service
- Make sure to configure all webhook URLs correctly in both Twitter and Stripe
- LocalStack is used for development; production uses real AWS services
- Always test locally before deploying to production
