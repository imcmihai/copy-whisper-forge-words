import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

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
    const { 
      niche, 
      productName, 
      productDescription, 
      tone, 
      targetPublic, 
      textFormat, 
      textLength, 
      keywords, 
      textObjective ,
      language
    } = await req.json();

    const prompt = `Act as a professional copywriter with years of experience. Create compelling copywriting text for the following product, strictly adhering to the details provided:

Niche: ${niche || 'Unspecified'}
Product Name: ${productName || 'Unspecified'}
Product Description: ${productDescription || 'Unspecified'}

CRITICAL INSTRUCTION: The text should be written in ${language}

Additional Details:
Tone: ${tone || 'Unspecified'}
Target Audience: ${targetPublic || 'General'}
Text Format: ${textFormat || 'Unspecified'}
Text Length: ${textLength || 'Unspecified'}
Keywords to Include: ${keywords || 'None'}
Text Objective: ${textObjective || 'Unspecified'}

CRITICAL INSTRUCTION: You have to respect the Text Format and Text Length. ##Pay attention to the text objective. Make sure you are generating the text according to the text objective.##

IMPORTANT REQUIREMENTS FOR TEXT FORMAT:
- Do not use special characters like "#", "*", "^", etc., in the text.
- Ensure the text is clear, professional, and easy to read.
- Preserve the original meaning and intent.
- Use plain text with standard punctuation.
- Do not include markdown or other special formatting.

Use the following principles when creating the text:
0. The text should be conversational and personal.
1. Prioritize message impact and clarity.
2. Structure content for maximum readability.
3. Use creativity and storytelling.
4. Adopt a conversational and friendly tone (as indicated by Tone).
5. Educate and empower the reader (considering Target Audience).
6. Balance practical information with captivating elements.
7. Deepen the emotional connection.
8. Include strong calls-to-action (aligned with Text Objective).
9. Use sensory and descriptive language.
10. Personalize the message for the audience (considering Target Audience).
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using the cheaper model to be cost-effective
        messages: [
          { role: 'system', content: 'You are a professional copywriter with years of experience in creating compelling marketing copy.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    return new Response(JSON.stringify({ generatedText }), {
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
