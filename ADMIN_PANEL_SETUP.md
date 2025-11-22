# Admin Panel Setup & Credentials

## Admin Login Credentials

**Username:** `admin`  
**Password:** `admin123`

## Access URL

Navigate to: `http://localhost:3000/admin/login` (or your frontend URL)

## Features Implemented

### 1. Admin Dashboard (Sky View)
- Global Health Snapshot with 3 score circles:
  - Profitability Health
  - Inventory Health
  - Customer Satisfaction
- Scrollable Café Grid showing all cafés with health indicators
- Click on any café to drill down to detailed view

### 2. Café Detail View
Three tabs available:
- **Profitability Health**: Revenue trends, product performance, business metrics
- **Inventory Health**: Stock levels, freshness scores, wastage tracking
- **Customer Satisfaction**: Feedback ratings, complaints, satisfaction scores

### 3. Central Inventory Management
- View all inventory items with filters (category, status, search)
- Create dispatch orders to cafés
- Generate QR codes for batch tracking
- Monitor stock levels and freshness

### 4. Marketing & WhatsApp
- Create marketing campaigns
- Segment audiences (All, Frequent, Dormant, VIP)
- Schedule campaigns
- Track campaign performance (sent, delivered, read)

### 5. Communication Panel
- Send messages to café staff
- Priority levels (Low, Medium, High)
- Message history and read receipts

### 6. Audit Logs
- View all system actions
- Search and filter logs
- Export functionality

## Database Setup

The admin panel requires the following new tables (already created in `setupDatabase.js`):
- `admins` - Admin users
- `admin_sessions` - Admin session management
- `cafes` - Café locations
- `central_inventory` - Central stock management
- `inventory_batches` - Batch tracking
- `dispatch_orders` - Inventory dispatch orders
- `customer_feedback` - Customer feedback and ratings
- `marketing_campaigns` - Marketing campaign data
- `inventory_transfers` - Inventory movement tracking

## Seed Data

The seed data script (`backend/scripts/seedData.js`) automatically creates:
- 1 admin user (username: `admin`, password: `admin123`)
- 3 sample cafés
- 9 central inventory items
- Sample customer feedback entries

## API Endpoints

### Admin Authentication
- `POST /api/admin-auth/login` - Admin login
- `POST /api/admin-auth/verify` - Verify session
- `POST /api/admin-auth/logout` - Logout

### Admin Dashboard
- `GET /api/admin/dashboard` - Get global dashboard metrics
- `GET /api/admin/cafes` - Get all cafés
- `GET /api/admin/cafes/:cafeId` - Get café detail metrics

### Central Inventory
- `GET /api/admin/inventory` - Get inventory items
- `GET /api/admin/inventory/:sku` - Get specific item
- `POST /api/admin/inventory/dispatch` - Create dispatch order
- `GET /api/admin/inventory/dispatch/:orderId` - Get dispatch order

### Marketing
- `GET /api/admin/marketing/campaigns` - Get campaigns
- `POST /api/admin/marketing/campaigns` - Create campaign
- `POST /api/admin/marketing/campaigns/:id/send` - Send campaign

## Navigation Structure

```
/admin/login - Admin login page
/admin/dashboard - Main dashboard (Sky View)
/admin/cafes/[cafeId] - Café detail view
/admin/inventory - Central inventory management
/admin/marketing - Marketing campaigns
/admin/communication - Communication panel
/admin/audit - Audit logs
```

## Testing the Admin Panel

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

3. **Login:**
   - Navigate to `/admin/login`
   - Use credentials: `admin` / `admin123`

4. **Explore:**
   - View the Sky View dashboard
   - Click on any café to see detailed metrics
   - Navigate through different sections using the top navigation

## Notes

- The admin panel uses the same database as the main application
- All admin actions are logged in the audit trail
- Session management is similar to cashier authentication
- QR codes for dispatch orders are generated automatically
- Marketing campaigns can be sent immediately or scheduled

## Future Enhancements

- Real WhatsApp API integration
- PDF export for reports
- Advanced analytics and charts
- Real-time notifications
- Multi-language support
- Dark mode toggle

