# Vercel Deployment Guide for VisionAI

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Account**: Your code should be in a GitHub repository
3. **MongoDB Atlas**: Set up a MongoDB database
4. **Stripe Account**: Set up Stripe for payments

## Step 1: Prepare Your Repository

1. Make sure your code is pushed to GitHub
2. Ensure all dependencies are in `package.json`
3. Verify your build scripts work locally

## Step 2: Environment Variables Setup

Create these environment variables in Vercel:

### Required Environment Variables

```bash
# Database
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/visionai?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Server
NODE_ENV=production
PORT=3000

# CORS
FRONTEND_URL=https://your-app-name.vercel.app
ALLOWED_ORIGINS=https://your-app-name.vercel.app

# Client (Vite)
VITE_API_URL=https://your-app-name.vercel.app/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (root of your project)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/spa`
   - **Install Command**: `npm install`

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

## Step 4: Configure Build Settings

In your Vercel project settings:

1. **Build Command**: `npm run build`
2. **Output Directory**: `dist/spa`
3. **Install Command**: `npm install`
4. **Node.js Version**: 18.x or higher

## Step 5: Configure Functions

Your `vercel.json` file handles the serverless functions configuration. The API routes will be automatically deployed as serverless functions.

## Step 6: Set Up Stripe Webhooks

1. Go to your Stripe Dashboard
2. Navigate to Webhooks
3. Add endpoint: `https://your-app-name.vercel.app/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook secret and add it to your environment variables

## Step 7: Test Your Deployment

1. Visit your deployed app: `https://your-app-name.vercel.app`
2. Test the API endpoints: `https://your-app-name.vercel.app/api/health`
3. Test user registration and login
4. Test payment flow with Stripe test cards

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all dependencies are in `package.json`
   - Verify TypeScript compilation
   - Check for missing environment variables

2. **API Routes Not Working**:
   - Ensure routes are properly exported
   - Check CORS configuration
   - Verify environment variables are set

3. **Database Connection Issues**:
   - Check MongoDB Atlas IP whitelist
   - Verify connection string format
   - Ensure database user has proper permissions

4. **Stripe Issues**:
   - Verify API keys are correct
   - Check webhook endpoint configuration
   - Ensure webhook secret is set

### Debug Commands

```bash
# Check build logs
vercel logs

# Check function logs
vercel logs --function api

# Redeploy
vercel --prod
```

## Post-Deployment

1. **Update Frontend URLs**: Update any hardcoded localhost URLs in your frontend code
2. **Test All Features**: Go through your app's main user flows
3. **Monitor Logs**: Use Vercel's logging to monitor for errors
4. **Set Up Monitoring**: Consider adding error tracking (Sentry, etc.)

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **CORS**: Configure CORS properly for production
3. **Rate Limiting**: Implement rate limiting for your API endpoints
4. **Input Validation**: Ensure all user inputs are properly validated

## Performance Optimization

1. **Image Optimization**: Use Vercel's image optimization
2. **Caching**: Implement proper caching strategies
3. **Bundle Size**: Monitor and optimize your JavaScript bundle size
4. **Database Indexing**: Ensure your MongoDB collections are properly indexed

## Support

If you encounter issues:

1. Check Vercel's documentation: [vercel.com/docs](https://vercel.com/docs)
2. Review your build logs in the Vercel dashboard
3. Check your function logs for API errors
4. Verify all environment variables are correctly set 