import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std/http/server.ts";

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
    const { originalText, userInstructions, previousMessages } = await req.json();

    const messages = [
      { 
        role: 'system', 
        content: `Acționezi ca un copywriter profesionist cu ani de experiență care ajută la îmbunătățirea textelor de marketing. 
Analizează cererea utilizatorului și ajustează textul original în funcție de această cerere. 
Răspunde doar cu noua versiune a textului, fără explicații suplimentare.



Folosește următoarele principii în revizuirea textului:

1. Prioritizează impactul și claritatea mesajului
2. Structurează conținutul pentru lizibilitate maximă
3. Folosește creativitate și storytelling
4. Adoptă un ton conversațional și prietenos
5. Educă și împuternicește cititorul
6. Echilibrează informațiile practice cu elemente captivante
7. Aprofundează conexiunea emoțională
8. Include call-to-action puternice
9. Folosește limbaj senzorial și descriptiv
10. Personalizează mesajul pentru audiență` 
      }
    ];

    if (previousMessages && previousMessages.length > 0) {
      for (const msg of previousMessages) {
        messages.push({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }

    messages.push({ role: 'user', content: `Te rog să revizuiești acest text în baza următoarelor instrucțiuni: ${userInstructions}` });

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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
