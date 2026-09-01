// Academy 3 — Counter Operations & Safety
// Full content transcribed from claude/knoops-academy3-module[1-7]-content.md
// in the project docs. Opening/closing, POS/order flow, food safety, allergens,
// staffing a rush, cash handling, and a scenario walkthrough in place of a
// straight recall quiz (deliberately differentiated from Academy 1's format).
window.ACADEMY_DATA = {
  slug: "academy3",
  title: "Counter Operations & Safety",
  description: "Opening, closing, food safety, allergens, and running a smooth counter — the operational backbone under everything in Academies 1 and 2.",
  modules: [
    {
      id: 1, title: "Opening & Closing Procedures", type: "reading",
      summary: "The shape of a good open/close, and why the boring steps matter more than they seem.",
      screens: [
        { heading: "Why this matters more than it seems", blocks: [
          { type: "quote", text: "A rushed opening sets a store up to be behind all day. A rushed closing sets tomorrow's opener up to inherit yesterday's mess. Neither of those is dramatic — nobody notices a great opening the way they'd notice a bad one — which is exactly why it's worth doing properly and consistently, every single time." },
          { type: "para", text: "This module covers the shape of a good opening and closing routine — the categories of things that need doing and why they matter in that order. Your store's exact checklist — specific equipment, specific steps, specific timing — will be taught hands-on by your Store Trainer. What's real and worth learning now is the reasoning, so that whatever the specific list ends up being, you understand why each part matters." },
        ]},
        { heading: "Opening: the general shape", blocks: [
          { type: "list", items: [
            "Safety and access first — the space is secure, lights and systems are on, nothing looks wrong",
            "Equipment warm-up — anything that needs time to reach temperature starts early, since rushing this step affects every drink made until it's ready",
            "Stock and prep check — confirming what's on hand and what's running low before the first customer, not after",
            "Register and till setup — float counted, POS checked, ready before doors open",
            "A final look around — thirty seconds of seeing the space the way a customer will see it for the first time that day",
          ]},
          { type: "dialogue", lines: [
            { speaker: "Opener", text: "Okay — power on, warmers going first since those take longest. While that heats up I'll check stock and get the float counted. Should be ready with time to spare before doors." },
          ]},
          { type: "para", text: "Notice the ordering logic: the thing that takes longest to be ready starts first, everything else fills in around it. That's the actual skill in a good opening — not doing more, doing things in the right order." },
          { type: "do", variants: [
            "Once your store's real opening checklist exists, talk me through the first three things you'd do and why each one comes before the next.",
            "Once you know your store's actual opening list, say how you'd explain to a brand new teammate why the equipment warm-up starts before the stock check.",
            "Once your store's real opening checklist exists, picture an opening where you're running a few minutes behind. Which step still has to come first, and why?",
          ]},
        ]},
        { heading: "Closing: the general shape", blocks: [
          { type: "para", text: "Closing has its own logic, roughly the reverse priority of opening, plus a layer opening doesn't need — leaving things genuinely ready for whoever opens tomorrow, not just clean enough to pass a glance." },
          { type: "list", items: [
            "Last-call and wind-down — handling final customers warmly, not rushing them out",
            "Equipment shutdown and cleaning — done properly, not skipped because it's the end of a long shift",
            "Stock and waste notes — what ran low, written down while it's fresh",
            "Register reconciliation — counted and reconciled properly, every time, not \"close enough\"",
            "A genuine handoff note — anything unusual today's tomorrow's opener should know about",
          ]},
          { type: "dialogue", lines: [
            { speaker: "Closer", text: "We ran low on the oat milk around 4pm today, might be worth checking that first thing tomorrow before the morning rush." },
          ]},
          { type: "para", text: "That one sentence, written consistently, is worth more to the next shift than an immaculate but silent closing. This is exactly the kind of small handoff a Store Trainer relies on to keep a whole team coordinated without needing to be there every shift personally." },
          { type: "do", variants: [
            "Picture an ordinary shift with one small thing worth passing on. Give me your one-sentence handoff note for tomorrow's opener.",
            "Say the handoff note you'd leave after a quiet close where nothing much happened, in a single useful sentence.",
            "What would you say in one sentence to tomorrow's opener if you'd run low on something popular late in the day?",
          ]},
        ]},
        { heading: "Why rushing the \"boring\" steps costs more than it saves", blocks: [
          { type: "para", text: "It's tempting, especially at the end of a long shift, to shortcut cleaning or reconciliation steps that feel less important than customer-facing work. They matter more than they seem, precisely because nobody notices them going right — only when they go wrong. A skipped equipment clean shows up as a taste issue days later. A rushed till count shows up as a headache for someone else entirely. The \"boring\" steps are boring because they're supposed to be invisible when done well — that's the sign of doing them right, not a reason to skip them." },
        ]},
        { heading: "Consistency over personal preference", blocks: [
          { type: "para", text: "Everyone develops their own rhythm for a routine they do often, and that's normal. What matters is that the actual steps — safety checks, equipment procedures, reconciliation — stay consistent regardless of who's doing them, so any Knoopologist can open or close confidently, and a Store Trainer can trust the routine happened properly without watching every single time." },
          { type: "do", variants: [
            "Once you've shadowed a real opening with an experienced teammate, come back and talk me through your store's actual sequence in your own words.",
            "Once you've been through a live closing shift with a teammate, take it from here: give your version of the steps, in the order your store actually does them.",
            "Once you've shadowed a real open or close, say which steps have to stay the same no matter who's on shift, then run through them in your own words.",
          ]},
        ]},
      ],
    },
    {
      id: 2, title: "POS & Order Flow", type: "reading",
      summary: "Turning a great four-question interview into an accurate order, without losing the warmth.",
      screens: [
        { heading: "The system behind the conversation", blocks: [
          { type: "quote", text: "Academy 2 taught you how to run the four-question interview well. This module is about what happens right after — turning that conversation into an actual order, accurately, without losing any of the warmth you just built." },
          { type: "para", text: "Order flow has three parts worth thinking about separately: taking the order accurately, communicating wait/pickup clearly, and handling payment smoothly. Each is simple on its own — the skill is doing all three without the interview feeling like it paused for paperwork." },
        ]},
        { heading: "Taking the order accurately", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Knoopologist", text: "Perfect — so that's a 55% with hazelnut, oat milk. Great choice. (order entered) That'll be at the counter in just a few minutes." },
          ]},
          { type: "para", text: "Entering the order during the natural pause in conversation, not as an awkward silent gap, keeps the whole interaction feeling continuous." },
          { type: "do", variants: [
            "Take it from here: a customer's just asked for a 65% with orange and oat milk. Say how you'd talk them through it as you enter the order.",
            "Give me your version of the moment right after the interview ends: a 55% with hazelnut and whole milk, entered without you going quiet.",
            "How would you keep the conversation going while entering an order for two drinks at once? Say it the way you'd say it at the counter.",
          ]},
        ]},
        { heading: "The numbered system, communicated clearly", blocks: [
          { type: "para", text: "Knoops stores commonly use a numbered-ticket system — a customer gets a number, and it's called when their drink is ready. The entire skill here is making sure the customer actually understands it clearly before walking away from the counter." },
          { type: "dialogue", lines: [
            { speaker: "Knoopologist", text: "You're number 14 — we'll call it out when it's ready, should be just a few minutes." },
          ]},
          { type: "para", text: "One sentence, said clearly, is often the difference between a customer who confidently waits and one who's anxiously checking the counter every ten seconds." },
        ]},
        { heading: "When the wait is genuinely longer", blocks: [
          { type: "para", text: "This connects directly to Academy 2's presence work: if a wait is going to be more than just a couple of minutes, saying so plainly and warmly upfront is far better than letting a customer discover it on their own." },
          { type: "dialogue", lines: [
            { speaker: "Knoopologist", text: "You're number 22 — we're a little busier than usual right now, so it might be closer to ten minutes rather than a couple. Thanks so much for your patience." },
          ]},
        ]},
        { heading: "Payment, smoothly", blocks: [
          { type: "para", text: "Payment should feel like the least noticeable part of the whole interaction. Confirm the total clearly, handle the payment method smoothly, and don't let this become a purely transactional, silent moment after a warm conversation." },
          { type: "dialogue", lines: [
            { speaker: "Knoopologist", text: "That comes to $6.50 — how would you like to pay today?" },
          ]},
          { type: "do", variants: [
            "Once you've learned your store's actual POS system hands-on, talk me through a card payment from confirming the total to handing the drink over.",
            "Once you're hands-on with your store's real POS, give me your version of a cash payment that stays warm rather than going silent.",
            "Once you know the actual POS, say what you'd say at payment for a customer paying for two drinks together, with the total confirmed clearly.",
          ]},
        ]},
        { heading: "Order flow during a rush", blocks: [
          { type: "para", text: "Everything above gets harder, not easier, during a rush — exactly when it matters most. This ties directly to Module 5 (Staffing the Rush) and Academy 2's presence work: accurate order entry, clear number communication, and smooth payment all still need to happen, just faster." },
          { type: "dialogue", lines: [
            { speaker: "Knoopologist", text: "60% orange, oat milk — number 31, few minutes, thank you! (already turning to the next customer, warmly)" },
          ]},
          { type: "para", text: "A wrong order taken quickly isn't actually faster — it just moves the delay to later, as a remake, with an extra apology attached. Speed and accuracy aren't in tension when the flow is well-practiced." },
          { type: "do", variants: [
            "Once you've shadowed a real shift on the actual POS, talk me through the full order flow in your own words, from 'what can I get you' through payment.",
            "Once you've worked a live shift on the real system, give your version of that same sequence at rush pace, where nothing gets dropped just because it's faster.",
            "Once you've shadowed a real shift on the actual POS, take it from the first hello: say each step in order, including where the number gets given.",
          ]},
        ]},
      ],
    },
    {
      id: 3, title: "Food Safety & Sanitation", type: "reading",
      summary: "Craft, not paperwork — handwashing, temperature, and cross-contamination, taught with real weight.",
      screens: [
        { heading: "This is craft, not paperwork", blocks: [
          { type: "quote", text: "A spotless, well-run counter is part of what makes a drink genuinely good, not a separate box to check. Nobody's ever had a great hot chocolate experience at a counter that felt grimy, no matter how well the drink itself was made." },
          { type: "para", text: "This module gets real depth and real time, on purpose — the same seriousness as anything in the craft modules. Your specific local health-code requirements (which differ by country — UK, UAE, and US rules aren't identical) should be confirmed with your Store Trainer and local guidance." },
        ]},
        { heading: "Handwashing: the unglamorous foundation", blocks: [
          { type: "para", text: "The single highest-impact habit in any food service environment is also the least exciting one: proper, frequent handwashing. Before a shift, after handling cash, after touching your face or hair, after cleaning, after using the restroom, after handling raw or unfamiliar ingredients — these aren't excessive, they're the baseline." },
          { type: "dialogue", lines: [
            { speaker: "Knoopologist", text: "Just grabbed that delivery — washing up quick before I get back on drinks." },
          ]},
          { type: "para", text: "Said naturally, not apologetically — this is just part of the job." },
          { type: "do", variants: [
            "Over your next few shifts, keep count of the moments that call for a hand wash. Which one is easiest to let slide when you're busy?",
            "Think through a typical shift start to finish and name the points where washing up should happen. Noticing them is most of the skill.",
            "Next time you're on, watch for the washes that come after cash, deliveries and cleaning. Say which of those you'd have to build the habit for.",
          ]},
        ]},
        { heading: "Temperature: the invisible thing that matters most", blocks: [
          { type: "para", text: "Chocolate and dairy products both have real temperature requirements — held too warm for too long, ingredients can become unsafe well before they look or smell any different. This is one of the most important, least visible parts of the job. Know your store's holding-temperature requirements and time limits, and follow them exactly, every time — not \"usually,\" every time." },
          { type: "placeholder", text: "specific temperature thresholds and time limits — confirm against local health code and store equipment specs" },
        ]},
        { heading: "Cross-contamination and allergens", blocks: [
          { type: "para", text: "With plant-based milk options as a core, regular part of the Knoops menu, keeping dairy and non-dairy preparation genuinely separate matters — for customers with allergies or intolerances, cross-contamination isn't a minor inconvenience, it can be a real health issue." },
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "I have a dairy allergy, not just a preference — can you make sure everything's properly separate?" },
            { speaker: "Knoopologist", text: "Absolutely, I'll use clean tools and make sure nothing crosses over — thanks for letting me know, I take that seriously." },
          ]},
          { type: "do", variants: [
            "Talk me through exactly how you'd keep an oat milk order separate from the dairy drink you just made: tools, surfaces, everything.",
            "A customer tells you their dairy allergy is real, not a preference. Say the steps you'd take from taking the order through to handing it over.",
            "Give me your version of the separation steps for a nut-free drink made during a busy stretch, start to finish.",
          ]},
        ]},
        { heading: "A clean counter as a point of pride", blocks: [
          { type: "para", text: "Beyond formal procedures: does the space look, right now, like somewhere you'd be comfortable eating from yourself? Milk residue, crumbs, a sticky counter — none of these are dramatic, but they add up. This is a habit, not a checklist item — noticing small things and handling them immediately, not saving them for a scheduled clean." },
          { type: "do", variants: [
            "On your next shift, keep track of the small messes you sort straight away versus the ones you leave for later. Which ones tend to get left?",
            "Think about the counter at your busiest hour: name the small things that usually get put off, and say which one you'd start handling on the spot.",
            "Look at your station the way a customer would see it right now. What would you deal with immediately rather than saving for a scheduled clean?",
          ]},
        ]},
        { heading: "Why this doesn't feel optional", blocks: [
          { type: "para", text: "Everything in Academy 2 is about making someone feel genuinely cared for. A clean, safe counter is part of that same care — it's just the part that's invisible when done right and very visible when it isn't." },
        ]},
      ],
    },
    {
      id: 4, title: "Allergen & Dietary Handling", type: "reading",
      summary: "Part of the menu, not an exception to it — handling the conversation with real safety at stake.",
      screens: [
        { heading: "Part of the menu, not an exception to it", blocks: [
          { type: "quote", text: "Plant-based milk isn't a special accommodation bolted onto the Knoops menu — it's literally one of the four ritual questions from Academy 2, every single time, for every customer." },
          { type: "para", text: "For a customer with a real allergy, this conversation isn't a minor menu preference, it's about actual safety, and they can usually tell within a few seconds whether they're talking to someone who takes it seriously." },
        ]},
        { heading: "Asking, without making it a big deal", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "Do you have anything... I have a nut allergy, is that going to be a problem with any of this?" },
            { speaker: "Knoopologist", text: "Good question — let's make sure we get you something totally safe. A few of our flavor add-ins do include nuts, but plenty don't, and I can make sure everything's prepared cleanly. What are you in the mood for, and I'll steer you toward the safe options?" },
          ]},
          { type: "para", text: "Calm, direct, taken seriously immediately — no minimizing (\"oh I'm sure it's fine\") and no overreacting either." },
          { type: "do", variants: [
            "A customer mentions a nut allergy halfway through choosing their drink. What would you say back, calm and direct, without making it a big deal?",
            "Give me your version of the reply when someone says 'I'm allergic to dairy, is that a problem?' just as you're about to enter their order.",
            "Take it from here: a customer brings up a soy allergy mid-conversation. Say your response, taking it seriously without overreacting.",
          ]},
        ]},
        { heading: "When you genuinely don't know an ingredient detail", blocks: [
          { type: "para", text: "This is one of the most important honesty moments in the whole platform: if you're not certain whether something contains an allergen, say so plainly and check, rather than guessing. A guess that turns out wrong isn't a small mistake here — it's a real safety issue." },
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "Does the caramel flavor have any dairy in the base, beyond the milk itself?" },
            { speaker: "Knoopologist", text: "That's a great question and I want to give you a completely accurate answer rather than guess — let me just double check the ingredient list before you order, one second." },
          ]},
          { type: "do", variants: [
            "A customer asks whether the caramel base has dairy in it and you're not sure. Say how you'd tell them you're checking, in a tone that sounds confident rather than apologetic.",
            "Give me your version of 'let me double check before I guess' for a customer asking about nuts in a syrup you've never used.",
            "How would you say out loud that you don't know an ingredient detail, so it lands as care rather than uncertainty?",
          ]},
        ]},
        { heading: "Plant-based milk as a genuine, equal option", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "Sorry, can I get oat milk, I'm lactose intolerant." },
            { speaker: "Knoopologist", text: "Of course, no need to apologize at all — oat milk actually works really nicely with a lot of our flavors, you're not missing out on anything." },
          ]},
          { type: "para", text: "That \"no need to apologize at all\" line matters — customers with dietary restrictions sometimes brace for an inconvenienced reaction, and getting a warm, normal one is genuinely reassuring." },
        ]},
        { heading: "What genuine cross-contamination care looks like out loud", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Customer", text: "How careful are you actually about cross-contamination? I've had bad experiences elsewhere." },
            { speaker: "Knoopologist", text: "Totally fair to ask. I'll use a clean tool and clean surface for your drink specifically, and I'm making it separately from anything with nuts in it right now. I take that seriously — let me know if you want to watch me make it, that's totally fine too." },
          ]},
          { type: "para", text: "That last offer — inviting them to watch — is a small, powerful trust-building move that costs nothing and directly answers a real, reasonable concern." },
        ]},
        { heading: "This connects to trust, not just safety", blocks: [
          { type: "para", text: "How this conversation gets handled shapes whether a customer with dietary needs trusts your store enough to come back — and whether they'd recommend it to others who share the same concern. Handled carelessly even once can be the reason someone never comes back, and tells other people not to either." },
          { type: "do", variants: [
            "A customer says they've been let down at another shop. Talk me through how you'd explain your allergen handling to them, specific and confident rather than vague.",
            "Give me your version of what you'd say to a parent who's nervous about ordering for a child with a nut allergy. Be specific about what you actually do.",
            "How would you describe your cross-contamination practice to someone who asks how careful you really are? Aim for concrete steps, not reassurance.",
          ]},
        ]},
      ],
    },
    {
      id: 5, title: "Staffing the Rush", type: "reading",
      summary: "A rush is a team sport — choreography, hand-offs, and flow, not just moving faster.",
      screens: [
        { heading: "A rush is a team sport", blocks: [
          { type: "quote", text: "A quiet counter can run well with one person doing everything reasonably. A busy one can't — not because any one person is slow, but because too many things need to happen at once for one person to do them all well." },
          { type: "para", text: "The goal isn't \"move faster.\" It's \"flow better\" — a genuinely coordinated team during a rush often feels less frantic than a team of individuals each trying to personally go faster without coordinating." },
        ]},
        { heading: "Knowing your lane, and when to leave it", blocks: [
          { type: "para", text: "During a busy period, it usually helps for people to have a rough lane — one primarily taking orders, one primarily making drinks, one floating to cover whatever's backing up. The floating role means actively watching for where help is needed and moving there, rather than staying fixed to one task." },
          { type: "dialogue", lines: [
            { speaker: "Knoopologist", text: "I'll jump on drinks for a few minutes, orders are moving fine right now." },
          ]},
          { type: "do", variants: [
            "Picture your store at its busiest. Name the lanes you'd split into, and say where a floater would be most useful.",
            "Talk me through a morning rush with three people on: who covers what, and what would tell someone it's time to leave their lane?",
            "Think about the last time your counter backed up. Which lane got overloaded, and where would floating have helped most?",
          ]},
        ]},
        { heading: "Communication, short and clear", blocks: [
          { type: "para", text: "During a rush, communication needs to get shorter without getting rude — quick, clear hand-offs rather than long explanations. It's easy to either over-communicate (slows everyone down) or under-communicate (leads to mistakes) under pressure." },
          { type: "dialogue", lines: [
            { speaker: "Knoopologist 1", text: "Number 14, oat, ready for pickup!" },
            { speaker: "Knoopologist 2", text: "Got it, I've got the next three orders queued, need a hand after this one." },
            { speaker: "Knoopologist 1", text: "On it." },
          ]},
          { type: "do", variants: [
            "Give me three hand-off phrases you'd use mid-rush, each under ten words and clear enough that nobody has to ask again.",
            "Say how you'd call out a finished drink and ask for help on the next one, in as few words as you can without sounding sharp.",
            "Take it from here: the drinks queue is backing up and you need a teammate to switch across. What would you say, short and clear?",
          ]},
        ]},
        { heading: "Keeping the line informed, not just fast", blocks: [
          { type: "para", text: "A rush that feels chaotic to customers is worse than a rush that's honestly busy but calmly communicated. A brief, warm acknowledgment to a waiting line genuinely changes how people experience the wait." },
          { type: "dialogue", lines: [
            { speaker: "Knoopologist", text: "Thanks so much for your patience, everyone — we're moving as fast as we can!" },
          ]},
        ]},
        { heading: "Recognizing when a rush needs backup", blocks: [
          { type: "para", text: "Sometimes a rush genuinely exceeds what the scheduled team can handle smoothly, and that's worth recognizing and escalating rather than pushing through and hoping. Even as a Knoopologist, noticing and flagging \"this is more than we can handle well right now\" is a mature thing to do, not an admission of failure." },
        ]},
        { heading: "After the rush", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Knoopologist", text: "Good rush — let's restock the milk and get the counter reset before it picks back up." },
          ]},
          { type: "para", text: "A quick reset prevents the next rush from starting already behind." },
          { type: "do", variants: [
            "Think back to the last proper rush you worked. Say one thing the team did well, and one thing you'd try differently next time.",
            "Picture the ten minutes right after a busy stretch ends. What would you reset first, and what would you flag to the team before it picks up again?",
            "Talk me through a rush that felt chaotic. Where did the coordination break down, and what single change would you make?",
          ]},
        ]},
      ],
    },
    {
      id: 6, title: "Cash Handling & Loss Prevention", type: "reading",
      summary: "Trust, made concrete — simple procedures held to the same standard every single time.",
      screens: [
        { heading: "Trust, made concrete", blocks: [
          { type: "quote", text: "Every till transaction is a small moment of trust — a customer trusts the amount charged is right, the store trusts you with real money changing hands dozens of times a shift." },
          { type: "para", text: "Most of this module is genuinely simple, procedural stuff. What makes it matter is treating it with the same consistency and seriousness every single time, not just when it's convenient." },
        ]},
        { heading: "Counting the float, properly, every time", blocks: [
          { type: "dialogue", lines: [
            { speaker: "Opener", text: "Give me just one more minute — want to make sure this count's right before we open, it saves headaches later." },
          ]},
          { type: "para", text: "Rushing this step tends to cost more time later untangling a discrepancy than it saves in the moment." },
          { type: "do", variants: [
            "Once you've learned your store's actual float-counting procedure hands-on, say how you'd explain to a new teammate why a careful count saves time later.",
            "Once you've counted a real float with a teammate, give your version of why 'close enough' costs more than the minute it saves.",
            "Once you know your store's real float procedure, talk me through what you'd say to someone rushing you to open the doors mid-count.",
          ]},
        ]},
        { heading: "Handling transactions cleanly", blocks: [
          { type: "para", text: "Confirm the total out loud before payment, count change back clearly if handling cash, and never let a transaction feel rushed through in a way that makes it hard to catch an honest mistake before it becomes a real problem." },
          { type: "dialogue", lines: [
            { speaker: "Knoopologist", text: "That's $6.50 — out of $10, so $3.50 back to you. (counting the change back clearly)" },
          ]},
        ]},
        { heading: "Why \"close enough\" isn't good enough", blocks: [
          { type: "para", text: "A small discrepancy can feel like not a big deal — easy to shrug off. Treating every discrepancy, however small, as worth understanding builds the habit that keeps small issues from becoming bigger, unnoticed ones over time. Same \"boring steps matter\" principle as Module 3's food safety content, applied to money instead of ingredients." },
        ]},
        { heading: "Loss prevention as awareness, not paranoia", blocks: [
          { type: "para", text: "General awareness — not treating every customer with suspicion. Keeping the till area reasonably tidy, being mindful during busy periods when genuine mistakes (not theft) are easiest to happen, and following your store's actual procedures for larger transactions. None of this should change how warmly you treat customers." },
        ]},
        { heading: "When something feels off", blocks: [
          { type: "para", text: "If something ever feels genuinely wrong — a transaction that doesn't sit right, a till that doesn't reconcile and you can't figure out why — say so plainly to a Shift Lead or manager rather than trying to quietly fix or hide a discrepancy yourself. Flagging something honestly and promptly is never treated as a failure here." },
          { type: "do", variants: [
            "Once you've learned your store's actual cash-handling procedure hands-on with a Store Trainer, talk me through the sequence in your own words: count, confirm, close.",
            "Once a Store Trainer has taken you through the real cash procedure, give your version of those steps, and say at which point you'd raise a count that doesn't add up.",
            "Once you've done the actual cash-handling procedure hands-on, take it from the count: say each step in order, through to close.",
          ]},
        ]},
      ],
    },
    {
      id: 7, title: "Operational Walkthrough", type: "quiz",
      summary: "A guided scenario walkthrough through one full simulated shift — not a straight recall quiz.",
      intro: "This isn't a multiple-choice recall test like Academy 1's Knowledge Check. It's a single guided walkthrough of one simulated shift — opening, a rush, a dietary-need conversation, and closing — with a decision point tied to a specific module at each step. Pick the strongest option at each step; the explanation after each one ties back to what you learned.",
      note: "Per the platform's Tell-Show-Do design, this digital walkthrough is a practice and readiness check, not full certification on its own. Genuine Academy 3 certification also requires a Store Trainer's live sign-off on an actual shift — opening, closing, and rush handling observed directly — especially since so much of this academy (float counting, real equipment, real POS systems) can only really be taught hands-on.",
      questions: [
        { q: "Opening decision: equipment is warming up slower than usual and doors open in 10 minutes. What do you prioritize?", options: ["Start the warmers immediately and build everything else around that timeline", "Do the final look-around first since customers will see it first", "Skip the stock check to save time", "Count the float last, after everything else is done"], answer: 0, explain: "Module 1: the thing that takes longest to be ready starts first — everything else fills in around it." },
        { q: "Order-flow decision: a customer's order comes in with an ambiguous detail (they said \"medium strength\" instead of a percentage). How do you clarify without slowing the line?", options: ["Guess based on what most customers order", "Ask one quick clarifying question tied to the mood framing (\"more milky and gentle, or more intense?\")", "Enter it as their most popular past order without asking", "Tell them to decide and come back"], answer: 1, explain: "Module 2, building on Academy 2's mood framing: one quick, warm question keeps the order accurate without turning it into paperwork." },
        { q: "Food-safety decision: you notice the milk has been sitting out slightly past its safe holding time. What do you do?", options: ["Use it anyway since it looks and smells fine", "Swap it for a fresh batch immediately and note it", "Wait until the rush is over to deal with it", "Ask the customer if they mind"], answer: 1, explain: "Module 3: the difference between safe and unsafe often can't be seen or tasted — follow the holding-time procedure exactly, every time." },
        { q: "Allergen decision: a customer mentions a nut allergy mid-rush. How do you balance speed and safety?", options: ["Reassure them quickly and move on to keep the line moving", "Take the extra few seconds to steer them to safe options and confirm clean prep, even mid-rush", "Suggest they come back when it's quieter", "Make a guess about which items are safe"], answer: 1, explain: "Module 4: an allergy conversation is a real safety issue, not a menu preference — it gets the same seriousness at any pace." },
        { q: "Rush decision: the drink queue is backing up more than the order queue. As the floating role, where do you move?", options: ["Stay on your original task regardless", "Move to help with drinks, where the actual backup is", "Ask a customer to wait longer instead of adjusting", "Split your attention evenly between both regardless of where the backup is"], answer: 1, explain: "Module 5: floating means noticing imbalance and moving toward it, without being told." },
        { q: "Closing decision: the till count is $2 off and you can't figure out why. What's the right move?", options: ["Adjust the number slightly so it matches and move on", "Flag it plainly to a Shift Lead or manager, even though it's small", "Ignore it since it's a small amount", "Wait to see if it happens again before saying anything"], answer: 1, explain: "Module 6: flagging a discrepancy honestly and promptly, however small, is never treated as a failure — it's the responsible move." },
      ],
    },
  ],
};
