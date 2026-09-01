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

// ---------------------------------------------------------------------------
// "Do — Practice" grading.
//
// Grounding order, per Doug's spec: Jens' own sourced words FIRST (the same
// academy_content rows the Ask widget uses), then general food-service /
// hospitality knowledge — but only ever anchored to what we actually know
// about Knoops. The grader never invents a Knoops fact or a Jens quote.
//
// Deliberately generous-but-honest: this is training for frontline staff, not
// an exam board. A 3 is "solid, would work on the floor." Scores exist to give
// someone a next step, not to rank them.
// ---------------------------------------------------------------------------
function buildGradingPrompt(
  academy: string,
  moduleTitle: string,
  promptText: string,
  rows: any[],
) {
  const groundingText = rows
    .map((r) => `- [${r.topic}] ${r.content} (Source: ${r.source})`)
    .join("\n");

  return `You are a Store Trainer for Knoops, a premium hot chocolate retailer,
grading a Knoopologist's practice answer inside Knoops Academy.

CONTEXT
Academy: ${academy}
Module: ${moduleTitle || "(untitled)"}
The practice prompt they were answering: "${promptText}"

WHAT KNOOPS ACTUALLY IS (ground yourself here first — these are the founder's
own sourced words and real, verified company facts; treat them as the primary
standard the answer is being measured against):
${groundingText}

Beyond that list you MAY use general, well-established hospitality and
counter-serve food-service knowledge — but only in service of Knoops' own
standard above. Never invent a Knoops fact, a menu item, a policy, or a
quote attributed to Jens Knoop. If the trainee's answer references something
about Knoops you cannot verify from the list, don't penalise them for it and
don't confirm it either — focus your feedback on the skill being practised.

SCORING RUBRIC (1-5)
5 — Genuinely excellent. Natural, specific, sounds like a real person at a real
    counter, and clearly demonstrates the skill the prompt was teaching.
4 — Strong. Does the job well; one small thing would sharpen it.
3 — Solid. Would work fine on the floor. Missing some warmth, specificity, or
    one element of the skill being practised.
2 — On the right track but thin — generic, very short, or missing the point of
    the prompt.
1 — Doesn't engage with the prompt, or would not work with a real customer.

Be encouraging and concrete. Never sarcastic, never harsh. This person may be
on their first week. Always name one specific thing they did well before any
suggestion, and make the suggestion actionable (something they could say or do
differently), not abstract.

Respond with ONLY a valid JSON object, no markdown fences, in exactly this shape:
{"score": <integer 1-5>, "feedback": "<2-3 warm, specific sentences, under 70 words>"}`;
}

async function gradePractice(body: any, rows: any[]) {
  const { academy, moduleTitle, prompt, response } = body;
  const systemPrompt = buildGradingPrompt(academy, moduleTitle, prompt, rows);

  const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: `Here is the trainee's practice answer. Grade it.\n\n"""\n${response}\n"""`,
      }],
    }),
  });
  const aiJson = await aiResp.json();
  const textBlock = (aiJson.content || []).find((b: any) => b.type === "text");
  const raw = textBlock ? textBlock.text.trim() : "";

  // The model is told to return bare JSON, but strip fences defensively.
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(cleaned);
    const score = Math.max(1, Math.min(5, parseInt(parsed.score, 10) || 3));
    return { score, feedback: String(parsed.feedback || "").slice(0, 800) };
  } catch (_e) {
    // Never block a trainee on a parsing failure — give a neutral, honest result.
    return {
      score: 3,
      feedback: "Thanks for practising this one. The grader had trouble scoring this response — your answer was still saved, and it's worth running past your Store Trainer.",
    };
  }
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { academy, module, question, action } = body;

    // ---- "Do — Practice" grading path ----
    if (action === "grade") {
      if (!academy || !body.prompt || !body.response) {
        return new Response(
          JSON.stringify({ error: "academy, prompt and response are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const rows = await getAcademyContent("academy1"); // Jens' quotes live here
      const result = await gradePractice(body, rows);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
