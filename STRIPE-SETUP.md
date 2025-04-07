
# Stripe Integration Setup

This document outlines the steps needed to set up the Stripe integration for the LUMS website.

## Prerequisites

1. A Stripe account
2. A Supabase project with Edge Functions capability

## Setup Steps

### 1. Set up Stripe Environment Variables

1. Login to your Supabase dashboard
2. Go to Settings > API
3. Add the following secrets under "Edge Function Secrets":
   - `STRIPE_SECRET_KEY`: Your Stripe secret key (from Stripe Dashboard > Developers > API keys)
   - `STRIPE_WEBHOOK_SECRET`: Generate this in the next step
   - `SUPABASE_URL`: Your Supabase project URL (already set)
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (already set)

### 2. Configure Stripe Webhook

1. Login to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to Developers > Webhooks
3. Add a new endpoint with the following URL:
   ```
   https://<your-supabase-project>.functions.supabase.co/payment-webhook
   ```
4. Select the following events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
5. Copy the "Signing Secret" that is generated and add it as `STRIPE_WEBHOOK_SECRET` in your Supabase Edge Function Secrets

### 3. Deploy the Edge Functions

1. Use the Supabase CLI to deploy the edge functions:
   ```bash
   supabase functions deploy create-checkout
   supabase functions deploy payment-webhook
   ```

### 4. Verify the Database Table

1. Check that the members table is set up correctly:
   ```sql
   -- The migration script creates:
   -- - A members table with payment fields
   -- - RLS policies for security
   -- - An update trigger for timestamps
   ```

## Testing the Integration

1. To test the payment flow:
   - Go to your website's membership page
   - Fill out the form and submit
   - Complete the payment using Stripe's test cards (e.g., 4242 4242 4242 4242)
   - Check the members table in Supabase to verify the payment status was updated

## Stripe Test Cards

For testing, use the following test card numbers:
- Success: 4242 4242 4242 4242
- Requires Authentication: 4000 0025 0000 3155
- Decline: 4000 0000 0000 0002

Expiration date: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits

## Troubleshooting

- **Error: "Failed to fetch"** - This typically means your Edge Function isn't accessible. Check:
  - Supabase Edge Functions are properly deployed
  - Environment variables are set correctly
  - No CORS issues (the code includes CORS headers)
  
- **Payment created but status not updated** - This may indicate webhook issues:
  - Check that the webhook URL is correctly configured in Stripe
  - Verify the webhook secret is set properly in Supabase
  - Look at Supabase Edge Function logs for errors

- **Database errors** - If you see database-related errors:
  - Check that the members table exists and has the correct schema
  - Verify RLS policies are properly set up
  - Test database access from the Edge Functions
