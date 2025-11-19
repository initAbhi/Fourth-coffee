# Quick Start Guide

## Prerequisites
- PostgreSQL running on localhost:5432
- Node.js 18+ installed
- npm installed

## Database Setup

The database will be automatically initialized when you start the backend server. Make sure PostgreSQL is running with:
- Host: localhost
- Port: 5432
- User: postgres
- Password: 12345
- Database: fourth-coffee-db (will be created automatically)

## Starting the Application

### 1. Start Backend
```bash
cd backend
npm install  # If not already done
npm start
```

The backend will:
- Connect to PostgreSQL
- Create all tables if they don't exist
- Seed products, customers, and initial data
- Start on port 4000

### 2. Start Frontend
```bash
# In project root
npm install  # If not already done
npm run dev
```

Frontend will start on http://localhost:3000

## Testing the Application

### Customer Flow
1. Open http://localhost:3000
2. Enter phone number (e.g., `9876543210` or use seeded numbers)
3. Browse menu - products loaded from database
4. Add items with customizations (sugar, temperature, milk, size)
5. Checkout - Order created, table booked
6. Click points badge → See points dashboard at `/points`
7. Points are stored by phone number

### Cashier Flow
1. Open http://localhost:3000/cashier/login
2. Login: `cashier1` / `cashier123`
3. See tables with payment status (Paid/Unpaid badges)
4. Customer orders appear automatically
5. Create manual order (F2) → Must confirm payment
6. Approve orders → Send to kitchen

### Manager Flow
1. Login: `manager1` / `manager123`
2. Access refund management
3. Approve wallet top-ups
4. View reports

## Sample Data

### Seeded Customers (with points)
- `+919876543210` - Rajesh Kumar
- `+919876543211` - Priya Sharma
- `+919876543212` - Amit Patel
- `+919876543213` - Sneha Reddy
- `+919876543214` - Vikram Singh

### Seeded Products
- Classic Espresso (₹120)
- Cappuccino (₹150)
- Cold Brew (₹180)
- Butter Croissant (₹100)
- Chocolate Chip Cookie (₹80)

### Tables
- T-01 to T-12 (all created automatically)

## Key Features Working

✅ Customer authentication by phone
✅ Products loaded from database (no hardcoded data)
✅ Orders book tables automatically
✅ Points stored by phone number
✅ Points dashboard at `/points`
✅ Cashier sees paid/unpaid tables
✅ Payment confirmation for cashier orders
✅ Customizations (sugar, temperature, milk, size)
✅ Real-time order updates via Socket.IO

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check credentials in `backend/config/db.js`
- Database name should be `fourth-coffee-db`

### Products Not Loading
- Check backend is running on port 4000
- Check API URL in `src/lib/api.ts`
- Check browser console for errors

### Points Not Showing
- Ensure customer logged in with phone number
- Check customer session in localStorage
- Points are stored by phone, so same phone = same points

### Tables Not Booking
- Check order creation includes `tableId`
- Verify table exists in database
- Check order service logs

## API Base URL

Default: `http://192.168.0.106:4000/api`

Update in `src/lib/api.ts` if your backend runs on different IP/port.


