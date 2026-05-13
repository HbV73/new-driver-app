# Driver REST API Contract

This app currently uses Supabase through `src/services/driverApi/supabaseDriverApi.ts`.
The UI should continue calling hooks and services, not Supabase directly. The future backend
should implement the same driver operations exposed by `DriverApi`.

## Configuration

- `VITE_DRIVER_API_PROVIDER=supabase` uses the current Supabase adapter.
- `VITE_DRIVER_API_PROVIDER=rest` selects the placeholder REST adapter.
- `VITE_DRIVER_API_BASE_URL=https://apis.germanwm.de` is the project base URL for REST.

## Auth Assumptions

REST requests should use the app's authenticated session token:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

The backend should resolve the driver identity from the token. Client-supplied `driverUserId`
may be sent for compatibility, but the server must not trust it for authorization.

## Error Format

Use one predictable error shape for all non-2xx responses:

```json
{
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "No route exists for this driver and date.",
    "details": {
      "routeDate": "2026-05-05"
    },
    "retryable": false
  }
}
```

Recommended HTTP statuses:

- `400` validation error
- `401` missing/expired token
- `403` driver cannot access this route/stop
- `404` route/stop/message not found
- `409` stale route version or duplicate completion
- `422` business-rule rejection
- `429` rate limit
- `500` server error
- `503` temporary outage, retryable

## Route Payload

The REST adapter should return a backend-neutral route DTO that can be normalized into the
current `DriverRouteData` shape.

```json
{
  "route": {
    "id": "route_uuid",
    "routeDate": "2026-05-05",
    "routeCode": "DRV-20260505-01",
    "status": "dispatched",
    "driverUserId": "auth_user_uuid",
    "plannedStartAt": "2026-05-05T06:00:00Z",
    "plannedEndAt": "2026-05-05T13:30:00Z",
    "startAddress": "Depot address",
    "startLat": 52.3759,
    "startLng": 9.732,
    "endAddress": "Depot address",
    "estimatedTotalOilKg": 180,
    "collectedTotalOilKg": 48
  },
  "stops": [
    {
      "id": "stop_uuid",
      "routeId": "route_uuid",
      "stopOrder": 1,
      "status": "pending",
      "stopType": "customer_visit",
      "visitSource": "scheduled",
      "externalRef": "976",
      "customerName": "Customer GmbH",
      "customerRef": "C-976",
      "customerTier": "gold",
      "address": "Street 1, City",
      "contactPerson": "Name",
      "contactPhone": "+49...",
      "contractPrice": 60,
      "lat": 52.38,
      "lng": 9.73,
      "scheduledTime": "08:30",
      "plannedArrivalAt": "2026-05-05T06:30:00Z",
      "plannedDepartureAt": "2026-05-05T06:50:00Z",
      "arrivedAt": null,
      "serviceStartedAt": null,
      "departedAt": null,
      "completedAt": null,
      "estimatedOilKg": 50,
      "minimumOilKg": 34,
      "collectedOilKg": null,
      "customerNotes": "Driver-visible note",
      "adminNotes": "Dispatcher note",
      "bankUpdateRequired": false,
      "containersExpected": [],
      "containersPicked": [],
      "containersDropped": [],
      "productsExpected": [],
      "productsDelivered": []
    }
  ]
}
```

## Endpoints

### Get Today's Route

```http
GET /driver/routes/today
```

Response: route payload above, or `204 No Content` when no route is assigned.

### Get Route By Date

```http
GET /driver/routes?date=2026-05-05
```

Response: route payload above, or `204 No Content`.

### Update Stop Status

```http
PATCH /driver/route-stops/{stopId}/status
```

Request:

```json
{
  "status": "arrived",
  "arrivedAt": "2026-05-05T07:02:00Z",
  "serviceStartedAt": null,
  "departedAt": null,
  "completedAt": null,
  "skippedAt": null,
  "skipReason": null,
  "collectedOilKg": null,
  "clientMutationId": "uuid-for-idempotency",
  "baseVersion": 12
}
```

Response:

```json
{
  "ok": true,
  "stop": {
    "id": "stop_uuid",
    "status": "arrived",
    "version": 13,
    "updatedAt": "2026-05-05T07:02:00Z"
  }
}
```

### Submit Proof Of Collection

```http
POST /driver/proof-of-collection
```

Request:

```json
{
  "visitRef": "stop_uuid_or_external_ref",
  "customerName": "Customer GmbH",
  "netWeightKg": 48,
  "grossWeightKg": null,
  "tareWeightKg": null,
  "signatureDataUrl": "data:image/png;base64,...",
  "signerName": "Customer",
  "photoDataUrls": [],
  "containersPicked": [{ "id": "BIN-276", "at": "09:14" }],
  "containersDropped": [],
  "notes": "",
  "gps": {
    "lat": 52.38,
    "lng": 9.73,
    "accuracyM": 12
  },
  "collectedAt": "2026-05-05T07:14:00Z",
  "clientMutationId": "uuid-for-idempotency"
}
```

Response:

```json
{
  "ok": true,
  "queued": false,
  "proofId": "proof_uuid"
}
```

For large media, the preferred production flow is a signed upload URL endpoint followed by a
metadata submit request that references uploaded media IDs.

### Get Inventory

```http
GET /driver/inventory
```

Response:

```json
{
  "truckId": "truck_12",
  "emptyBins": 18,
  "fullBins": 2,
  "emptyBarrels60": 6,
  "fullBarrels60": 1,
  "emptyBarrels30": 4,
  "fullBarrels30": 0,
  "totalOilKg": 120,
  "truckCapacityKg": 900,
  "products": [
    { "id": "sku-1", "name": "Frittierfett 10 l", "quantity": 12, "unit": "Stueck" }
  ]
}
```

### Get Messages

```http
GET /driver/messages?limit=50&after=<cursor>
```

Response:

```json
{
  "messages": [
    {
      "id": "msg_uuid",
      "text": "Please add one urgent stop.",
      "sender": "dispatcher",
      "timestamp": "2026-05-05T08:00:00Z",
      "read": false,
      "type": "text",
      "mediaUrl": null,
      "visitId": "stop_uuid"
    }
  ],
  "nextCursor": null
}
```

### Submit Expense

```http
POST /driver/expenses
```

Request:

```json
{
  "category": "fuel",
  "amount": 84.55,
  "currency": "EUR",
  "description": "Diesel",
  "occurredAt": "2026-05-05T10:30:00Z",
  "receiptMediaId": "media_uuid",
  "clientMutationId": "uuid-for-idempotency"
}
```

Response:

```json
{
  "ok": true,
  "expenseId": "expense_uuid"
}
```

## Offline Sync Considerations

- Every mutating endpoint should accept `clientMutationId` and be idempotent.
- Responses should include server `version` or `updatedAt` for conflict handling.
- The client should queue mutations locally when offline and replay in original order.
- Backend should reject stale writes with `409` and return the current server record.
- Media upload should support resumable or signed-url upload before final mutation replay.
- Route payloads should include enough timestamps and status fields to rebuild local state.
- Avoid server-only computed fields that the app cannot cache for offline operation.
