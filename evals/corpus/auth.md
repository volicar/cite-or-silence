# Authentication

## API keys

Every request must send an API key in the `X-Api-Key` header. Keys are created in the dashboard under Settings and are shown only once, so store them in a secrets manager.

## Rotating keys

To rotate a key, create a new key, deploy it to your services, then revoke the old one. Revoked keys stop working within 60 seconds. We recommend rotating keys every 90 days.

## Rate limits

The default limit is 600 requests per minute per key. When you exceed it the API returns HTTP 429 with a `Retry-After` header that tells you how many seconds to wait.
