import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { passage, translation } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      throw new Error("Missing Gemini API Key in Edge Function Secrets");
    }

    const systemInstruction = `
You are a Biblical Scripture Retrieval Expert. Your task is to provide the EXACT text of a requested Bible passage in a specific translation.
RULES:
1. Return ONLY the text of the passage. 
2. DO NOT add verse numbers within the text.
3. DO NOT add any preamble, introduction, or commentary.
4. Ensure the text is exactly as it appears in the ${translation} translation.
5. If the translation is not recognized, default to the New International Version (NIV).
6. If the passage reference is invalid, return "Error: Invalid passage reference."`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [{
          role: 'user',
          parts: [{ text: `Please provide the text for ${passage} in the ${translation} translation.` }]
        }],
        generationConfig: {
          temperature: 0.1, // Low temperature for accuracy
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error: ${errBody}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error retrieving scripture.";

    return new Response(
      JSON.stringify({ text: reply.trim() }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
