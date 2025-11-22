# Razorpay Payment Integration

## Overview
Razorpay payment gateway has been fully integrated into the CafeFlow application for both customer and cashier payment flows.

## Backend Setup

### 1. Dependencies
- `razorpay` - Razorpay Node.js SDK
- `crypto` - Built-in Node.js module for signature verification

### 2. Environment Variables Required
Add these to your `.env` file:
```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Database Schema Updates
The `payments` table has been updated to include Razorpay-specific fields:
- `razorpay_order_id` - Razorpay order ID
- `razorpay_payment_id` - Razorpay payment ID
- `razorpay_signature` - Payment signature for verification
- `gateway` - Payment gateway (default: 'razorpay')
- `status` - Payment status ('pending', 'completed', 'failed', 'refunded')
- `currency` - Payment currency (default: 'INR')
- `completed_at` - Timestamp when payment was completed

### 4. Backend Routes
- `POST /api/payments/createorder` - Create Razorpay order
- `POST /api/payments/verifypayment` - Verify payment and create order (for new orders)
- `POST /api/payments/verifypayment/:orderId` - Verify payment for existing order

### 5. Backend Services
- `backend/services/paymentService.js` - Handles Razorpay order creation and payment verification
- `backend/controllers/paymentController.js` - Payment API endpoints

## Frontend Setup

### 1. Environment Variables Required
Add these to your `.env.local` or `.env` file:
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 2. Frontend Services
- `src/services/razorpayService.ts` - Razorpay payment integration service
  - `loadRazorpayScript()` - Dynamically loads Razorpay checkout script
  - `initiateRazorpayPayment()` - Initiates Razorpay payment flow
  - `verifyPaymentForOrder()` - Verifies payment for existing order

### 3. Integration Points

#### Customer Checkout Flow
- **File**: `src/components/CheckoutScreen.tsx`
- **Payment Methods**: Card, Wallet (both use Razorpay)
- **Flow**:
  1. Customer selects "Card" or "Wallet" payment method
  2. Clicks "Pay" button
  3. Razorpay checkout opens
  4. Customer completes payment
  5. Payment is verified on backend
  6. Order is created with payment status "paid"
  7. Loyalty points are awarded

#### Cashier Payment Flow
- **File**: `src/components/cashier/PaymentConfirmationModal.tsx`
- **Payment Methods**: Card, Wallet (both use Razorpay)
- **Flow**:
  1. Cashier selects "Card" or "Wallet" for existing order
  2. Clicks "Confirm Payment"
  3. Razorpay checkout opens
  4. Customer completes payment
  5. Payment is verified on backend
  6. Order payment status is updated to "paid"
  7. Payment record is created

## Payment Flow

### For New Orders (Customer Checkout)
1. Frontend calls `/api/payments/createorder` with amount
2. Backend creates Razorpay order and returns order ID
3. Frontend opens Razorpay checkout with order ID
4. Customer completes payment
5. Razorpay returns payment response
6. Frontend calls `/api/payments/verifypayment` with payment details and order info
7. Backend verifies signature and creates order + payment record
8. Success response returned to frontend

### For Existing Orders (Cashier Payment)
1. Cashier selects payment method (Card/Wallet)
2. Frontend calls `/api/payments/createorder` with order total
3. Backend creates Razorpay order and returns order ID
4. Frontend opens Razorpay checkout
5. Customer completes payment
6. Frontend calls `/api/payments/verifypayment/:orderId` with payment details
7. Backend verifies signature and updates order + creates payment record
8. Success response returned to frontend

## Security Features
- Payment signature verification using HMAC SHA256
- All payment verification happens on backend
- Payment records stored in database with full transaction details
- Support for both test and production Razorpay keys

## Testing
1. Use Razorpay test keys for development
2. Test payment flow with test cards:
   - Success: 4111 1111 1111 1111
   - Failure: 4000 0000 0000 0002
3. Verify payment records are created in database
4. Check order payment status is updated correctly

## Notes
- Razorpay script is loaded dynamically to avoid blocking page load
- Payment cancellation is handled gracefully
- Error messages are user-friendly
- All payment transactions are logged in the database

