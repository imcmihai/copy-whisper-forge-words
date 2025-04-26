// supabase/functions/generate-image/index.ts

// IMPORTANT: Ensure you have set the OPENAI_API_KEY environment variable in your Supabase project settings.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts' // Use a specific, stable version
// Note: Importing Supabase client is not strictly needed here unless you plan to 
// interact with your database within this function (e.g., double-checking user permissions
// or logging the request before calling OpenAI). For this example, we assume 
// credit checking/deduction is handled separately (e.g., in the calling component via useCredits).

console.log('generate-image function booting up...');

// Retrieve OpenAI API Key from environment variables
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
if (!openAIApiKey) {
    console.error("FATAL: OPENAI_API_KEY environment variable not set.");
    // Optionally, you could throw an error here to prevent the function from starting
    // throw new Error("OPENAI_API_KEY not set");
}

// OpenAI API Endpoint for image generation
const OPENAI_IMAGE_ENDPOINT = 'https://api.openai.com/v1/images/generations';

// CORS Headers - Adjust allowed origins as needed for security
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins (for development) - restrict in production!
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS requests
}

serve(async (req) => {
  console.log(`Request received: ${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  // Check if API key is available (in case the function started despite the earlier check)
  if (!openAIApiKey) {
      console.error("OpenAI API Key is missing.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  }

  try {
    // 1. Authentication/Authorization (Optional but Recommended)
    // You might want to verify the user's JWT here to ensure they are logged in
    // before proceeding with the potentially expensive OpenAI call.
    // Example (requires Supabase client setup):
    // const authHeader = req.headers.get('Authorization')
    // if (!authHeader) throw new Error('Missing authorization header')
    // const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } })
    // const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    // if (userError || !user) throw new Error('User not authenticated')
    // console.log('Authenticated user:', user.id);
    // Add checks here if only certain subscription tiers can use this function

    // 2. Parse Request Body
    const { prompt: originalPrompt, highQuality } = await req.json();
    console.log(`Received original prompt length: ${originalPrompt?.length}, High Quality: ${highQuality}`);

    if (!originalPrompt || typeof originalPrompt !== 'string' || originalPrompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or invalid prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Determine OpenAI Model and Parameters
    const model = highQuality ? 'dall-e-3' : 'dall-e-2';
    const size = highQuality ? '1024x1024' : '512x512';
    const n = 1;

    // --- ADDED: Truncate prompt based on model limit ---
    const maxLength = highQuality ? 4000 : 1000; // DALL-E 3 limit (~4000), DALL-E 2 limit (1000)
    const truncatedPrompt = originalPrompt.length > maxLength
        ? originalPrompt.substring(0, maxLength)
        : originalPrompt;

    if (originalPrompt.length > maxLength) {
        console.log(`Prompt truncated from ${originalPrompt.length} to ${maxLength} characters.`);
    }
    // --- END Truncation ---

    console.log(`Requesting image from OpenAI with model: ${model}, size: ${size}`);

    // 4. Construct Request Body for OpenAI API (Use truncated prompt)
    const requestBody = {
        model,
        prompt: truncatedPrompt, // Use the truncated prompt here
        n,
        size,
        response_format: 'url',
    };

    // 5. Call OpenAI API using fetch
    const response = await fetch(OPENAI_IMAGE_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    console.log(`OpenAI API response status: ${response.status}`);

    // 6. Process Response
    const responseData = await response.json();

    if (!response.ok) {
        console.error('OpenAI API error:', responseData);
        // Try to extract a meaningful error message from OpenAI response
        const errorDetail = responseData.error?.message || `HTTP status ${response.status}`;
        throw new Error(`OpenAI API request failed: ${errorDetail}`);
    }

    const imageUrl = responseData.data?.[0]?.url;

    if (!imageUrl) {
      console.error('No image URL found in OpenAI success response:', responseData);
      throw new Error('Image generation failed: No URL returned from OpenAI despite success status.');
    }

    console.log('Generated Image URL:', imageUrl);

    // 7. Return Success Response
    return new Response(
        JSON.stringify({ imageUrl }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-image function:', error);
    // Provide a more specific error message if the error is from OpenAI due to truncation issues
    let errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    let status = 500;

    // Check if the error is specifically about the prompt length even after truncation (less likely now)
    if (errorMessage.includes('Invalid \'prompt\'') && errorMessage.includes('too long')) {
        errorMessage = "Failed to generate image: Processed prompt still invalid for OpenAI.";
        status = 400;
    }
    // Keep other specific error checks if needed
    else if (errorMessage.includes('User not authenticated') || errorMessage.includes('Missing authorization header')) {
        status = 401;
    } else if (errorMessage.includes('Missing or invalid prompt')) {
        status = 400;
    } else if (errorMessage.includes('OpenAI API request failed')) {
        status = 502; // Use 502 Bad Gateway for upstream API failure
    }
    
    return new Response(
        JSON.stringify({ error: errorMessage }), 
        {
            status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
    );
  }
})

console.log('generate-image function initialized.'); 