# VisionAI Payment System Testing Guide

## ✅ Payment System Status

The VisionAI payment system is now **fully functional** and ready for testing! All API endpoints are working correctly.

## 🧪 Test Environment Setup

### API Health Check

- **Endpoint**: `http://localhost:8080/api/ping`
- **Status**: ✅ Connected to MongoDB
- **Stripe**: ✅ Configured and working

### Payment API Test

- **Endpoint**: `http://localhost:8080/api/payments/test`
- **Available Plans**: pro, premium, enterprise
- **Stripe Integration**: ✅ Active

## 💳 Test Payment Credentials

### Stripe Test Card Numbers

Use these **test card numbers** for payment testing:

#### Successful Payments

- **Card Number**: `4242424242424242`
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

#### Test Failed Payments

- **Card Declined**: `4000000000000002`
- **Insufficient Funds**: `4000000000009995`
- **3D Secure Required**: `4000000000003220`

### Test User Account

- **Email**: `demo@test.com`
- **Password**: `password123`
- **Starting Credits**: 20 (free plan)

## 🚀 How to Test Payment Flow

### Step 1: Access Checkout Page

Visit: `http://localhost:8080/checkout?plan=pro`

### Step 2: Login/Register

If not already logged in, you'll be redirected to login page.
Use the test account credentials above.

### Step 3: Complete Payment Form

1. **Billing Information**:

   - Full Name: Any name
   - Email: Auto-filled from account

2. **Card Information**:

   - Card Number: `4242424242424242`
   - Expiry: `12/25`
   - CVC: `123`

3. **Terms**: Check the agreement box

### Step 4: Submit Payment

Click "Complete Purchase" - the payment will process instantly.

### Step 5: Success Page

You'll be redirected to: `http://localhost:8080/payment/success?payment_intent=pi_xxx`

The page will show:

- ✅ Payment successful
- Updated credit balance
- Transaction details

## 🔧 Available Plans

### Professional Plan (Recommended for Testing)

- **Price**: $29.99 (discounted from $49.99)
- **Credits**: 1,000
- **Quality**: 2K images
- **Features**: No watermarks, fast generation

### Enterprise Plan

- **Price**: $99.99
- **Credits**: Unlimited
- **Quality**: 4K images
- **Features**: All features + API access

## 🛠 API Endpoints

### Payment Intent Creation

```bash
POST /api/payments/create-payment-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "pro",
  "billingDetails": {
    "fullName": "Test User",
    "email": "demo@test.com"
  },
  "paymentMethod": "card"
}
```

### Payment Success Verification

```bash
POST /api/payments/success
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "cs_test_..."
}
```

## 🔍 Debugging

### Check Server Logs

The dev server shows real-time payment processing logs:

- Payment intent creation
- Webhook processing
- Credit updates
- User plan upgrades

### Payment Debug Page

Visit: `http://localhost:8080/payment/debug` for detailed payment system information.

### Common Issues & Solutions

1. **"Can't find API endpoint"**

   - ✅ Fixed: All endpoints are now working
   - Server restart resolved the issue

2. **Payment Failed Page**

   - ✅ Fixed: Now handles both session_id and payment_intent parameters
   - Webhook processing working correctly

3. **Credits Not Updated**
   - ✅ Fixed: Automatic credit updates via webhooks
   - Real-time user data refresh

## 🎯 Success Indicators

When testing is successful, you should see:

1. **Checkout Page**: Loads without errors, Stripe form appears
2. **Payment Processing**: "Processing Payment..." shows briefly
3. **Success Page**: Shows payment confirmation and updated credits
4. **Dashboard**: Reflects new credit balance and plan upgrade
5. **Server Logs**: Show successful payment processing

## 🚨 Security Notes

- All test payments use Stripe's test mode
- No real money is charged
- Test data is isolated from production
- Webhook endpoints are secured with signature verification

## 📞 Need Help?

If you encounter any issues during testing:

1. Check the browser developer console for errors
2. Check the server logs in terminal
3. Verify the API endpoints are responding
4. Ensure you're using test card numbers, not real ones

The payment system is now production-ready with proper error handling, security measures, and comprehensive testing capabilities!
