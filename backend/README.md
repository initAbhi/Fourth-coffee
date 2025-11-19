# CafeFlow Backend API

A Node.js/Express backend service for managing cafe orders, tables, and kitchen operations.

## Features

- **Order Management**: Create, confirm, reject, and track orders
- **Table Management**: Manage table status and QR code assignments
- **Real-time Updates**: Socket.IO for live order updates
- **KOT Printing**: Simulated kitchen order ticket printing with retry logic
- **RESTful API**: Clean REST endpoints for all operations

## Project Structure

```
backend/
├── app.js                 # Main application entry point
├── config/
│   └── database.js       # In-memory database stores
├── controllers/
│   ├── orderController.js # Order business logic
│   ├── tableController.js # Table business logic
│   └── printerController.js # Printer operations
├── models/
│   ├── Order.js          # Order model
│   ├── Table.js          # Table model
│   └── PrintJob.js       # Print job model
├── routes/
│   ├── orderRoutes.js    # Order routes
│   ├── tableRoutes.js    # Table routes
│   └── printerRoutes.js  # Printer routes
├── services/
│   ├── printerService.js # Printer simulation service
│   └── socketService.js  # Socket.IO service
├── middleware/
│   └── errorHandler.js   # Error handling middleware
└── utils/
    └── uuid.js           # ID generation utilities
```

## Getting Started

### Installation

```bash
cd backend
npm install
```

Or from the root directory:
```bash
npm install --prefix backend
```

### Running the Server

From the backend directory:
```bash
cd backend
npm start
```

Or from the root directory:
```bash
npm run backend
```

The server will start on `http://localhost:4000` by default.

### Environment Variables

- `BACKEND_PORT`: Port for the backend server (default: 4000)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)
- `NODE_ENV`: Environment mode (development/production)

## API Endpoints

### Tables

- `GET /api/tables` - Get all tables
- `GET /api/tables/:id` - Get table by ID
- `GET /api/tables/slug/:slug` - Get table by QR slug
- `POST /api/tables` - Create new table
- `PATCH /api/tables/:id/status` - Update table status
- `POST /api/tables/:id/reset` - Reset table to idle

### Orders

- `GET /api/orders` - Get all orders (query params: `status`, `tableId`)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order (from customer)
- `POST /api/orders/:id/confirm` - Confirm order (cashier)
- `POST /api/orders/:id/reject` - Reject order
- `POST /api/orders/:id/serve` - Mark order as served

### Printer

- `GET /api/printer/health` - Get printer health status
- `GET /api/printer/status/:orderId` - Get print status for order
- `POST /api/printer/retry/:orderId` - Retry failed print job
- `GET /api/printer/jobs` - Get all print jobs

### Health

- `GET /api/health` - Health check endpoint

## Socket.IO Events

### Client → Server

- `join:cashier` - Join cashier room for order updates
- `join:kitchen` - Join kitchen room for KOT updates

### Server → Client

- `order:new` - New order created (pending)
- `order:update` - Order status updated
- `kot:update` - KOT print status updated
- `printer:update` - Printer status changed
- `initial-state` - Initial connection confirmation

## Order Flow

1. **Customer scans QR** → Lands on website with `?table=T-01` query param
2. **Customer adds items** → Adds items to cart
3. **Customer submits order** → `POST /api/orders` with table number
4. **Order appears in cashier dashboard** → Real-time via Socket.IO `order:new` event
5. **Cashier confirms order** → `POST /api/orders/:id/confirm`
6. **KOT printed** → Simulated print job queued and processed
7. **Order prepared** → Kitchen receives KOT via Socket.IO
8. **Order served** → `POST /api/orders/:id/serve`
9. **Table reset** → `POST /api/tables/:id/reset` (or automatic on serve)

## Database

Currently uses in-memory storage (Maps). To persist data:

1. Replace `config/database.js` with actual database connection
2. Update models to use database queries
3. Add migration scripts

Recommended databases: PostgreSQL, MongoDB, or SQLite.

## Testing

Test the API using curl or Postman:

```bash
# Create an order
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "table": "T-01",
    "items": [
      {"name": "Cappuccino", "quantity": 2, "price": 150}
    ],
    "total": 300,
    "paymentMethod": "Card"
  }'

# Get pending orders
curl http://localhost:4000/api/orders?status=pending

# Confirm order
curl -X POST http://localhost:4000/api/orders/{orderId}/confirm
```

## License

MIT

