# First Aid Instructor Scheduler

Production-oriented monorepo for a first-aid instructor scheduling app with:

- Expo React Native mobile app for iOS and Android
- NestJS REST API with Swagger at `/api/docs`
- PostgreSQL and Prisma
- Redis and BullMQ worker queues
- Twilio Verify phone login
- SendGrid email queue and delivery-event storage
- Expo push notification jobs
- Microsoft Dynamics 365 / Dataverse integration module

## Repository

- `apps/api` - NestJS backend, Prisma schema, REST API, Dynamics webhook and validation commands
- `apps/worker` - background worker for email and push delivery
- `apps/mobile` - Expo Router mobile application
- `packages/shared` - shared schemas and domain enums
- `packages/config` - environment validation
- `config/dynamics-mapping.example.json` - configurable Dataverse table and column mapping example
- `docs` - setup, IT, approval, deployment, and operations notes

## Local Setup

1. Install Node.js 22 and pnpm 9.
2. Copy `.env.example` to `.env`.
3. Fill `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `API_PUBLIC_URL`, and `PASSWORD_RESET_URL`.
4. Start local services:

```bash
docker compose up postgres redis
```

5. Install and prepare the database:

```bash
pnpm install
pnpm db:generate
pnpm --filter @first-aid/api prisma:dev
pnpm db:seed
```

6. Start backend and worker:

```bash
pnpm dev
```

7. Start the mobile app:

```bash
pnpm dev:mobile
```

## Integration Setup

External credentials are intentionally not committed. Add them to environment variables, then validate:

```bash
pnpm dynamics:validate
```

The command checks Dynamics enablement, Microsoft Entra settings, authentication method, and mapping file validity. Live Dataverse access requires company-provided tenant, app registration, application user, security role, organization URL, and logical table/column names.

Admin integration status is available at:

```text
GET /api/v1/integrations/setup/status
POST /api/v1/integrations/setup/validate
```

These endpoints return configuration and validation status only. They never return secrets.

## Health Checks

```text
GET /api/v1/health
GET /api/v1/health/ready
```

The readiness endpoint checks PostgreSQL and Redis.

## Webhook Endpoints

```text
POST /api/v1/integrations/dynamics/webhook
POST /api/v1/integrations/sendgrid/events
```

Dynamics webhooks require `DYNAMICS_WEBHOOK_SECRET` and an `x-first-aid-signature` HMAC SHA-256 signature of the JSON request body.

SendGrid event webhook signature verification is enabled when `SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY` is present.

## Mobile Push Registration

The mobile app requests notification permission after sign-in, then registers the device through:

```text
POST /api/v1/devices
POST /api/v1/devices/:id/push-token
```

Push notification testing requires an Expo development build and configured Expo project credentials.

## Production Notes

- Store all secrets in a secret manager for production deployments.
- Use HTTPS only for API traffic.
- Configure CORS with explicit mobile/admin origins.
- Run migrations before each deployment.
- Use a development build for push notification testing; Expo Go is not enough for production push validation.

## Verification Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrate
pnpm dynamics:validate
```

Live Twilio, SendGrid, Expo, and Dynamics verification requires credentials and approvals listed in `docs/INFORMATION_REQUIRED_FROM_COMPANY_IT.md`.
