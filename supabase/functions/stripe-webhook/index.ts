import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
// Remove Stripe SDK import
// import Stripe from 'https://esm.sh/stripe@14.1.0?target=deno'

// --- Manual Webhook Verification Dependencies ---
// Remove HMAC import
// import {
//   HMAC,
// } from "https://deno.land/x/hmac@v2.0.1/mod.ts";
import { timingSafeEqual } from "https://deno.land/std@0.177.0/crypto/timing_safe_equal.ts"; // For timing attack protection
import { decode as hexDecode } from 'https://deno.land/std@0.177.0/encoding/hex.ts';
// --- End Manual Webhook Verification Dependencies ---

// --- Stripe Event Type Definitions ---
// Base interface for objects within event.data.object
interface StripeObject {
  id: string;
  object: string; // e.g., 'subscription', 'checkout.session', 'customer'
}

// Interface for the event.data part
interface StripeEventData<T extends StripeObject = StripeObject> {
  object: T;
  previous_attributes?: Partial<T>;
}

// Main interface for the Stripe Webhook Event
type HandledStripeEventType =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | string; // Fallback for unhandled types

interface StripeWebhookEvent<T extends StripeObject = StripeObject> {
  id: string;
  type: HandledStripeEventType;
  api_version: string;
  created: number;
  data: StripeEventData<T>;
  livemode: boolean;
  pending_webhooks: number;
  request?: {
    id: string | null;
    idempotency_key: string | null;
  };
}

// Define more specific types for the data objects you expect
interface StripeCheckoutSession extends StripeObject {
  object: 'checkout.session';
  mode?: 'payment' | 'setup' | 'subscription';
  subscription?: string | null;
  customer?: string | StripeObject | null;
}

interface StripeSubscription extends StripeObject {
  object: 'subscription';
  status: string;
  metadata?: { [key: string]: string | null };
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        product: string | StripeObject;
      };
    }>;
  };
  current_period_start: number;
  current_period_end: number;
  customer: string | StripeObject;
}
// --- End Stripe Event Type Definitions ---

// Get Stripe config from environment variables
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const stripeApiVersion = '2023-10-16' // Specify API version

if (!stripeSecretKey) {
  console.error("FATAL: STRIPE_SECRET_KEY environment variable not set.");
}
if (!endpointSecret) {
  console.error("FATAL: STRIPE_WEBHOOK_SECRET environment variable not set.");
}


// Helper function for making Stripe API calls
// deno-lint-ignore no-explicit-any
async function fetchStripeAPI(endpoint: string, method: string, body?: Record<string, any>): Promise<any> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${stripeSecretKey}`,
    'Stripe-Version': stripeApiVersion,
  };

  let encodedBody: string | undefined;
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    encodedBody = body
      ? Object.entries(body)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&')
      : undefined;
  } // GET/DELETE requests don't need Content-Type or body

  const response = await fetch(`https://api.stripe.com${endpoint}`, {
    method,
    headers,
    body: encodedBody,
  });

  const responseJson = await response.json();

  if (!response.ok) {
    console.error(`Stripe API Error (${response.status}) on ${method} ${endpoint}:`, responseJson.error?.message || responseJson);
    throw new Error(`Stripe API Error: ${responseJson.error?.message || 'Unknown error'}`);
  }

  return responseJson;
}


// Helper function to verify Stripe webhook signature
// Use crypto.subtle for HMAC
async function verifyStripeSignature(signatureHeader: string, rawBody: string, secret: string): Promise<boolean> {
  const parts = signatureHeader.split(',');
  let timestamp = -1;
  let signature = '';

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') {
      timestamp = parseInt(value, 10);
    } else if (key === 'v1') {
      signature = value;
    }
  }

  if (timestamp === -1 || !signature) {
    console.error('Invalid Stripe signature header format.');
    return false;
  }

  // Prevent replay attacks (e.g., reject events older than 5 minutes)
  const tolerance = 300; // 5 minutes in seconds
  const now = Math.floor(Date.now() / 1000);
  if (timestamp < now - tolerance) {
    console.error('Webhook timestamp too old, possible replay attack.');
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const encoder = new TextEncoder();

  // Import the key for HMAC-SHA256 signing
  const key = await crypto.subtle.importKey(
    "raw", // raw format of the key - the secret itself
    encoder.encode(secret), // key material
    { name: "HMAC", hash: "SHA-256" }, // algorithm details
    false, // not extractable
    ["sign"] // key usages
  );

  // Sign the payload
  const computedSignatureArrayBuffer = await crypto.subtle.sign(
    "HMAC", // algorithm
    key, // the imported key
    encoder.encode(signedPayload) // data to sign
  );

  // Convert the ArrayBuffer signature to Uint8Array
  const computedSignatureBytes = new Uint8Array(computedSignatureArrayBuffer);

  // Decode the received signature from hex
  let receivedSignatureBytes: Uint8Array;
  try {
    receivedSignatureBytes = hexDecode(encoder.encode(signature));
  } catch (e) {
    console.error('Error decoding hex signature:', e);
    return false;
  }

  // Compare signatures using timing-safe equality
  try {
      // No longer need instanceof check as crypto.subtle.sign returns ArrayBuffer
      if (timingSafeEqual(computedSignatureBytes, receivedSignatureBytes)) {
        return true;
      }
  } catch (e) {
      console.error('Error during timingSafeEqual comparison:', e);
      // Fall through to return false if lengths differ or error occurs
  }

  console.error('Webhook signature mismatch.');
  return false;
}


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

  // Use the defined interface for the event object
  let event: StripeWebhookEvent;
  const rawBody = await req.text() // Read body as text for signature verification

  try {
    // Verify the webhook signature manually
    const isValid = await verifyStripeSignature(signature, rawBody, endpointSecret);
    if (!isValid) {
        return new Response('Webhook Error: Invalid signature', { status: 400 });
    }
    // If valid, parse the JSON body and assert the type
    event = JSON.parse(rawBody) as StripeWebhookEvent;

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown webhook error';
    console.error(`Webhook signature verification or JSON parsing failed: ${errorMessage}`)
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 })
  }

  // Create Supabase Admin client for database operations
  const supabaseAdminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Handle the event
  try {
    // Remove the generic object declaration for subscription
    // let subscription: Record<string, any> | null = null;
    let userId: string | null = null;

    // The switch statement now benefits from the typed event.type
    switch (event.type) {
      case 'checkout.session.completed': {
        // Assert the specific type for data.object based on event.type
        const session = event.data.object as StripeCheckoutSession;
        // Check if it's a subscription setup session
        if (session.mode === 'subscription' && session.subscription) {
          // Retrieve the subscription object using fetch
          const subscriptionId = session.subscription;
          let fetchedSubscription: StripeSubscription | null = null;
          try {
            // Type the result of the fetch call if possible (assuming fetchStripeAPI returns any)
            fetchedSubscription = await fetchStripeAPI(`/v1/subscriptions/${subscriptionId}`, 'GET') as StripeSubscription;
          } catch (apiError) {
            console.error(`Failed to retrieve subscription ${subscriptionId} from Stripe API after checkout:`, apiError);
            return new Response(`Webhook Error: Failed to retrieve subscription ${subscriptionId}`, { status: 500 });
          }

          // Safely access metadata after fetching and typing
          userId = fetchedSubscription?.metadata?.supabase_user_id ?? null;
          if (!userId) {
            console.error('Missing supabase_user_id in fetched subscription metadata for checkout.session.completed', session.id)
            break; // Cannot process without user ID
          }
          console.log(`Checkout session completed for user ${userId}, subscription ${subscriptionId}`);
          // Logic continues, handled by customer.subscription.created/updated...
        } else {
          console.log('Checkout session completed, but not a subscription setup:', session.id);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        // Assert the specific type for data.object
        const eventSubscription = event.data.object as StripeSubscription;
        const subscriptionId = eventSubscription?.id; // Get ID from the event

        if (!subscriptionId) {
          console.error('Subscription ID is missing in event data for', event.type);
          break;
        }

        // Retrieve the full subscription object from Stripe
        let fetchedSubscription: StripeSubscription | null = null;
        try {
          fetchedSubscription = await fetchStripeAPI(`/v1/subscriptions/${subscriptionId}`, 'GET') as StripeSubscription;
          if (!fetchedSubscription) throw new Error("Subscription data received from API was null or undefined");
        } catch (apiError) {
          console.error(`Failed to retrieve subscription ${subscriptionId} from Stripe API for ${event.type}:`, apiError);
          // Return 500 to indicate failure to process
          return new Response(`Webhook Error: Failed to retrieve subscription ${subscriptionId}`, { status: 500 });
        }

        // Now use the fetchedSubscription for all subsequent logic
        userId = fetchedSubscription?.metadata?.supabase_user_id ?? null;
        if (!userId) {
            console.error('Missing supabase_user_id in fetched subscription metadata for', event.type, fetchedSubscription?.id);
            break; // Cannot process without user ID
        }

        // Add a null check for the fetched subscription object itself (though caught above)
        // Redundant check, kept for clarity if needed later
        // if (!fetchedSubscription) {
        //     console.error('Fetched subscription object is missing for', event.type);
        //     break;
        // }

        const priceId = fetchedSubscription?.items?.data[0]?.price?.id;
        if (!priceId) {
            console.error('Could not find price ID in fetched subscription items:', fetchedSubscription?.id);
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

        // --- Safely handle dates from fetchedSubscription ---
        let startDateISO: string | null = null;
        // Add null check before accessing properties
        if (fetchedSubscription && typeof fetchedSubscription.current_period_start === 'number') {
          try {
            startDateISO = new Date(fetchedSubscription.current_period_start * 1000).toISOString();
          } catch (e) {
            console.error(`Error converting start date timestamp ${fetchedSubscription.current_period_start}:`, e);
          }
        } else {
          console.warn(`Received invalid fetchedSubscription.current_period_start: ${fetchedSubscription?.current_period_start}`);
        }

        let endDateISO: string | null = null;
        // Add null check before accessing properties
        if (fetchedSubscription && typeof fetchedSubscription.current_period_end === 'number') {
           try {
             endDateISO = new Date(fetchedSubscription.current_period_end * 1000).toISOString();
           } catch(e) {
             console.error(`Error converting end date timestamp ${fetchedSubscription.current_period_end}:`, e);
           }
        } else {
          console.warn(`Received invalid fetchedSubscription.current_period_end: ${fetchedSubscription?.current_period_end}`);
        }
        // --- End Date Handling ---

        // Access properties safely thanks to the fetchedSubscription
        const customerId = typeof fetchedSubscription.customer === 'string' ? fetchedSubscription.customer : fetchedSubscription.customer.id;

        // Update user profile using the helper function and validated dates
        // Construct the base updates object
        // deno-lint-ignore no-explicit-any
        const updates: Record<string, any> = {
          subscription_tier: planData.name.toLowerCase(),
          credits_remaining: planData.credits_per_month, // Reset credits on new/updated subscription
          credits_total: planData.credits_per_month,
          // Safely access id from fetchedSubscription
          stripe_subscription_id: fetchedSubscription.id,
          // Use the correctly extracted customerId from fetchedSubscription
          stripe_customer_id: customerId
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
        // Assert the specific type for data.object
        const eventSubscription = event.data.object as StripeSubscription; // Keep using event data here is fine
        userId = eventSubscription?.metadata?.supabase_user_id ?? null;
        if (!userId) {
            console.error('Missing supabase_user_id in subscription metadata for customer.subscription.deleted', eventSubscription?.id);
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