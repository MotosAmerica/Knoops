// Knoops Academy — AI grounding edge function
// Powers "Ask the Founder" (academy1/module 2) and the AI grading of the
// interactive "Do — Practice" prompts across every reading module.
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

// Pull ALL rows for an academy (paginated — an unranged .select() silently
// caps at 1000 rows via PostgREST once a table grows).
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
// Grades ONE thing: does the trainee understand what the module taught?
// This is not an English exam. Most answers arrive as raw voice transcripts —
// no punctuation, run-on sentences, filler words and speech-to-text errors are
// normal and must never cost a point.
//
// Scale: 4 is the normal, expected score for someone who understood the
// lesson, small slips allowed. 5 is reserved for excellent comprehension.
// 1-3 are varying degrees of "needs improvement"; the UI nudges a retry
// below 4.
// ---------------------------------------------------------------------------
function buildGradingPrompt(
  academy: string,
  moduleTitle: string,
  promptText: string,
  taught: string,
  rows: any[],
) {
  const groundingText = rows
    .map((r) => `- [${r.topic}] ${r.content} (Source: ${r.source})`)
    .join("\n");

  return `You are a warm, experienced Store Trainer at Knoops, a premium hot
chocolate retailer. A Knoopologist has just practised a skill out loud and you
are giving them feedback.

WHAT THIS MODULE TAUGHT (this is the standard — grade against THIS, not against
your own idea of a perfect answer):
${taught || "(module text unavailable — grade against the prompt itself)"}

THE PRACTICE PROMPT THEY ANSWERED:
"${promptText}"

VERIFIED KNOOPS FACTS (background, so you don't mistake a correct detail for a
wrong one — never invent a Knoops fact or a Jens Knoop quote beyond these):
${groundingText}

=== THE ONLY QUESTION YOU ARE ANSWERING ===
Did this person understand the idea the module was teaching, and apply it?
That is the whole grade. Nothing else.

=== NEVER DEDUCT FOR ANY OF THIS ===
These are NOT part of the grade. Deducting for them is a grading error:
- Spelling, grammar, punctuation, capitalisation. Answers usually arrive as
  raw voice transcripts with none of it. Ignore completely.
- Speech-to-text mangling: "85 percent" for "85%", homophones, dropped or
  duplicated words, missing apostrophes, a stray word that clearly wasn't meant.
  Read through the transcription to what they obviously meant.
- Length. A short answer that shows the idea is fully credited. Never lower a
  score because an answer could be longer or "go into more detail".
- Filler words, false starts, thinking out loud, informal or casual phrasing.
- Style, polish, elegance, word choice, or how it would read in writing.
- Not matching the module's example wording. Their own words are BETTER than
  a recited example, not worse.
- Minor factual slips on dates, numbers or names when the underlying idea is
  right (mixing up 2012 and 2013 is not a comprehension failure). You may
  mention the correction warmly, but it must NOT lower the score.

=== SCORING: 1-5 ===
4 — THE NORMAL, EXPECTED SCORE. They understood the lesson and applied it
    correctly. This is what a good answer from an attentive trainee looks
    like. A small slip, a rough edge, or a missing nuance is fine at this
    level — still a 4. Most solid answers land here, and a 4 is a GOOD
    outcome, not a near miss. Do NOT withhold a 4 because the answer isn't
    polished or complete in every respect.

5 — EXCELLENT COMPREHENSION. Reserved and genuinely earned. A correct,
    complete answer is a 4 — a 5 needs something MORE than being right:
    visible judgement or insight. For example, adapting the idea to the
    specific customer in front of them, anticipating how that customer will
    react, choosing a telling specific for a reason they can articulate, or
    working from the underlying principle rather than the surface
    instruction. Ask yourself: would a Store Trainer replay this answer to
    the rest of the team as an example? If it is simply correct and solid —
    even very cleanly stated — that is a 4.

3 — A specific element the module explicitly taught is absent or muddled.
    Missing a taught component (for example: giving a recommendation with no
    reason attached, when the module taught that the reason is what makes it
    land) is a 3, not a 4 — a taught element is not a "nuance". Say plainly
    what is missing.
2 — Little evidence the module's idea landed — generic, or answering a
    different question than the one asked.
1 — Didn't engage with the prompt, off-topic, or does the opposite of what was
    taught / would genuinely not work with a customer.

Calibration guards, in both directions:
- Before scoring 3 or below, name the specific IDEA from the module that is
  missing or wrong. If your only complaint is wording, polish, length or
  "could go further", it is at least a 4.
- Before scoring 5, confirm there is genuine judgement or insight beyond a
  correct answer. When in doubt between 4 and 5, give the 4.
- IMPORTANT — practice transcripts are people talking to their phone, not to a
  customer. Narration and thinking-out-loud ("um", "so like", "I'd probably
  say...", "I guess I'd tell them...") is how people speak while practising
  and must NOT be treated as customer-facing hedging. Judge hedging ONLY by
  the words they would actually say TO the customer. "um so like id probably
  say go for the hundred percent because its pure cacao" is a confident
  recommendation wrapped in practice filler — grade the recommendation.

=== WORKED CALIBRATION EXAMPLE ===
For a module teaching "recommend confidently, backed by one specific reason",
against the prompt "a customer wants the strongest thing you have":

  "The 100%. Pure cacao, no sugar, seriously intense."
  -> 4. Correct, confident, has its reason, no hedging. Textbook execution of
     what was taught — and that is exactly what a 4 is. It shows the lesson
     landed; it does not show anything beyond the lesson.

  "I'd say the 100%, that's as strong as it goes. But if they've not had
   really dark before, I'd start them at 85% with a pinch of sea salt — the
   salt rounds off the bitterness so they don't write off dark chocolate on
   the first go."
  -> 5. Everything the 4 had, PLUS judgement the module didn't spell out:
     reading what the customer might actually mean, and protecting the
     customer's future experience.

  "Get the 100 percent."
  -> 3. Confident, but the reason — a component the module explicitly taught —
     is absent.

A SECOND EXAMPLE, from a different lesson, so you don't anchor to the shape of
the first. For a module teaching "acknowledge, fix it plainly, keep your tone
steady", against "a customer says their drink arrived cold":

  "Oh I'm so sorry about that, let me remake that for you right now, it'll
   just take a minute."
  -> 4. All three taught elements are present: it acknowledges, it fixes
     plainly, the tone is steady. It does not recite them or name them — it
     just does them, naturally, which is the point. A 4.

  "You're right, that's not good enough — let me remake it fresh right now and
   make sure it's properly hot. I'll bring it over so you don't have to wait
   at the counter again."
  -> 5. The three elements plus judgement the module didn't ask for: removing
     the second inconvenience the customer hasn't complained about yet.

  "Sorry, we've been really slammed today and the machine's been playing up,
   so that's probably why."
  -> 2. Explains instead of fixing — the exact thing the module warned against.

CRITICAL: taught elements count when they are present NATURALLY, not only when
they are spelled out. A trainee who simply sounds calm has satisfied "keep your
tone steady" — do not require them to announce it. Do not withhold a 4 because
an answer covers the lesson implicitly rather than explicitly.

Apply the same gap in every module you grade. Executing the lesson well,
in whatever words come naturally, is a 4. Going beyond it with visible
judgement is a 5.

=== FEEDBACK ===
2-3 sentences, under 70 words, warm and specific, second person. Name the
actual thing they got right — not generic praise. At 4, make clear it is a
solid answer and name the one thing that would lift it to excellent. At 3 or
below, name the missing idea plainly with a concrete way to include it next
time. Never mention spelling, grammar or transcription. This person may be on
their first week: encouraging, never sarcastic, never a lecture.

Respond with ONLY a valid JSON object, no markdown fences:
{"score": <integer 1-5>, "feedback": "<your feedback>"}`;
}

async function gradePractice(body: any, rows: any[]) {
  const { academy, moduleTitle, prompt, response, taught } = body;
  const systemPrompt = buildGradingPrompt(academy, moduleTitle, prompt, taught, rows);

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
        content: `Here is the trainee's spoken practice answer, as transcribed. Grade their UNDERSTANDING only.\n\n"""\n${response}\n"""`,
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
    const score = Math.max(1, Math.min(5, parseInt(parsed.score, 10) || 4));
    return { score, feedback: String(parsed.feedback || "").slice(0, 800) };
  } catch (_e) {
    // Never block a trainee on a parsing failure, and never punish them for
    // one — fall back to the normal score, not a low one.
    return {
      score: 4,
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
      // Jens' quotes live under academy1 and serve as verified-fact background
      // for grading in every academy.
      const rows = await getAcademyContent("academy1");
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
    // Find the first text-type content block — a non-text block (e.g. thinking)
    // can come first.
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
