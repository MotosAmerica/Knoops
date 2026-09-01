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
          { type: "do", variants: [
            "Give me your version of this exchange for a customer who says: 'Something in the middle, I don't want it too rich.' Land on a specific percentage and one reason why.",
            "How would you play both parts if the customer says: 'I usually buy 70% bars, but this one's for my mum and she likes things gentle'? Finish on an actual number.",
            "Take it from here: the customer says 'I honestly don't know, what's normal?' Ask the strength question in your own words and land them on a specific percentage.",
          ]},
        ]},
        { heading: "Step 3: What flavors", blocks: [
          { type: "para", text: "The real extras list is bigger than most first-timers realize — knowing it by category, not just by memorizing every item, is what lets you suggest something instead of just reading a list." },
          { type: "list", items: [
            "Spices — salt, black pepper, pink pepper, pimentón, Szechuan pepper, chilli, nutmeg, turmeric, star anise, cardamom, cinnamon",
            "Botanicals — rosemary, mint, thyme, lavender, orange, lemon, lime, ginger",
            "Toppings — handmade marshmallows, whipped cream, vegan whipped cream, matcha",
          ]},
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "What flavors do you even have? I only know vanilla and caramel." },
            { speaker: "Knoopologist", text: "Those are both great — if you want something a little different, orange or sea salt are two of our most-loved. Want to try one of those instead, or stick with a classic?" },
          ]},
        ]},
        { heading: "Step 4: What milk", blocks: [
          { type: "para", text: "Five plant-based options exist, not just oat — worth naming more than one when a customer asks." },
          { type: "list", items: [
            "Dairy — whole, semi-skimmed, skimmed, lacto-free",
            "Plant-based — oat, almond, soya, coconut, hazelnut",
          ]},
        ]},
        { heading: "The full interview, start to finish", blocks: [
          { type: "para", text: "Four questions, under thirty seconds, every one of them mattering. That's the goal — not rushing, just never wasting a question." },
          { type: "para", text: "Practising the steps separately is useful, but it isn't the same skill as running all four as one flowing conversation — that's where it either sounds like a warm exchange or like a form being filled in. This is the single most important rep in the whole platform, and it's worth doing out loud until it stops feeling like a script." },
          { type: "do", variants: [
            "Run all four questions as one flowing conversation for a customer who says: 'I'm buying for my partner, she loves chocolate but I've no idea what she'd want here.' Play both parts, under thirty seconds, ending on a specific drink.",
            "Take it from the top, out loud: a customer says 'It's freezing out there, I just want something warming.' Run the whole four-question interview as one conversation and finish on a specific drink.",
            "Say the full interview start to finish for a customer who says: 'My friend sent me here, I've got no idea what to order.' Both parts, keep it under thirty seconds, and land on one specific drink.",
          ]},
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
          { type: "para", text: "These three types aren't the only ones you'll meet, and people don't always fit neatly — a regular can show up overwhelmed on a bad day, a first-timer can already know exactly what they want from a friend's recommendation. The Six Human Needs lens (certainty, connection, significance, and the others) is a way of reading what someone actually needs in the moment, not a permanent label to file them under." },
          { type: "do", variants: [
            "Think of a regular at your store you'd recognize on sight. Give me the one line you'd open with for them, and say how it differs from your opener for a stranger.",
            "Picture a customer who comes in often but keeps things brief. How would you open with them so it reads as warm rather than as a big chat they didn't ask for?",
            "Think of someone who always orders the same thing. What would you say to them on a day they seem to be hesitating, that you wouldn't say to a first-timer?",
          ]},
        ]},
      ],
    },
    {
      id: 3, title: "Recommending With Confidence", type: "reading",
      summary: "The sommelier mindset — having a real opinion and saying it plainly.",
      screens: [
        { heading: "Why confidence is part of the craft", blocks: [
          { type: "para", text: "A sommelier doesn't hand you a wine list and walk away — they taste, they know the room, and they say \"I'd pour you the Burgundy.\" That's the model here. You've already done the real work in the four-question interview; recommending with confidence is just saying out loud what you already figured out." },
          { type: "para", text: "Customers can't tell the difference between \"I don't actually know\" and \"I know, but I'm nervous to say it.\" Both sound like hedging. So even when you're still building your own palate, borrow the confidence — it reads as expertise either way, and you'll grow into it fast." },
        ]},
        { heading: "Have an actual opinion", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "What would you actually get, if it were you?" },
            { speaker: "Knoopologist", text: "Honestly? I'd go for the 55% with hazelnut. It's not too sweet, the hazelnut doesn't overpower the chocolate, and it's just really well balanced." },
          ]},
          { type: "para", text: "Notice what that answer isn't: it isn't \"whatever you like, they're all good!\" A real opinion, backed by one specific reason, is worth more to a customer than a technically accurate non-answer." },
        ]},
        { heading: "Say it plainly", blocks: [
          { type: "para", text: "\"I'd go with the 60% — it's got real depth without being too intense\" beats \"maybe you'd want to try the 60%?\" Clarity reads as care, not force. Watch for the softening words that quietly undercut a recommendation: \"maybe,\" \"I guess,\" \"if you want,\" a rising question-mark tone at the end of a statement." },
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "I want something for a friend who says she doesn't really like dark chocolate, but wants to try something new." },
            { speaker: "Knoopologist", text: "The 45% with orange is perfect for that — still gentle and milky enough to feel familiar, but the orange gives it something new to notice. I'd bet she likes it." },
          ]},
        ]},
        { heading: "When you genuinely don't know", blocks: [
          { type: "para", text: "Confidence isn't the same as pretending. If a customer asks about something you're honestly unsure of, own it plainly and pair it with what you do know — that's still confident, just honest." },
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "Which one pairs best with the marshmallows?" },
            { speaker: "Knoopologist", text: "I haven't tried every combination myself yet, but the ones I've heard people love most are the 45% and the 54% — both mild enough that the marshmallow doesn't get lost. I'd start there." },
          ]},
          { type: "do", variants: [
            "Give me a confident, one-sentence recommendation for a customer who says: 'Nothing too intense, I'm not really a chocolate person.' Then one for a customer who asks: 'What would you actually order yourself?'",
            "Say how you'd answer, in one plain sentence each: first a customer asking which drink suits the marshmallows when you honestly haven't tried them all, then one who says 'I want something I've never had before.'",
            "What would you say to a customer who asks 'Is the orange one any good?' when you've never tried it, and then to one who says 'Just pick for me, I'm in a rush'? One confident sentence each, no hedging.",
          ]},
        ]},
      ],
    },
    {
      id: 4, title: "Presence at the Counter", type: "reading",
      summary: "Your own energy sets the room's tone — state management as a real craft.",
      screens: [
        { heading: "State comes before words", blocks: [
          { type: "para", text: "People read your state before they process anything you say. A breath, a straightened posture, real eye contact before the first word — changes the whole interaction. This isn't a soft skill on top of the real job; for a counter-serve business, it basically is the real job. The product is genuinely great — your presence decides whether the visit matches it." },
        ]},
        { heading: "State is contagious, in both directions", blocks: [
          { type: "para", text: "A rushed, tense Knoopologist makes a calm customer feel like they're in the way. A grounded, unhurried Knoopologist can calm down an impatient one without saying a word about it. You're not just serving the mood of the room — you're setting it." },
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "(visibly rushed, checking their phone) Can you make this quick, I've got somewhere to be." },
            { speaker: "Knoopologist", text: "(steady pace, warm but efficient) Absolutely — what can I get started for you?" },
          ]},
          { type: "para", text: "Notice the Knoopologist didn't match the customer's rushed energy — matching it would've made both of them more anxious. Staying steady is what actually makes the transaction feel fast." },
        ]},
        { heading: "What actually helps", blocks: [
          { type: "list", items: ["Breathe before you speak", "Slow your hands slightly, not your words", "Say what's true, out loud, briefly", "Notice your own state before it shows"] },
        ]},
        { heading: "Resetting mid-shift", blocks: [
          { type: "para", text: "A bad interaction, a long line, a mistake you just made — all of it can carry into the next customer if you let it. The reset doesn't need to be dramatic: one real breath, a glance away from the counter for half a second, then back in. The next person in line has no idea what just happened, and they shouldn't have to." },
          { type: "do", variants: [
            "Think of a day when something threw you off early and stayed with you. Say what one small reset you'd use in the moment to stop it reaching the next person in front of you.",
            "Bring to mind a time someone else's bad mood pulled you into it. How would you stay steady instead, in the moment, next time?",
            "Think of a mistake you made in front of someone and carried with you for the next few minutes. Give me one sentence on what you'd do differently before facing the next customer.",
          ]},
        ]},
      ],
    },
    {
      id: 5, title: "Making Every Small Ask Feel Easy", type: "reading",
      summary: "Sleeves, substitutions, questions — small moments that decide how someone feels about the whole visit.",
      screens: [
        { heading: "Why the small stuff isn't small", blocks: [
          { type: "para", text: "Nobody remembers a visit because the sleeve arrived. But they do remember, without quite being able to say why, whether asking for it felt easy or felt like an imposition. Every small ask is a tiny test of whether this place is actually for them — and the answer should always, obviously, be yes." },
        ]},
        { heading: "Yes, and make it easy", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "Sorry, could I actually get a sleeve for this? It's really hot." },
            { speaker: "Knoopologist", text: "Of course — here you go!" },
          ]},
          { type: "para", text: "\"Sorry\" is doing a lot of quiet work in that customer's sentence — they're bracing for friction before they've even finished asking. The job is to make sure that bracing turns out to be unnecessary, every time." },
        ]},
        { heading: "More small asks, same principle", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "Could you make it a little less sweet? I know that's not really an option on the menu." },
            { speaker: "Knoopologist", text: "It actually is — happy to go lighter on it. I'll have that right out for you." },
          ]},
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "Is there any way to split this into two smaller cups? My kid wants some too." },
            { speaker: "Knoopologist", text: "Of course — give me one second, I'll split it up for you." },
          ]},
        ]},
        { heading: "The anti-pattern", blocks: [
          { type: "para", text: "A sigh, a pause before answering, \"we don't really do that\" when the honest answer is \"we can, it's just an extra step\" — all of these teach a customer to stop asking, which is the opposite of what a genuinely hospitable counter should do. If something truly can't be done, the fix is a warm, direct no plus an alternative — not reluctance dressed up as policy." },
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "Can I get this in a for-here mug instead of to-go?" },
            { speaker: "Knoopologist", text: "We're actually cup-only in this location, sorry about that — but I'll make sure it's not overfilled so it's easy to carry." },
          ]},
          { type: "do", variants: [
            "Think of something your store genuinely can't do for a customer. Give me your warm, direct no, plus one small thing you can still offer them instead.",
            "How would you answer a customer asking for something that's clearly outside what you're allowed to do? Keep it warm and direct, and add the one thing you can do.",
            "Take it from here: a customer asks for a change you can't make. Say your no plainly, with no sigh and no 'we don't really do that', then offer one small alternative.",
          ]},
        ]},
      ],
    },
    {
      id: 6, title: "Recovery & Grace", type: "reading",
      summary: "Acknowledge, fix plainly, keep tone steady — general principles, no reference to any specific incident.",
      screens: [
        { heading: "The three-part recovery", blocks: [
          { type: "para", text: "Nothing here requires a mistake to be your fault — most of the time it won't be. What matters is the sequence: acknowledge first, fix it plainly, keep your tone steady through both. Skip the order and even a correct fix can feel unsatisfying to the person on the other side of the counter." },
          { type: "list", items: [
            "1. Acknowledge — say what happened, without minimizing or over-apologizing",
            "2. Fix it — plainly, without making the customer ask twice",
            "3. Stay steady — your tone through the fix matters as much as the fix itself",
          ]},
        ]},
        { heading: "Acknowledge, don't defend", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "This isn't what I ordered." },
            { speaker: "Knoopologist", text: "You're totally right, I'm sorry — let's get you the right one. What did you order?" },
          ]},
          { type: "para", text: "Notice what's missing: no \"well, actually you said...\", no explaining why the mistake happened before it's even fixed. Acknowledge, then act. The explanation, if it's needed at all, can come after — and often it isn't needed." },
        ]},
        { heading: "More recovery scenarios", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "This is way too sweet, I don't think I like it." },
            { speaker: "Knoopologist", text: "Ah, sorry about that — let's find something closer to what you actually wanted. Was it too sweet in general, or too much of a specific flavor?" },
          ]},
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "I've been waiting a while, is this almost ready?" },
            { speaker: "Knoopologist", text: "Thanks for your patience — it's next up, should be about a minute. I'll bring it right over." },
          ]},
        ]},
        { heading: "What to avoid", blocks: [
          { type: "para", text: "Getting defensive, explaining before fixing, matching a frustrated customer's tone, or over-apologizing to the point it becomes about your discomfort rather than their experience — all of these make a fixable moment worse. Steady and plain beats anxious and elaborate, every time." },
          { type: "do", variants: [
            "Give me your acknowledge, fix, stay steady response to a customer who says the drink they've been handed is someone else's order.",
            "A customer says the milk in their drink isn't the one they asked for. Talk me through what you'd say, acknowledging before you explain anything.",
            "How would you respond to a customer who says the drink they just paid for spilled on the way to their table? Acknowledge, fix it plainly, and keep your tone steady through both.",
          ]},
        ]},
      ],
    },
    {
      id: 7, title: "The Second Ask", type: "reading",
      summary: "Inviting someone back, genuinely, without a script or a pitch.",
      screens: [
        { heading: "The real problem this solves: nobody knows the loyalty app exists", blocks: [
          { type: "para", text: "Loyalty and rewards programs at counter-serve chains have a well-known failure mode: most customers never hear about them at all, because staff either never mention it or mention it in a flat, scripted way that reads as a pitch and gets tuned out. The program itself isn't the problem — the moment it gets mentioned is." },
          { type: "para", text: "The visit is basically over by this point — which is exactly why it's the easiest moment to get wrong in either direction: silence loses a customer who would've genuinely wanted to know, and a pushy pitch undoes some of the goodwill the whole rest of the visit just built. A genuine invitation back costs nothing and can turn a one-time visitor into a regular." },
        ]},
        { heading: "A genuine version", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "Oh wow, this is really good." },
            { speaker: "Knoopologist", text: "I'm so glad! If you end up loving it, we've got a loyalty app — worth it if you think you'll be back. No pressure either way, just wanted to mention it." },
          ]},
          { type: "para", text: "\"No pressure either way\" isn't just politeness — it's what makes the rest of the sentence land as genuine instead of like a sales script. Mean it when you say it." },
        ]},
        { heading: "Reading when to skip it", blocks: [
          { type: "para", text: "Not every visit needs a second ask, and forcing it into a rushed or quiet interaction can feel more like a pitch than an invitation. A customer in a hurry, mid-conversation with someone else, or clearly not chatty is a customer you let go with a warm, simple goodbye instead." },
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "(already walking away, phone to ear) Thanks!" },
            { speaker: "Knoopologist", text: "Anytime, take care!" },
          ]},
        ]},
        { heading: "For the quiet or reserved customer", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "(quiet, minimal chat throughout) Thanks." },
            { speaker: "Knoopologist", text: "Of course — hope you enjoy it." },
          ]},
          { type: "para", text: "No app mention, no upsell — just a genuinely warm sendoff. Reading the room correctly here is part of the craft, not a missed opportunity." },
          { type: "do", variants: [
            "Give me a second-ask line in your own words for a customer who's just told you the drink was great, one that wouldn't sound like a pitch said out loud.",
            "Say how you'd mention the loyalty app to a chatty first-timer, in wording you'd genuinely use, with the no-pressure part sounding like you mean it.",
            "A quiet customer is heading off with barely a word. What would you actually say to send them off warmly, and would you mention the app at all?",
          ]},
        ]},
      ],
    },
    {
      id: 8, title: "Your Turn: Scenario Practice", type: "reading",
      summary: "AI-graded role-play — practice the whole interview under realistic conditions.",
      screens: [
        { heading: "How this works", blocks: [
          { type: "para", text: "Four scenarios: the overwhelmed first-timer, a busy rush with a small ask mid-order, something's gone wrong, and a regular trying something new. Each one draws on everything from this academy — the four-question interview, reading the customer, recommending with confidence, presence, small asks, and recovery — in one realistic conversation rather than isolated examples." },
          { type: "para", text: "This module is a rehearsal tier — repeat it as often as you like, with a different scenario or a different approach each time. There's no penalty for practicing the same scenario badly before getting it right; that's what rehearsal is for." },
          { type: "para", text: "The four scenarios are below. Say your answer out loud, the way you'd actually say it at the counter — tone is most of what's being practised here, and it's the part that doesn't come across when you type. Each one gets scored and comes back with specific feedback." },
        ]},
        { heading: "Scenario 1 — The overwhelmed first-timer", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "(looking up at the board, slightly stalled) Oh wow. Okay. I've genuinely never been anywhere like this. What… what do I even do here?" },
          ]},
          { type: "do", variants: [
            "Take it from here, out loud. Get them from stalled to excited using the four questions, and make your very first line the one that settles them.",
            "Say your response out loud, same customer, except they add that they're not usually a chocolate person. Use the four questions and still land them on something they're keen to try.",
            "Talk it through out loud, from their first line to a drink in their hand, keeping it under thirty seconds and never letting it sound like an intake form.",
          ]},
        ]},
        { heading: "Scenario 2 — A small ask, mid-rush", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "(you're three orders deep, line out the door) Sorry — I know you're slammed. Is there any chance I could swap this to oat, and could it be not too hot? My daughter's going to share it." },
          ]},
          { type: "do", variants: [
            "Answer out loud at rush pace, and make their 'sorry, I know you're slammed' turn out to be unnecessary, without losing a second on your line.",
            "Say it the way you'd actually say it mid-rush, warm and quick, and include the one thing you'd do to make sharing it with her daughter easier.",
            "Respond out loud at pace, with two more people listening behind her. Make the ask feel genuinely easy and keep the line moving at the same time.",
          ]},
        ]},
        { heading: "Scenario 3 — Something's gone wrong", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "(returning to the counter, visibly annoyed) I've been waiting nearly fifteen minutes, and this isn't even what I ordered." },
          ]},
          { type: "do", variants: [
            "Respond out loud. Lead with the acknowledgement, and don't say a word about why the wait happened until they're sorted.",
            "Say it out loud, staying steady while they're annoyed, and make sure they never have to ask you twice for the fix.",
            "Take it from here out loud, covering both parts of what went wrong, the wait and the wrong drink, without getting defensive about either one.",
          ]},
        ]},
        { heading: "Scenario 4 — A regular wanting something new", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "(a regular you recognize) Same as always… actually, no. Surprise me. I trust you." },
          ]},
          { type: "do", variants: [
            "Make the recommendation out loud, building it off what you already know they usually order so it clearly wasn't pulled off a list.",
            "Say your recommendation the way you'd really say it: one specific drink, one real reason they'll like it, and no softening words in there.",
            "Take it from here out loud. Name the drink, give the one reason it's right for them, then say the line you'd use if they hesitate.",
          ]},
        ]},
        { heading: "What's still coming", blocks: [
          { type: "placeholder", text: "live back-and-forth AI role-play chat (multi-turn, where the customer responds to what you say) — the scenarios above are graded single responses in the meantime" },
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
