# Webhooks And Notifications

## Device Registration

Authenticated mobile clients register devices with `POST /api/v1/devices`. If notification permission is granted, the Expo push token is stored with the device.

Users can view active devices with `GET /api/v1/devices` and revoke one with `DELETE /api/v1/devices/:id`.

## Push Delivery

Assignment creation queues a push notification job. The worker sends Expo push notifications to every active push token for the instructor's active devices and records delivery tickets.

Production push delivery requires:

- `EXPO_ACCESS_TOKEN`
- `EXPO_PROJECT_ID`
- Android FCM credentials in EAS
- iOS APNs credentials in EAS
- A development or production build, not Expo Go

## SendGrid Delivery Events

SendGrid should call `POST /api/v1/integrations/sendgrid/events`.

When `SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY` is configured, the API verifies SendGrid's signed event webhook headers. Delivery events are stored without retaining unnecessary email content.
