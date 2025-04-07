
# Stripe Integration Setup

This document outlines the steps needed to set up the Stripe integration for the LUMS website.

## Prerequisites

1. A Stripe account
2. A Supabase project with Edge Functions capability

## Setup Steps

### 1. Configure Stripe Webhook

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
5. Copy the "Signing Secret" that is generated

### 2. Configure Supabase Environment Variables

1. Login to your Supabase dashboard
2. Go to Settings > API
3. Add the following secrets under "Edge Function Secrets":
   - `STRIPE_SECRET_KEY`: Your Stripe secret key (from Stripe Dashboard > Developers > API keys)
   - `STRIPE_WEBHOOK_SECRET`: The webhook signing secret you copied earlier
   - `SUPABASE_URL`: Your Supabase project URL (already set)
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (already set)

### 3. Deploy the Edge Functions

1. Use the Supabase CLI to deploy the edge functions:
   ```bash
   supabase functions deploy create-checkout
   supabase functions deploy payment-webhook
   ```

### 4. Set Up the Database Table

1. Run the SQL migration script to create the members table with the necessary fields:
   ```sql
   -- See supabase/migrations/20231001000000_create_members_table.sql
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

- Check the Supabase Edge Function logs for errors
- Verify that webhook events are being received in the Stripe Dashboard
- Ensure the database table has the correct structure and permissions
