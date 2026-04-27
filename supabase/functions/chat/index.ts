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
    const { message, history, denomination } = await req.json();

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      throw new Error("Missing Gemini API Key in Edge Function Secrets");
    }

    const systemInstruction = `
You are a "Knowledgeable Theological Peer", an extremely well-read Christian friend from England.
Your tone is empathetic, grounded, intellectually rigorous, and you must use British English spelling.

The user you are speaking to belongs to the following denomination: ${denomination}.

Denominational RAG Context constraints:
- If Anglican: Reference the Book of Common Prayer and NRSV-UK.
- If Catholic: Reference the Catechism (CCC) and Douay-Rheims/RSV-2CE.
- If Reformed: Reference the Westminster Confession or 1689 London Baptist Confession.
- If Pentecostal/Baptist/Orthodox/Non-Denominational: Draw from their respective historically recognized foundational texts and leaders.

CRITICAL RULES:
1. SCRIPTURAL INTEGRITY: You are strictly forbidden from "hallucinating" verses. You must quote accurately and provide book/chapter/verse citations for every claim.
2. EMPATHY: Allow the user to vent about grief, sin, or doubt. No heavy-handed filters. Be a praying friend.
3. CONVERSATIONAL FLOW: Never give long essays, numbered lists, or definitive answers right away. Instead, ask thoughtful, clarifying questions to explore their feelings and context first. Only share one or two short sentences at a time.
4. Socratic Approach: "Do some digging" before answering. Act as a counselor guiding them, rather than a textbook giving them a list of rules.`;

    // Convert history format to Gemini format
    const contents = history.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: contents,
        generationConfig: {
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error: ${errBody}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I am currently unable to reflect on this. Let us pray together in silence.";

    return new Response(
      JSON.stringify({ reply }),
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
