
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niche, productName, productDescription } = await req.json();

    const prompt = `Acționezi ca un copywriter profesionist cu ani de experiență. Creează un text de copywriting convingător pentru următorul produs:

Nișă: ${niche}
Nume Produs: ${productName}
Descriere Produs: ${productDescription}

Folosește următoarele principii în crearea textului:
1. Prioritizează impactul și claritatea mesajului
2. Structurează conținutul pentru lizibilitate maximă
3. Folosește creativitate și storytelling
4. Adoptă un ton conversațional și prietenos
5. Educă și împuternicește cititorul
6. Echilibrează informațiile practice cu elemente captivante
7. Aprofundează conexiunea emoțională
8. Include call-to-action puternice
9. Folosește limbaj senzorial și descriptiv
10. Personalizează mesajul pentru audiență

Textul trebuie să fie în limba română și să fie structurat într-un format ușor de citit.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
