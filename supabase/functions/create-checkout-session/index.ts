import { serve } from 'https://deno.land/std@0.177.0/http/server.ts' // Use a specific, stable version
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Remove Stripe SDK import
// import Stripe from 'https://esm.sh/stripe@14.1.0?target=deno'


// Get Stripe secret key from environment variables
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const stripeApiVersion = '2023-10-16' // Specify API version

if (!stripeSecretKey) {
  console.error("FATAL: STRIPE_SECRET_KEY environment variable not set.");
  // Optionally exit or handle appropriately in a real deployment
}

// Helper function for making Stripe API calls
// deno-lint-ignore no-explicit-any
async function fetchStripeAPI(endpoint: string, method: string, body: Record<string, any> | null): Promise<any> {
  const headers = {
    'Authorization': `Bearer ${stripeSecretKey}`,
    'Stripe-Version': stripeApiVersion,
    'Content-Type': 'application/x-www-form-urlencoded', // Stripe uses form encoding
  };

  // Encode body as x-www-form-urlencoded
  const encodedBody = body
    ? Object.entries(body)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    : undefined;

  const response = await fetch(`https://api.stripe.com${endpoint}`, {
    method,
    headers,
    body: encodedBody,
  });

  const responseJson = await response.json();

  if (!response.ok) {
    console.error(`Stripe API Error (${response.status}):`, responseJson.error?.message || responseJson);
    throw new Error(`Stripe API Error: ${responseJson.error?.message || 'Unknown error'}`);
  }

  return responseJson;
}


// Define CORS headers for response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or your specific frontend domain for production
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow OPTIONS for preflight requests
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { priceId, userId, returnUrl } = await req.json()

    if (!priceId || !userId || !returnUrl) {
      throw new Error('Missing required parameters: priceId, userId, or returnUrl')
    }

    // Create Supabase Admin client to interact with DB securely
    // Note: Use SERVICE_ROLE_KEY for admin actions
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user profile data (including potential existing Stripe customer ID)
    // Assuming you have a 'profiles' table linked to 'auth.users' by 'id'
    const { data: profileData, error: profileError } = await supabaseAdminClient
      .from('profiles') // Adjust table name if different
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    // Throw error if user profile doesn't exist or couldn't be fetched
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 'Not found' - we handle this case
      console.error('Supabase profile fetch error:', profileError)
      throw new Error(`Failed to fetch user profile: ${profileError.message}`)
    }

    let customerId = profileData?.stripe_customer_id

    // If user doesn't have a Stripe Customer ID, create one
    if (!customerId) {
      // Fetch user email using the Admin client (requires user ID)
      const { data: authUser, error: authUserError } = await supabaseAdminClient.auth.admin.getUserById(userId)
      if (authUserError) {
        console.error('Supabase auth user fetch error:', authUserError)
        throw new Error(`Failed to fetch auth user details: ${authUserError.message}`)
      }
      if (!authUser?.user?.email) {
          throw new Error('User email not found, cannot create Stripe customer.')
      }

      // Create Stripe customer using fetch
      const customerPayload = {
        email: authUser.user.email,
        'metadata[supabase_user_id]': userId, // Use bracket notation for metadata keys
      };
      const customer = await fetchStripeAPI('/v1/customers', 'POST', customerPayload);
      customerId = customer.id

      // IMPORTANT: Save the new Stripe Customer ID to the user's profile
      const { error: updateError } = await supabaseAdminClient
        .from('profiles') // Adjust table name if different
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)

      if (updateError) {
        console.error('Supabase profile update error:', updateError)
        // Don't throw here, maybe checkout can still proceed, but log the issue
        console.error(`Failed to save Stripe Customer ID ${customerId} for user ${userId}`)
      }
    }

    // Create Stripe Checkout Session using fetch
    const sessionPayload = {
      customer: customerId,
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1', // Ensure quantity is a string for form encoding
      mode: 'subscription',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`, // Include session ID for confirmation
      cancel_url: `${returnUrl}?canceled=true`,
      'subscription_data[metadata][supabase_user_id]': userId, // Use bracket notation
      allow_promotion_codes: 'true', // Ensure boolean is string for form encoding
    };
    const session = await fetchStripeAPI('/v1/checkout/sessions', 'POST', sessionPayload);

    // Return the Checkout session URL
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Checkout session creation error:', error)
    // Explicitly check if error is an instance of Error
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Use 400 for client-side errors, 500 for server-side
    })
  }
}) 