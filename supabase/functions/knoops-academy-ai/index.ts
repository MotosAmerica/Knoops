// Knoops Academy — AI grounding edge function
// Powers both "Ask the Founder" (academy1/module 2) and any future
// "Ask This Manual" widgets. Pattern follows the Motos Academy edge function:
// content lives in the academy_content table (not bundled into the deploy),
// queried at request time, and the model is instructed to answer ONLY from
// what's retrieved — never invent a quote in Jens' voice.
//
// Deploy: supabase functions deploy knoops-academy-ai
// Secrets needed: ANTHROPIC_API_KEY (supabase secrets set ANTHROPIC_API_KEY=...)
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by the platform.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

// Pull ALL rows for an academy (paginated — see the Motos build's own
// lesson-learned note: an unranged .select() silently caps at 1000 rows via
// PostgREST once a table grows. Paginating from the start avoids repeating
// that bug here.)
async function getAcademyContent(academy: string) {
  const pageSize = 500;
  let from = 0;
  let all: any[] = [];
  while (true) {
    const { data, error } = await supabase
      .from("academy_content")
      .select("topic, content, source")
      .eq("academy", academy)
      .order("id")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

function buildSystemPrompt(academy: string, rows: any[]) {
  const groundingText = rows
    .map((r) => `- [${r.topic}] ${r.content} (Source: ${r.source})`)
    .join("\n");

  return `You are the "Ask the Founder" assistant for Knoops Academy, academy "${academy}".
You answer questions from Knoopologists in training, in Jens Knoop's warm,
genuine voice — but you must ONLY use the facts and quotes below. Do not
invent quotes, facts, or details not present in this list, even if asked
directly. If a question falls outside what's here, say plainly that you
don't have Jens' actual words on that specific topic, and offer what you do
know from the list instead. Never present a paraphrase as a direct
quotation — mark paraphrases as such.

SOURCE MATERIAL (the only facts you may draw from):
${groundingText}

Keep answers warm, conversational, and under 120 words.`;
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { academy, module, question } = await req.json();
    if (!academy || !question) {
      return new Response(JSON.stringify({ error: "academy and question are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = await getAcademyContent(academy);
    const systemPrompt = buildSystemPrompt(academy, rows);

    const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: question }],
      }),
    });
    const aiJson = await aiResp.json();
    // Find the first text-type content block — same fix the Motos build
    // needed after finding a non-text block (e.g. thinking) could come first.
    const textBlock = (aiJson.content || []).find((b: any) => b.type === "text");
    const answer = textBlock ? textBlock.text : "Sorry, I couldn't generate an answer just now.";

    // Log for analytics (best-effort — don't fail the request if this errors)
    supabase.from("ask_queries").insert({
      academy,
      module_num: module ?? null,
      question,
      answer,
    }).then(() => {}, () => {});

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
