# :scroll: ADR 002 – Technology Stack Decision

**Title**

Technology Stack Selection for Twimagine

**Status**

:white_check_mark: Accepted – 2025-05-24

---

## :books: Context

The Twimagine project requires a backend architecture capable of handling asynchronous workloads, third-party integrations (Twitter API, payment gateway, image generation API), and state management.

Key criteria for choosing the technology stack include:

- :rocket: Developer productivity
- :balance_scale: Scalability and low operational costs
- :cloud: Seamless integration with AWS serverless services
- :large_blue_square: Type safety and maintainability
- :globe_with_meridians: Industry relevance and alignment with modern backend practices

### Requirements

- :desktop_computer: Strong support for serverless computing
- :electric_plug: Easy integration with AWS SDKs and infrastructure
- :zap: High performance in asynchronous and event-driven workflows
- :technologist: Simple learning curve for quick development cycles
- :large_blue_square: Alignment with the JavaScript/TypeScript ecosystem for both backend logic and Infrastructure as Code (via SST)

---

## :trophy: Decision

### :wrench: Programming Language
- **TypeScript (Node.js runtime)**
  - TypeScript was chosen for its combination of JavaScript's flexibility with static typing, enabling better developer experience, tooling, and reduced runtime errors. TypeScript is also fully supported by SST and AWS CDK.

### :building_construction: Backend Framework
- **Native AWS Lambda functions with API Gateway (No NestJS or Express)**
  - Lambda functions will be developed using lightweight, handler-based implementations without heavy frameworks to optimize cold starts and execution time. API Gateway will handle HTTP endpoints when needed (e.g., webhooks).

### :package: Infrastructure as Code
- **SST (Serverless Stack) using AWS CDK (TypeScript)**
  - SST provides a developer-friendly abstraction over AWS CDK with features like local debugging, live Lambda development, and simple deployment workflows.

### :file_cabinet: Database
- **DynamoDB (NoSQL)**
  - Chosen for its scalability, serverless nature, and single-digit millisecond performance at any scale. Fits perfectly with event-driven workloads and ephemeral compute.

### :link: Message Queue
- **Amazon SQS (Simple Queue Service)**
  - For decoupling tasks such as image generation and Twitter replies, ensuring fault tolerance and horizontal scalability.

### :card_index_dividers: File Storage
- **Amazon S3**
  - To store generated images persistently with public access links for sharing via Twitter.

### :credit_card: Payment Provider
- **Stripe (primary)**
  - Optionally, MercadoPago could be considered for regional payment support. Stripe was selected for its mature API, excellent developer experience, and ease of webhook-based integration.

### :brain: Image Generation Provider
- **External AI image generation API (TBD, e.g., Stability AI, Replicate, or OpenAI DALL·E)**
  - Depending on licensing, cost, and API capabilities.

### :scroll: Observability
- **AWS CloudWatch Logs for basic monitoring**
- Optional integration with Datadog, AWS X-Ray, or Sentry for advanced observability and tracing.

### :arrows_counterclockwise: CI/CD
- **GitHub Actions with SST deployment workflows**
  - Includes linting, type checking, testing (if applied), and deployment pipelines.

### :art: Design & API Documentation
- **OpenAPI (Swagger) for endpoint documentation (if applicable)**
- **Twitter Developer Docs for maintaining webhook integration**

---

## :x: Alternatives Considered

| Option | Reasons for Rejection |
| ------ | --------------------- |
| NestJS + AWS Lambda (Serverless Adapter) | Adds unnecessary complexity for small services |
| Express/Fastify + AWS Lambda | Increases cold starts; not needed for simple APIs |
| PostgreSQL (via RDS or Aurora Serverless) | Higher cost and maintenance compared to DynamoDB |
| Redis (for job queue) | Adds extra services; SQS fits better serverlessly |

---

## :dart: Consequences

- :cloud: The system becomes fully serverless with a pay-per-use model
- :wrench: Simplified operational overhead — AWS handles scaling, fault tolerance, and reliability
- :large_blue_square: TypeScript unifies the language used across backend code and infrastructure code (via SST/CDK)
- :no_entry: No traditional server management (VPS, Docker) is required
- :globe_with_meridians: The architecture is highly portable for AWS but cloud-dependent
