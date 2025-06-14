# ADR 003: Local AWS Environment with LocalStack

## Status
:heavy_check_mark: Accepted

## Context
While SST provides an excellent development experience by running Lambdas locally and connecting to AWS resources, it still depends on deploying infrastructure (DynamoDB, SQS, S3, etc.) to AWS during development.

For cost efficiency, offline development, faster iteration, and better CI integration, we need a fully local AWS-like environment. LocalStack provides a highly accurate AWS cloud emulator supporting core services like DynamoDB, S3, SQS, and SNS.

## Decision
We will integrate LocalStack into the development workflow to emulate AWS services locally. SST will be configured to interact with LocalStack instead of real AWS resources when running locally.

### Services running in LocalStack:
- :floppy_disk: DynamoDB
- :package: S3
- :email: SQS
- :loudspeaker: SNS (optional, for future extensions)
- :zap: Lambda (optional testing, but prefer local execution via SST)

### Development Workflow:
- :computer: API and Lambda functions run locally using SST (`sst dev`).
- :cloud: AWS resources (DynamoDB, S3, SQS) are mocked locally via LocalStack.
- :link: Ngrok will expose webhooks (Twitter and Stripe) during development.
- :rocket: The production deployment will continue using AWS Cloud resources.

## Consequences
- :white_check_mark: Reduces AWS costs during development.
- :fast_forward: Faster development loop without deploying stacks to AWS.
- :no_entry_sign: Enables offline development.
- :construction: Requires setting up and maintaining LocalStack Docker containers.
- :warning: May have slight differences between LocalStack and real AWS behavior (to be validated during staging deployments).

## Alternatives Considered
- Use SST with live AWS resources (current default).

    *Pros:* Simplifies configuration.

    *Cons:* Generates AWS costs, slower feedback, requires internet, and can clutter dev AWS accounts.

- Use LocalStack only for CI (skip for local dev).
    :x: *Rejected for now:* Using LocalStack both locally and in CI offers consistency.

## References
- [LocalStack Documentation](https://docs.localstack.cloud/)
- [SST GitHub - LocalStack Issues](https://github.com/serverless-stack/sst/issues)
