import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalText, userInstructions, previousMessages } = await req.json();

    const messages = [
      { 
        role: 'system', 
        content: `You act as a professional copywriter with years of experience who helps improve marketing texts.
Analyze the user’s request and adjust the original text based on that request.
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

    if (previousMessages && previousMessages.length > 0) {
      for (const msg of previousMessages) {
        if (msg.content === originalText && msg.role === 'assistant') continue;
        messages.push({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }

    messages.push({ role: 'user', content: `Please revise the following text based on the user's instructions: ${userInstructions}` });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', 
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'Unknown error from OpenAI');
    }
    
    const revisedText = data.choices[0].message.content;

    return new Response(JSON.stringify({ revisedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
