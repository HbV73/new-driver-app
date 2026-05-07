# Operational Screens Backend Status

## Real-data connected through Driver API adapter

- Messages: reads dispatcher/system notifications from `driver_notifications`.
- Expenses: reads real miscellaneous expenses from `misc_expenses` through the adapter summary path; the existing misc expense tab still uses the existing real misc-expense implementation.
- Performance: reads aggregate stats from `driver_performance`, route aggregates from `driver_routes` / `driver_route_stops`, and work logs from `driver_activity_logs`.
- Fahrernachweis: reads available work-day records from `driver_activity_logs`.

## Adapter-placeholder only

- Inventory: `getInventory()` currently returns `null` because no production truck inventory table/API exists.
- Message replies: `sendMessageReply()` returns unsupported because `driver_notifications` is not a two-way chat schema.
- Leave requests: `getLeaveRequests()` returns an empty list and `submitLeaveRequest()` returns unsupported because no leave request table/API exists.
- Fuel expenses: no dedicated fuel receipt table/API is wired.
- Vehicle expenses: no dedicated vehicle expense table/API is wired.

## Existing tables used

- `driver_notifications`
- `misc_expenses`
- `driver_performance`
- `driver_activity_logs`
- `driver_routes`
- `driver_route_stops`

## Backend tables/API still required

### Driver inventory

Recommended endpoint:

```http
GET /driver/inventory
```

Required fields:

- truck id / vehicle id
- empty/full bins
- empty/full 60L barrels
- empty/full 30L barrels
- total oil kg
- truck capacity kg
- product inventory with id, name, quantity, unit

### Two-way driver messages

Recommended endpoints:

```http
GET /driver/messages
POST /driver/messages
PATCH /driver/messages/{id}/read
```

Required fields:

- sender: driver / dispatcher / system
- text
- timestamp
- read state
- optional media URL
- optional route stop / visit reference

### Leave requests

Recommended endpoints:

```http
GET /driver/leave-requests
POST /driver/leave-requests
```

Required fields:

- type: vacation / sick / hourly
- start date, end date
- optional start/end time
- reason
- status
- created timestamp
- document upload status/url
- manager note

### Fuel and vehicle expenses

Recommended endpoints:

```http
GET /driver/expenses
POST /driver/expenses
```

Fuel fields:

- type: diesel / adblue
- amount
- liters
- station
- receipt media URL

Vehicle expense fields:

- category
- description
- amount
- receipt media URL
- status

## Recommended next backend tasks

1. Add truck inventory source of truth and expose it via Driver API.
2. Replace `driver_notifications`-only messaging with a proper two-way `driver_messages` model.
3. Add leave request table with RLS / API authorization.
4. Unify expense data model for fuel, vehicle, and misc costs.
5. Expand `driver_activity_logs` with finalized daily compliance export fields needed by Fahrernachweis.
