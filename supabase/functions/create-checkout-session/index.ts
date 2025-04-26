import { serve } from 'https://deno.land/std@0.177.0/http/server.ts' // Use a specific, stable version
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno' // Use a specific, stable version compatible with Deno

// Initialize Stripe client with the secret key from environment variables
// Ensure you have the correct types for Deno's environment variables
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16', // Specify API version
})

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

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: authUser.user.email,
        metadata: { supabase_user_id: userId }, // Link Stripe customer back to Supabase user ID
      })
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

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`, // Include session ID for confirmation
      cancel_url: `${returnUrl}?canceled=true`,
      // Metadata for the subscription (useful in webhooks)
      subscription_data: {
        metadata: { supabase_user_id: userId },
      },
      // Optionally allow promotion codes
      allow_promotion_codes: true,
    })

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