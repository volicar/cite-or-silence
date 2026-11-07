# Webhooks

## Delivery and retries

Webhooks are delivered with an HTTP POST. If your endpoint does not return a 2xx status within 10 seconds, we retry up to 5 times with exponential backoff, starting at 30 seconds.

## Verifying signatures

Each webhook includes an `X-Signature` header containing an HMAC SHA-256 of the raw body, signed with your webhook secret. Always verify the signature before trusting the payload, and compare it with a constant-time function.

## Event types

Supported events are `invoice.paid`, `invoice.failed`, `key.revoked` and `usage.threshold_reached`. You can subscribe to each event type separately in the dashboard.
