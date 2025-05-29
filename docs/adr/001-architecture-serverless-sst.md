# :scroll: ADR 001 – Architecture Decision: Serverless on AWS using SST

**Title**

Adoption of Serverless Architecture on AWS using SST

**Status**

:white_check_mark: Accepted – 2025-05-24

---

## :books: Context

The Twimagine project is a Twitter (X) bot that receives mentions containing prompts to generate images using AI. The workflow involves:

- :bird: Listening to mentions on Twitter.
- :framed_picture: Creating image generation requests.
- :credit_card: Sending payment links to users.
- :green_circle: Processing image generation upon payment confirmation.
- :repeat: Replying to the original mention with the generated image.

The primary goal is to build a project suitable for a professional portfolio, showcasing modern cloud-native and event-driven architectures, emphasizing:

- :balance_scale: Scalability
- :cloud: Serverless design
- :building_construction: Infrastructure as Code
- :mag: Observability, automation, and cost efficiency

### Non-functional requirements

- :gear: Scalability
- :moneybag: Low operational cost
- :wrench: Minimal infrastructure maintenance
- :mag: Observability and traceability
- :rocket: Ease of deployment and operations

---

## :arrows_counterclockwise: Alternatives considered

- :whale: VPS + Docker + NestJS + PostgreSQL + Redis
- :cloud: AWS Serverless (Lambda, API Gateway, DynamoDB, SQS, S3) using SST
- :hammer_and_wrench: PaaS (e.g., Vercel + Serverless Functions + External DB)

---

## :trophy: Decision

The selected approach is a **Serverless architecture on AWS using SST**, with the following components:

- :shield: **API Gateway + Lambda**: For handling inbound events (Twitter webhook, payment webhook)
- :file_cabinet: **DynamoDB**: For persistent storage of requests, payments, and statuses
- :mailbox_with_mail: **SQS**: For asynchronous job orchestration (image generation and Twitter replies)
- :gear: **Lambda Workers**: For processing SQS jobs, including image generation and publishing
- :card_index_dividers: **S3**: For storing generated images
- :building_construction: **SST (Serverless Stack)**: For Infrastructure as Code, enabling simplified development, local debugging, and deployment on AWS

### Key reasons

- :white_check_mark: High scalability by design
- :money_with_wings: Pay-per-use cost model — ideal for a portfolio project
- :wrench: No server maintenance required
- :rocket: Modern stack aligned with current industry standards
- :technologist: SST provides a developer-friendly experience with local debugging, hot reload, and simple deployment
- :globe_with_meridians: Demonstrates mastery in serverless, cloud, and event-driven architecture

---

## :dart: Consequences

- :cloud: The project becomes cloud-dependent (AWS)
- :large_blue_square: The tech stack is fully based on TypeScript, covering both backend and infrastructure (via SST/CDK)
- :books: Requires initial learning of SST/CDK, but the productivity gain and industry alignment are significant
- :trophy: Scalability, reliability, and resiliency are inherently managed by AWS services
- :moneybag: Operational costs remain low for small-to-moderate workloads, perfectly suited for portfolio use

