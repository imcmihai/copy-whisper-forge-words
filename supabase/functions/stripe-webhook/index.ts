import { serve } from 'https://deno.land/std@1.0.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import Stripe from 'https://esm.sh/stripe@14.1.0?target=deno'

// Initialize Stripe client
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16',
})

// Get the webhook signing secret from environment variables
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

// Define CORS headers (though less critical for webhooks, good practice)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to update user profile data
// deno-lint-ignore no-explicit-any
const updateUserSubscription = async (supabaseAdmin: any, userId: string, updates: Record<string, any>) => {
  const { error } = await supabaseAdmin
    .from('profiles') // Adjust table name if different
    .update(updates)
    .eq('id', userId)

  if (error) {
    console.error(`Error updating profile for user ${userId}:`, error)
    throw new Error(`Failed to update user profile: ${error.message}`)
  }
}

// Helper function to add a credit transaction
// deno-lint-ignore no-explicit-any
const addCreditTransaction = async (supabaseAdmin: any, userId: string, amount: number, type: string, description: string) => {
  const { error } = await supabaseAdmin
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: amount,
      transaction_type: type,
      description: description
    })

  if (error) {
    console.error(`Error inserting credit transaction for user ${userId}:`, error)
    // Decide if this should be a fatal error for the webhook processing
    // For now, we log it but might let the webhook succeed if the profile update worked.
  }
}

serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    console.error('Missing stripe-signature header')
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event
  const body = await req.text() // Read body as text for signature verification

  try {
    // Verify the webhook signature
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      endpointSecret,
      undefined, // Optional timestamp tolerance
      Stripe.createSubtleCryptoProvider() // Use Deno's crypto provider
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown webhook error';
    console.error(`Webhook signature verification failed: ${errorMessage}`)
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 })
  }

  // Create Supabase Admin client for database operations
  const supabaseAdminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Handle the event
  try {
    let subscription: Stripe.Subscription | null = null;
    let userId: string | null = null;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Check if it's a subscription setup session
        if (session.mode === 'subscription' && session.subscription) {
          // Retrieve the subscription object
          const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          subscription = await stripe.subscriptions.retrieve(subscriptionId);
          userId = subscription.metadata?.supabase_user_id; // Get user ID from subscription metadata
          if (!userId) {
            console.error('Missing supabase_user_id in subscription metadata for checkout.session.completed', session.id)
            break; // Cannot process without user ID
          }
          console.log(`Checkout session completed for user ${userId}, subscription ${subscription.id}`);
          // Now let the customer.subscription.created/updated handler manage the profile update
        } else {
          console.log('Checkout session completed, but not a subscription setup:', session.id);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        subscription = event.data.object as Stripe.Subscription;
        userId = subscription.metadata?.supabase_user_id;
        if (!userId) {
            console.error('Missing supabase_user_id in subscription metadata for', event.type, subscription.id);
            break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        if (!priceId) {
            console.error('Could not find price ID in subscription items:', subscription.id);
            break;
        }

        // Fetch corresponding plan details from your DB based on Stripe Price ID
        const { data: planData, error: planError } = await supabaseAdminClient
          .from('subscriptions')
          // Select fields needed for profile update and credit transaction
          .select('name, credits_per_month')
          // Use the correct column name for matching the price ID
          .or(`stripe_price_id_monthly.eq.${priceId}`) // Check only monthly ID as yearly isn't used
          .single()

        if (planError || !planData) {
          console.error(`Plan data not found in DB for price ID ${priceId}:`, planError?.message);
          // Respond with an error so Stripe knows this ID wasn't found
          return new Response(`Webhook Error: Plan data not found for price ID ${priceId}`, { status: 400 });
          // break; // Replaced break with return to give Stripe feedback
        }

        // --- Safely handle dates ---
        let startDateISO: string | null = null;
        if (typeof subscription.current_period_start === 'number') {
          try {
            startDateISO = new Date(subscription.current_period_start * 1000).toISOString();
          } catch (e) {
            console.error(`Error converting start date timestamp ${subscription.current_period_start}:`, e);
          }
        } else {
          console.warn(`Received invalid subscription.current_period_start: ${subscription.current_period_start}`);
        }

        let endDateISO: string | null = null;
        if (typeof subscription.current_period_end === 'number') {
           try {
             endDateISO = new Date(subscription.current_period_end * 1000).toISOString();
           } catch(e) {
             console.error(`Error converting end date timestamp ${subscription.current_period_end}:`, e);
           }
        } else {
          console.warn(`Received invalid subscription.current_period_end: ${subscription.current_period_end}`);
        }
        // --- End Date Handling ---

        // Update user profile using the helper function and validated dates
        // Construct the base updates object
        // deno-lint-ignore no-explicit-any
        const updates: Record<string, any> = {
          subscription_tier: planData.name.toLowerCase(),
          credits_remaining: planData.credits_per_month, // Reset credits on new/updated subscription
          credits_total: planData.credits_per_month,
          stripe_subscription_id: subscription.id,
          // Ensure stripe_customer_id is handled correctly based on its type
          stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
        };

        // Conditionally add dates only if they are valid
        if (startDateISO) {
          updates.subscription_start_date = startDateISO;
        }
        if (endDateISO) {
          updates.subscription_end_date = endDateISO;
        }

        // Call the helper function which updates the 'profiles' table
        await updateUserSubscription(supabaseAdminClient, userId, updates);
        console.log(`Updated profile for user ${userId} to ${planData.name} tier.`);

        // Add a credit transaction for the renewal/creation using the helper function
        await addCreditTransaction(
          supabaseAdminClient,
          userId,
          planData.credits_per_month,
          'subscription_renewal', // Or 'subscription_created' based on event type if needed
          `Credits from ${planData.name} subscription`
        );
        console.log(`Added ${planData.credits_per_month} credits transaction for user ${userId}.`);

        break;
      }

      case 'customer.subscription.deleted': {
        subscription = event.data.object as Stripe.Subscription;
        userId = subscription.metadata?.supabase_user_id;
        if (!userId) {
            console.error('Missing supabase_user_id in subscription metadata for customer.subscription.deleted', subscription.id);
            break;
        }

        // Fetch details for the default 'free' plan (assuming it exists with name 'Free')
        // deno-lint-ignore no-unused-vars
        const { data: freePlanData, error: freePlanError } = await supabaseAdminClient
          .from('subscriptions')
          .select('credits_per_month')
          .eq('name', 'Free') // Assuming your free tier is named 'Free'
          .single()

        const freeCredits = freePlanData?.credits_per_month ?? 100; // Default to 100 if 'Free' plan not found

        // Update user profile to free tier
        // Set end date to now, clear stripe subscription id
        // Keep stripe customer ID
        const updates = {
          subscription_tier: 'free',
          credits_remaining: freeCredits, // Reset to free tier credits
          credits_total: freeCredits,
          subscription_end_date: new Date().toISOString(),
          stripe_subscription_id: null
        }
        await updateUserSubscription(supabaseAdminClient, userId, updates);
        console.log(`Reverted profile for user ${userId} to free tier.`);

        break;
      }

      // Add other event types to handle here (e.g., invoice.paid, invoice.payment_failed)
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
     });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error processing webhook event:', error)
    // Return a 500 Internal Server Error status code for server-side issues
    return new Response(JSON.stringify({ error: `Webhook handler failed: ${errorMessage}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
    })
  }
}) 