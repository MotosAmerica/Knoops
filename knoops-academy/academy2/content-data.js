// Academy 2 — Ritual & Hospitality (flagship)
// Transcribed from claude/knoops-academy2-module[1-7]-content.md and
// claude/knoops-academy2-module8-9-content.md in the project docs.
window.ACADEMY_DATA = {
  slug: "academy2",
  title: "Ritual & Hospitality",
  description: "The four-question interview, reading who's in front of you, and everything that turns a drink into an experience.",
  modules: [
    {
      id: 1, title: "The Knoopology Interview", type: "reading",
      summary: "The real four-step ritual — type, strength, flavors, milk — taught as a conversation.",
      screens: [
        { heading: "Why this module exists", blocks: [
          { type: "para", text: "This module isn't about the menu. It's about the four questions that turn a menu into a drink someone will remember." },
          { type: "list", items: ["What kind of drink — hot, cold, or mocha", "What strength — 22 hot / 6 cold", "What flavors — classic or adventurous", "What milk — dairy or plant-based"] },
        ]},
        { heading: "Step 2: What strength", blocks: [
          { type: "para", text: "Think of strength as a mood, not a number: Lighter (28-45%) = milky and gentle. Middle (46-70%) = balanced. Darker (71-100%) = intense, a real treat." },
          { type: "dialogue", lines: [
            { speaker: "Knoopologist", text: "Do you usually like things more on the milky, comforting side, or a stronger, more intense chocolate flavor?" },
            { speaker: "Customer", text: "I guess... milky? I'm not really a dark chocolate person." },
            { speaker: "Knoopologist", text: "Got it — I'd start you around a 35-40%. Still really chocolatey, but smooth and not overwhelming." },
          ]},
          { type: "do", text: "Write your own version of this exchange for a customer who says: \"I love dark chocolate, the darker the better.\"" },
        ]},
        { heading: "The full interview, start to finish", blocks: [
          { type: "para", text: "Four questions, under thirty seconds, every one of them mattering. That's the goal — not rushing, just never wasting a question." },
        ]},
      ],
    },
    {
      id: 2, title: "Reading the Customer", type: "reading",
      summary: "The Six Human Needs lens — certainty, connection, significance — applied to real customer types.",
      screens: [
        { heading: "The overwhelmed first-timer (certainty)", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "I've actually never been here before. There's a lot of options." },
            { speaker: "Knoopologist", text: "Honestly, that's the fun part — but I promise it's way easier than it looks. Can I just ask you two quick things and I'll take it from there?" },
          ]},
        ]},
        { heading: "The regular (connection)", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "Actually — surprise me a little. Something new." },
            { speaker: "Knoopologist", text: "I love that. Based on what you normally go for, I think you'd really like it a bit darker than usual, with orange instead of your usual caramel — want to try that?" },
          ]},
        ]},
        { heading: "The customizer (significance)", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "Can I get a 70%, with hazelnut and a little bit of chili, oat milk, extra hot?" },
            { speaker: "Knoopologist", text: "Absolutely — 70% hazelnut chili, oat milk, extra hot. That's a great combination, the chili really opens up the hazelnut." },
          ]},
        ]},
        { heading: "When you're not sure", blocks: [
          { type: "para", text: "One question does a lot of work: \"Have you been in before, or is this your first Knoops?\" — a first-timer usually tells you outright, a regular corrects you warmly, a customizer just answers and moves straight into their order." },
        ]},
      ],
    },
    {
      id: 3, title: "Recommending With Confidence", type: "reading",
      summary: "The sommelier mindset — having a real opinion and saying it plainly.",
      screens: [
        { heading: "Have an actual opinion", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "What would you actually get, if it were you?" },
            { speaker: "Knoopologist", text: "Honestly? I'd go for the 55% with hazelnut. It's not too sweet, the hazelnut doesn't overpower the chocolate, and it's just really well balanced." },
          ]},
        ]},
        { heading: "Say it plainly", blocks: [
          { type: "para", text: "\"I'd go with the 60% — it's got real depth without being too intense\" beats \"maybe you'd want to try the 60%?\" Clarity reads as care, not force." },
        ]},
      ],
    },
    {
      id: 4, title: "Presence at the Counter", type: "reading",
      summary: "Your own energy sets the room's tone — state management as a real craft.",
      screens: [
        { heading: "State comes before words", blocks: [
          { type: "para", text: "People read your state before they process anything you say. A breath, a straightened posture, real eye contact before the first word — changes the whole interaction." },
        ]},
        { heading: "What actually helps", blocks: [
          { type: "list", items: ["Breathe before you speak", "Slow your hands slightly, not your words", "Say what's true, out loud, briefly", "Notice your own state before it shows"] },
        ]},
      ],
    },
    {
      id: 5, title: "Making Every Small Ask Feel Easy", type: "reading",
      summary: "Sleeves, substitutions, questions — small moments that decide how someone feels about the whole visit.",
      screens: [
        { heading: "Yes, and make it easy", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "Sorry, could I actually get a sleeve for this? It's really hot." },
            { speaker: "Knoopologist", text: "Of course — here you go!" },
          ]},
        ]},
      ],
    },
    {
      id: 6, title: "Recovery & Grace", type: "reading",
      summary: "Acknowledge, fix plainly, keep tone steady — general principles, no reference to any specific incident.",
      screens: [
        { heading: "Acknowledge, don't defend", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "This isn't what I ordered." },
            { speaker: "Knoopologist", text: "You're totally right, I'm sorry — let's get you the right one. What did you order?" },
          ]},
        ]},
      ],
    },
    {
      id: 7, title: "The Second Ask", type: "reading",
      summary: "Inviting someone back, genuinely, without a script or a pitch.",
      screens: [
        { heading: "A genuine version", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "Oh wow, this is really good." },
            { speaker: "Knoopologist", text: "I'm so glad! If you end up loving it, we've got a loyalty app — worth it if you think you'll be back. No pressure either way, just wanted to mention it." },
          ]},
        ]},
      ],
    },
    {
      id: 8, title: "Your Turn: Scenario Practice", type: "reading",
      summary: "AI-graded role-play — practice the whole interview under realistic conditions.",
      screens: [
        { heading: "How this works", blocks: [
          { type: "para", text: "Four scenarios: the overwhelmed first-timer, a busy rush with a small ask mid-order, something's gone wrong, and a regular trying something new. This module is a rehearsal tier — repeat it as often as you like." },
          { type: "placeholder", text: "live AI-graded scenario chat — connects once Supabase/edge function are set up (see README)" },
        ]},
      ],
    },
    {
      id: 9, title: "Certification Exam", type: "quiz",
      summary: "Knowledge check + applied scenario. Passing both earns your Ritual & Hospitality credential.",
      questions: [
        { q: "How many hot chocolate strength options does the Knoopology ritual offer?", options: ["6", "12", "22", "30"], answer: 2, explain: "22 for hot, 6 for cold." },
        { q: "When a customer seems overwhelmed by options, what do they most need?", options: ["A full list of every option", "Certainty — a narrowed, confident suggestion", "To be left alone to decide", "The most expensive option"], answer: 1, explain: "First-timers are usually seeking certainty — narrow it down, don't expand it." },
        { q: "What's the first step in recovering from a mistake?", options: ["Explain why it happened", "Acknowledge it, without defending", "Offer a discount immediately", "Find out whose fault it was"], answer: 1, explain: "Acknowledge first — explanations, if needed at all, come after." },
        { q: "What's the recommended first move for managing your own state during a rush?", options: ["Speed up your speech", "Take a breath before speaking", "Avoid eye contact to save time", "Skip the greeting"], answer: 1, explain: "A breath before speaking resets your state faster than almost anything else." },
      ],
    },
  ],
};
