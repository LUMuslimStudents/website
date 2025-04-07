
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

  try {
    // Create a Supabase client with admin privileges to update the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration is missing");
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const requestData = await req.json().catch(() => {
      throw new Error("Invalid request body format");
    });
    
    const { memberId, memberName, memberEmail, productName, amount } = requestData;

    // Validate required fields
    if (!memberId || !memberEmail) {
      throw new Error("Missing required fields: memberId and memberEmail are required");
    }

    console.log(`Creating checkout session for member ID: ${memberId}, email: ${memberEmail}`);

    // Initialize Stripe with the secret key from environment variables
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Stripe secret key is not configured. Please set it in Supabase Edge Function secrets.");
    }

    // Check if we're using a test key (starts with sk_test_)
    const isTestMode = stripeSecretKey.startsWith('sk_test_');
    console.log(`Using Stripe in ${isTestMode ? 'TEST' : 'LIVE'} mode`);

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: {
              name: productName || "LUMS Membership",
              description: "LUMS membership payment" + (isTestMode ? " (TEST MODE)" : ""),
            },
            unit_amount: amount || 10000, // 100 SEK in öre (100 SEK = 10000 öre)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin") || "https://your-website.com"}/payment-success?session_id={CHECKOUT_SESSION_ID}&member_id=${memberId}`,
      cancel_url: `${req.headers.get("origin") || "https://your-website.com"}/membership?canceled=true`,
      client_reference_id: memberId,
      customer_email: memberEmail,
      metadata: {
        member_id: memberId,
        member_name: memberName,
      },
    });

    console.log(`Created Stripe session: ${session.id}`);

    // Update member record with session ID
    const { error: updateError } = await supabaseAdmin
      .from("members")
      .update({ payment_session_id: session.id })
      .eq("id", memberId);

    if (updateError) {
      console.error("Error updating member with session ID:", updateError);
    } else {
      console.log(`Updated member ${memberId} with payment session ID`);
    }

    // Return the checkout session URL
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to create checkout session", 
        details: error.toString() 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
