
# Stripe Test Mode Integration Setup

This document outlines the steps needed to set up the Stripe integration in **TEST MODE** for the LUMS website.

## Prerequisites

1. A Stripe account
2. A Supabase project with Edge Functions capability

## Setup Steps

### 1. Set up Stripe Environment Variables

1. Login to your Supabase dashboard
2. Go to Settings > API
3. Add the following secrets under "Edge Function Secrets":
   - `STRIPE_SECRET_KEY`: Your Stripe **TEST** secret key (from Stripe Dashboard > Developers > API keys)
   - `STRIPE_WEBHOOK_SECRET`: Generate this in the next step
   - `SUPABASE_URL`: Your Supabase project URL (already set)
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (already set)

### 2. Configure Stripe Webhook in Test Mode

1. Login to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **TEST MODE** (switch in the top-right corner should say "Test Mode")
3. Go to Developers > Webhooks
4. Add a new endpoint with the following URL:
   ```
   https://<your-supabase-project>.functions.supabase.co/payment-webhook
   ```
5. Select the following events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
6. Copy the "Signing Secret" that is generated and add it as `STRIPE_WEBHOOK_SECRET` in your Supabase Edge Function Secrets

### 3. Deploy the Edge Functions

1. Use the Supabase CLI to deploy the edge functions:
   ```bash
   supabase functions deploy create-checkout
   supabase functions deploy payment-webhook
   ```

### 4. Verify the Database Table

Ensure your members table has the necessary payment-related fields:
- payment_session_id
- payment_status
- payment_id
- payment_date
- membership_status

## Testing the Payment Flow

For testing, use the following Stripe test card numbers:
- Success: 4242 4242 4242 4242
- Requires Authentication: 4000 0025 0000 3155
- Decline: 4000 0000 0000 0002

Expiration date: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits

## Important Notes

- Make sure you're using the **TEST** API keys from your Stripe dashboard, not the live ones
- Payments made in test mode won't charge real money
- Stripe's test dashboard will show all your test transactions for review
- Remember to switch to live mode and update keys when going to production

