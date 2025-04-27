import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Check for API Key
  if (!openAIApiKey) {
      console.error("FATAL: OPENAI_API_KEY environment variable not set.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  }

  try {
    // Destructure model from the request body, default to gpt-4o-mini if not provided
    const { originalText, userInstructions, previousMessages, model = 'gpt-4o-mini' } = await req.json();
    
    console.log(`Revising copy with model: ${model}`);

    // Basic validation
    if (!originalText || !userInstructions) {
        return new Response(JSON.stringify({ error: 'Missing originalText or userInstructions' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    const messages = [
      { 
        role: 'system', 
        content: `You act as a professional copywriter with years of experience who helps improve marketing texts.
Analyze the user's request and adjust the original text based on that request.
Respond only with the new version of the text, without any additional explanation.

Use the following principles in the text revision:

Prioritize message impact and clarity

Structure content for maximum readability

Use creativity and storytelling

Adopt a conversational, friendly tone

Educate and empower the reader

Balance practical info with engaging elements

Deepen the emotional connection

Include strong calls to action

Use sensory and descriptive language

Personalize the message for the audience` 
      },
      {
        role: 'assistant',
        content: originalText
      }
    ];

    // Add previous messages if they exist
    if (previousMessages && Array.isArray(previousMessages) && previousMessages.length > 0) {
      for (const msg of previousMessages) {
        // Basic validation of message structure
        if (typeof msg === 'object' && msg !== null && typeof msg.content === 'string' && typeof msg.isUser === 'boolean') {
          // Skip adding the original assistant message again if present in history
          if (msg.content === originalText && !msg.isUser) continue;
          messages.push({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content
          });
        } else {
            console.warn('Skipping invalid message structure in previousMessages:', msg);
        }
      }
    }

    // Add the current user instruction
    messages.push({ role: 'user', content: `Please revise the previous text based on these instructions: ${userInstructions}` });

    // Call OpenAI API using fetch
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model, // Use the model from the request body
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000, // Adjust as needed
      }),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', responseData);
      const errorDetail = responseData.error?.message || `HTTP status ${response.status}`;
      throw new Error(`OpenAI API request failed: ${errorDetail}`);
    }
    
    const revisedText = responseData.choices?.[0]?.message?.content;

    if (!revisedText) {
        console.error('No revised text found in OpenAI response:', responseData);
        throw new Error('Revision failed: No content returned from OpenAI.');
    }

    return new Response(JSON.stringify({ revisedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in revise-copywriting function:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    let status = 500; 
    if (errorMessage.includes('OpenAI API request failed')) { status = 502; } // Bad Gateway for upstream errors
    else if (errorMessage.includes('Missing originalText') || errorMessage.includes('userInstructions')) { status = 400; }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
