
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import Stripe from "https://esm.sh/stripe@12.9.0";

// Set up CORS headers for the response
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  // Get the stripe webhook secret from environment variables
  const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeWebhookSecret) {
    console.error("Stripe webhook secret is not configured");
    return new Response(
      JSON.stringify({ error: "Webhook secret not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  // Get the stripe secret key from environment variables
  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) {
    console.error("Stripe secret key is not configured");
    return new Response(
      JSON.stringify({ error: "Stripe key not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check if we're using a test key (starts with sk_test_)
  const isTestMode = stripeSecretKey.startsWith('sk_test_');
  console.log(`Webhook received in Stripe ${isTestMode ? 'TEST' : 'LIVE'} mode`);

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });

  try {
    const body = await req.text();
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
      console.log(`Webhook event type: ${event.type}`);
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Create a Supabase client with admin privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials not configured");
      return new Response("Supabase credentials not configured", { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      
      // Update the member's status in the database
      if (session.client_reference_id) {
        console.log(`Processing completed payment for member: ${session.client_reference_id}`);
        
        const { error } = await supabase
          .from("members")
          .update({ 
            membership_status: "active",
            payment_status: "completed",
            payment_id: session.id,
            payment_date: new Date().toISOString()
          })
          .eq("id", session.client_reference_id);
          
        if (error) {
          console.error("Error updating member status:", error);
          return new Response(JSON.stringify({ error: "Error updating member" }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        console.log(`Successfully updated payment status for member: ${session.client_reference_id}`);
      } else {
        console.error("No client_reference_id found in session");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
