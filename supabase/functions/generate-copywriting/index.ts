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

    const prompt = `You are a professional copywriter with years of experience. Your task is to create highly engaging and persuasive marketing copy based on the following product details.




⚠️IMPORTANT: WRITE ONLY IN ${language.toUpperCase()}. DO NOT MIX LANGUAGES. DO NOT WRITE IN ROMANIAN OR ANY OTHER LANGUAGE.

---

📦 Product Details:
- Niche: ${niche || 'Unspecified'}
- Product Name: ${productName || 'Unspecified'}
- Product Description: ${productDescription || 'Unspecified'}

✍️ Writing Requirements:
1. Format: ${textFormat || 'Unspecified'}
2. Text Length: ${textLength || 'Unspecified'} words
3. Objective: ${textObjective || 'Unspecified'}
4. Tone: ${tone || 'Unspecified'} (must match objective and target audience)
5. Target Audience: ${targetPublic || 'General'}
6. Keywords to use heavily for SEO: ${keywords || 'Unspecified'}

---

🧠 Use the following principles when writing:
0. The text must be conversational and personal.
1. Prioritize impact and clarity.
2. Structure content for readability.
3. Include storytelling and creativity.
4. Keep the tone friendly and consistent.
5. Educate and empower the reader.
6. Balance information with captivating elements.
7. Build emotional connection.
8. Include strong, clear calls-to-action.
9. Use sensory and descriptive language.
10. Personalize based on the audience profile.

---

❌ Do NOT use special characters like "#", "*", "^", etc.
✅ Use plain text only. No markdown or other formatting.
✅ Ensure the message is professional, clean, and easy to read.

📌 CRITICAL: THE ENTIRE TEXT MUST BE WRITTEN IN ${language.toUpperCase()} ONLY.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1', // Using the cheaper model to be cost-effective
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
