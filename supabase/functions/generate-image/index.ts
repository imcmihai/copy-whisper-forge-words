// supabase/functions/generate-image/index.ts

// IMPORTANT: Ensure you have set the OPENAI_API_KEY environment variable in your Supabase project settings.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts' // Use a specific, stable version
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2' // Deno compatible Supabase client
// import { v4 as uuidv4 } from "https://deno.land/std@0.177.0/uuid/v4.ts"; // Deno std lib import (removed)
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.1'; // Use uuid package via esm.sh
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

// Retrieve Supabase URL and Service Role Key from environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("FATAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables not set.");
    // Optionally throw error
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

  // --- Create Supabase Admin Client --- 
  // Should be done inside the request handler if keys might change, or outside if static
  const supabaseAdminClient = createClient(supabaseUrl!, supabaseServiceRoleKey!); // Non-null assertion as we check above

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

    // 2. Parse Request Body (Remove highQuality)
    const { prompt: originalPrompt } = await req.json(); // Removed highQuality
    console.log(`Received original prompt length: ${originalPrompt?.length}`); // Removed High Quality log

    if (!originalPrompt || typeof originalPrompt !== 'string' || originalPrompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or invalid prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Determine OpenAI Model and Parameters (Remove highQuality logic)
    const model = 'dall-e-3'; // Hardcode to DALL-E 3 for consistency or choose based on tier if needed
    const size = '1024x1024'; // Default DALL-E 3 size
    const n = 1;

    // --- Prompt Truncation (Adjust max length if needed for DALL-E 3) ---
    const maxLength = 4000; // DALL-E 3 limit (~4000)
    const truncatedPrompt = originalPrompt.length > maxLength
        ? originalPrompt.substring(0, maxLength)
        : originalPrompt;

    if (originalPrompt.length > maxLength) {
        console.log(`Prompt truncated from ${originalPrompt.length} to ${maxLength} characters.`);
    }
    
    console.log(`Requesting image from OpenAI with model: ${model}, size: ${size}`);

    // 4. Construct Request Body for OpenAI API
    const requestBody = {
        model,
        prompt: truncatedPrompt,
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

    const tempImageUrl = responseData.data?.[0]?.url;

    if (!tempImageUrl) {
      console.error('No image URL found in OpenAI success response:', responseData);
      throw new Error('Image generation failed: No URL returned from OpenAI despite success status.');
    }

    console.log('Generated Temporary Image URL:', tempImageUrl);

    // --- NEW: Fetch image data and upload to Supabase Storage ---
    let permanentImageUrl = '';
    try {
        console.log('Fetching image data from temporary URL...');
        const imageResponse = await fetch(tempImageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image from temporary URL: ${imageResponse.statusText}`);
        }
        const imageBlob = await imageResponse.blob();
        console.log(`Image data fetched successfully (size: ${imageBlob.size} bytes, type: ${imageBlob.type})`);

        // Generate a unique file path
        const fileExt = 'png'; // Assuming PNG, adjust if DALL-E provides different formats
        const filePath = `generated-images/${uuidv4()}.${fileExt}`; // Use uuidv4() from esm import
        console.log(`Generated file path for Supabase Storage: ${filePath}`);

        // Upload to Supabase Storage
        console.log(`Uploading image to Supabase bucket 'generated-image'...`);
        const { data: uploadData, error: uploadError } = await supabaseAdminClient.storage
            .from('generated-image')
            .upload(filePath, imageBlob, {
                contentType: imageBlob.type || 'image/png', // Use detected type or default
                cacheControl: '3600', // Cache for 1 hour (adjust as needed)
                upsert: false, // Prevent overwriting existing files (shouldn't happen with UUIDs)
            });

        if (uploadError) {
            console.error('Error uploading image to Supabase Storage:', uploadError);
            throw new Error(`Failed to store generated image: ${uploadError.message}`);
        }
        console.log('Image uploaded successfully to Supabase Storage:', uploadData);

        // Get Public URL
        const { data: publicUrlData } = supabaseAdminClient.storage
            .from('generated-image')
            .getPublicUrl(filePath);
            
        if (!publicUrlData || !publicUrlData.publicUrl) {
            console.error('Could not get public URL for uploaded image:', filePath);
            throw new Error('Image uploaded but failed to get public URL.');
        }

        permanentImageUrl = publicUrlData.publicUrl;
        console.log('Permanent Image URL from Supabase:', permanentImageUrl);

    } catch (storageError) {
        console.error("Error during image fetch/upload process:", storageError);
        // Check if it's an Error instance before accessing .message
        const message = storageError instanceof Error ? storageError.message : String(storageError);
        // Decide if you want to return an error or potentially the temporary URL as a fallback
        // For robustness, we'll throw an error here, as the image won't be permanent.
        throw new Error(`Image processing failed: ${message}`);
    }
    // --- END NEW Storage Logic ---

    // 7. Return Success Response with Permanent URL
    return new Response(
        JSON.stringify({ imageUrl: permanentImageUrl }), // Return the permanent URL
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