# Dummy Data Setup

## Overview
The backend now includes seed data for testing purposes. When the backend server starts, it automatically creates:

- **12 Tables**: T-01 through T-12 (all in idle status initially)
- **5 Dummy Orders**: Mix of pending and approved orders for testing

## What Gets Seeded

### Tables
All tables are created with:
- Unique IDs (UUIDs)
- Table numbers: T-01, T-02, T-03, ..., T-12
- QR slugs matching table numbers
- Initial status: `idle`

### Dummy Orders

#### Pending Orders (3 orders - show in Paid Orders sidebar)
1. **T-02** - Rajesh Kumar
   - 2× Cappuccino (Soy Milk, Large) + 1× Butter Croissant
   - Total: ₹400
   - Payment: UPI - GPay
   - Status: `pending` (needs cashier approval)

2. **T-03** - Priya Sharma
   - 1× Classic Espresso + 2× Chocolate Chip Cookie
   - Total: ₹280
   - Payment: Card
   - Status: `pending` (needs cashier approval)

3. **T-04** - Amit Patel
   - 1× Cold Brew (Extra Ice) + 1× Butter Croissant
   - Total: ₹280
   - Payment: UPI - PhonePe
   - Notes: "Customer waiting, please prioritize"
   - Status: `pending` (needs cashier approval)

#### Approved Orders (2 orders - show on floor plan)
4. **T-08** - Sneha Reddy
   - 2× Latte (Oat Milk) + 1× Chocolate Chip Cookie
   - Total: ₹380
   - Payment: UPI - GPay
   - Status: `approved` (3 minutes ago - will show as "preparing")

5. **T-10** - Vikram Singh
   - 1× Classic Espresso
   - Total: ₹120
   - Payment: Card
   - Status: `approved` (6 minutes ago - will show as "aging")

## How to Use

### Start Backend Server
```bash
npm run backend
```

You should see:
```
✅ Seeded 12 tables: T-01, T-02, T-03, T-04, T-05, T-06, T-07, T-08, T-09, T-10, T-11, T-12
✅ Seeded 5 dummy orders
🚀 CafeFlow Backend Server running on port 4000
```

### Test the Data

1. **View Tables**: 
   ```bash
   curl http://192.168.0.106:4000/api/tables
   ```

2. **View All Orders**:
   ```bash
   curl http://192.168.0.106:4000/api/orders
   ```

3. **View Pending Orders**:
   ```bash
   curl http://192.168.0.106:4000/api/orders?status=pending
   ```

4. **View Approved Orders**:
   ```bash
   curl http://192.168.0.106:4000/api/orders?status=approved
   ```

### Frontend Testing

1. **Cashier Dashboard** (`http://192.168.0.106:3000/cashier`):
   - Should show 12 tables on floor plan
   - T-08 and T-10 should show orders (preparing/aging status)
   - Paid Orders sidebar should show 3 pending orders

2. **QR Codes Page** (`http://192.168.0.106:3000/admin/qr-codes`):
   - Should show QR codes for all 12 tables

## Resetting Data

The seed data is loaded every time the backend server starts. To reset:

1. Stop the backend server
2. Restart it: `npm run backend`
3. All data will be reset to initial seed state

**Note**: Any orders created during testing will be lost when the server restarts (since we're using in-memory storage).

## Customizing Seed Data

To modify the seed data, edit `backend/config/database.js`:

- **Change number of tables**: Modify the loop in `initializeDefaultTables()`
- **Add/remove orders**: Modify `initializeDummyOrders()`
- **Change order details**: Update the Order constructor calls

## Next Steps

1. **Test the flow**:
   - Confirm pending orders in cashier dashboard
   - Approve orders and watch them move to floor plan
   - Mark orders as served
   - Reset tables to idle

2. **Create real orders**:
   - Scan QR codes from customer app
   - Submit orders through checkout
   - Watch them appear in cashier dashboard

3. **Test QR codes**:
   - Visit `/admin/qr-codes` page
   - Download/print QR codes
   - Test scanning with phone camera

## Troubleshooting

### No tables showing
- Check backend is running: `curl http://192.168.0.106:4000/api/health`
- Check backend logs for seed messages
- Verify frontend API URL is correct

### No orders showing
- Check backend logs for "Seeded X dummy orders"
- Verify orders endpoint: `curl http://192.168.0.106:4000/api/orders`
- Check browser console for API errors

### Tables not updating
- Restart backend server to reload seed data
- Clear browser cache
- Check Socket.IO connection in browser console

