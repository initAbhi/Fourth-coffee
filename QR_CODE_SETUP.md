# QR Code Setup Guide

## Overview
QR codes are automatically generated for each table. Customers scan these codes to access the menu and place orders.

## Access QR Codes

### Option 1: Via Cashier Dashboard
1. Go to the cashier dashboard: `http://192.168.0.106:3000/cashier`
2. Click on **"QR Codes"** in the sidebar menu
3. View, download, or print QR codes for all tables

### Option 2: Direct URL
Navigate to: `http://192.168.0.106:3000/admin/qr-codes`

## QR Code Features

### View QR Codes
- See all table QR codes in a grid layout
- Each QR code shows:
  - Table number
  - QR code image
  - Order URL (for reference)

### Download QR Codes
- Click **"Download QR"** button on any table card
- QR code downloads as PNG image
- Filename format: `QR-T-01.png`

### Print QR Codes
- Click **"Print"** button on any table card
- Opens print dialog with formatted QR code
- Includes table number and scan instructions

### Copy URL
- Click **"Copy URL"** to copy the order link
- Share directly with customers if needed
- URL format: `http://192.168.0.106:3000?table=T-01`

## API Endpoints

### Get All QR Codes
```
GET http://192.168.0.106:4000/api/qr/all
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "tableId": "...",
      "tableNumber": "T-01",
      "tableSlug": "table-t-01",
      "qrCode": "data:image/png;base64,...",
      "url": "http://192.168.0.106:3000?table=T-01"
    }
  ]
}
```

### Get QR Code for Specific Table
```
GET http://192.168.0.106:4000/api/qr/table/{tableId}
```

### Get QR Code Info (URL only)
```
GET http://192.168.0.106:4000/api/qr/table/{tableId}/info
```

### Get QR Code as SVG
```
GET http://192.168.0.106:4000/api/qr/table/{tableId}/svg
```

## How It Works

1. **QR Code Generation**: Backend generates QR codes using the `qrcode` library
2. **URL Encoding**: Each QR code contains: `http://192.168.0.106:3000?table={TABLE_NUMBER}`
3. **Table Assignment**: When customer scans QR and places order, table number is extracted from URL
4. **Order Routing**: Order is automatically assigned to the correct table

## Configuration

### Backend Configuration
The frontend URL is configured in `backend/utils/qrCode.js`:
```javascript
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://192.168.0.106:3000';
```

### Frontend Configuration
The API URL is configured in `src/lib/api.ts`:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.106:4000/api';
```

## Using QR Codes

### For Cafe Staff
1. Print QR codes for each table
2. Place QR codes on tables or table stands
3. Ensure QR codes are visible and scannable
4. Replace damaged QR codes as needed

### For Customers
1. Scan QR code with phone camera
2. Browser opens menu automatically
3. Add items to cart
4. Checkout and pay
5. Order is sent to kitchen automatically

## Troubleshooting

### QR Code Not Scanning
- Ensure good lighting
- QR code should be clean and undamaged
- Try increasing QR code size when printing
- Check that URL is correct in QR code

### Order Not Assigning to Table
- Verify table number in URL matches database
- Check backend logs for errors
- Ensure table exists in system

### QR Code Page Not Loading
- Verify backend is running on port 4000
- Check network connectivity
- Verify IP address is correct (192.168.0.106)

## Next Steps

1. **Print QR Codes**: Download and print QR codes for all tables
2. **Place on Tables**: Attach QR codes to tables or table stands
3. **Test Scanning**: Test QR codes with a phone camera
4. **Monitor Orders**: Watch orders come in through cashier dashboard

## Notes

- QR codes are generated on-demand (not cached)
- Each table has a unique QR code
- QR codes never expire
- URL format can be customized if needed

