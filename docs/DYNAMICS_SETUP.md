# Dynamics Setup

## Option 1: Dataverse Webhook Registration

Register Dataverse webhooks for course, instructor, assignment, and availability entities. Send events to:

`POST /api/v1/integrations/dynamics/webhook`

Include `x-first-aid-signature` using an HMAC SHA-256 signature of the JSON body with `DYNAMICS_WEBHOOK_SECRET`.

The app stores webhook events with idempotency by service and event ID. Duplicate events are acknowledged without creating duplicate processing records.

## Option 2: Power Automate

Create flows triggered by relevant Dataverse table changes. The flow should call the same webhook endpoint and include the shared signature header.

## Option 3: Scheduled Incremental Sync

Set `DYNAMICS_SYNC_INTERVAL_MINUTES` and run the worker scheduler in production. This is the fallback when webhooks are not approved.

## Initial Link

Match existing records with:

- Course reference number
- Instructor employee ID
- Instructor email
- External Dataverse IDs where already known

Require administrator review for uncertain matches.
