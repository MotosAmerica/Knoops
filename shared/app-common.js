// Knoops Academy — shared platform engine
// Reads window.ACADEMY_DATA (set by each academy's content-data.js) and
// renders the module nav, reading screens, Ask widget, and quizzes.
// Progress is stored in localStorage per academy until Supabase is wired
// up (see README) — swapping to real trainee/analytics tracking later only
// requires changing saveProgress()/loadProgress(), not the render logic.

(function () {
  const DATA = window.ACADEMY_DATA;
  if (!DATA) return;

  const PROGRESS_KEY = `knoops_progress_${DATA.slug}`;

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }
  function saveProgress(moduleId, done, extra) {
    try {
      const p = loadProgress();
      p[moduleId] = done;
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    } catch (e) { /* best-effort only */ }
    syncProgressToSupabase(moduleId, extra);
  }

  // ---------- Server-side progress sync (for the manager tracker) ----------
  // Best-effort: if there's no trainee signed in yet, or Supabase isn't
  // configured, or the request fails, local progress (above) still works —
  // this only adds the "a manager can see it" layer on top.
  function syncProgressToSupabase(moduleId, extra) {
    const c = window.KNOOPS_CONFIG || {};
    const signIn = window.KnoopsSignIn;
    if (!c.SUPABASE_URL || !signIn) return;
    const trainee = signIn.getTrainee();
    if (!trainee || trainee._local || String(trainee.id).indexOf("local-") === 0) return;
    const mod = DATA.modules.find((m) => m.id === moduleId);
    const headers = {
      "Content-Type": "application/json",
      "apikey": c.SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${c.SUPABASE_ANON_KEY}`,
      "Prefer": "resolution=merge-duplicates",
    };
    fetch(`${c.SUPABASE_URL}/rest/v1/module_progress?on_conflict=trainee_id,academy,module_num`, {
      method: "POST",
      headers,
      body: JSON.stringify([{
        trainee_id: trainee.id,
        academy: DATA.slug,
        module_num: moduleId,
        module_title: mod ? mod.title : null,
      }]),
    }).catch(() => {});
    if (extra && extra.quiz) {
      fetch(`${c.SUPABASE_URL}/rest/v1/quiz_attempts`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=minimal" },
        body: JSON.stringify([{
          trainee_id: trainee.id,
          academy: DATA.slug,
          module_num: moduleId,
          score: extra.quiz.scorePct,
          passed: extra.quiz.scorePct >= 80,
        }]),
      }).catch(() => {});
    }
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  // ---------- Module nav (top of every module page) ----------
  function renderModuleNav(activeId) {
    const nav = qs("#module-nav");
    if (!nav) return;
    const progress = loadProgress();
    DATA.modules.forEach((m) => {
      const a = el("a", "", `${m.id}. ${m.title}`);
      a.href = `module.html?m=${m.id}`;
      if (m.id === activeId) a.classList.add("active");
      if (progress[m.id]) a.classList.add("done");
      nav.appendChild(a);
    });
  }

  // ---------- "Do — Practice": speak or type, AI-graded 1-5 ----------
  // Designed phone-first: most Knoopologists will do this on a handset, often
  // on a break, so the primary input is the mic and the keyboard is the
  // fallback (not the other way round).
  //
  // Speech is transcribed on-device by the browser's own speech recognition —
  // no audio ever leaves the phone, no transcription API key, no per-minute
  // cost. The transcript lands in an editable box so a mis-heard word can be
  // fixed before submitting. Browsers without it (mainly Firefox) just get the
  // text box, and nothing else about the flow changes.
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

  function practiceCacheKey(ctx, promptKey) {
    return `knoops_practice_${DATA.slug}_${ctx.moduleId}_${promptKey}`;
  }

  function loadCachedPractice(ctx, promptKey) {
    try {
      return JSON.parse(localStorage.getItem(practiceCacheKey(ctx, promptKey)) || "null");
    } catch (e) { return null; }
  }
  function cachePractice(ctx, promptKey, payload) {
    try {
      localStorage.setItem(practiceCacheKey(ctx, promptKey), JSON.stringify(payload));
    } catch (e) { /* best-effort */ }
  }

  function savePracticeToSupabase(ctx, promptKey, promptText, responseText, mode, result) {
    const c = window.KNOOPS_CONFIG || {};
    const signIn = window.KnoopsSignIn;
    if (!c.SUPABASE_URL || !signIn) return;
    const trainee = signIn.getTrainee();
    if (!trainee || trainee._local || String(trainee.id).indexOf("local-") === 0) return;
    fetch(`${c.SUPABASE_URL}/rest/v1/practice_responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": c.SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${c.SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify([{
        trainee_id: trainee.id,
        academy: DATA.slug,
        module_num: ctx.moduleId,
        prompt_key: promptKey,
        prompt_text: promptText,
        response_text: responseText,
        input_mode: mode,
        score: result ? result.score : null,
        feedback: result ? result.feedback : null,
      }]),
    }).catch(() => {});
  }

  function renderScorePips(score) {
    const wrap = el("div", "practice-score");
    wrap.appendChild(el("span", "practice-score-label", "Score"));
    const pips = el("div", "practice-pips");
    for (let i = 1; i <= 5; i++) {
      const pip = el("span", "practice-pip" + (i <= score ? " filled" : ""), String(i));
      pips.appendChild(pip);
    }
    wrap.appendChild(pips);
    return wrap;
  }

  function renderPracticeBlock(block, ctx) {
    ctx = ctx || { moduleId: 0, moduleTitle: "", screenIdx: 0 };
    const promptKey = `${ctx.screenIdx}-${ctx.blockIdx}`;

    const wrap = el("div", "do-prompt practice-card");
    wrap.appendChild(el("div", "tag", "Do — practice"));
    wrap.appendChild(el("p", "practice-prompt", block.text));

    // --- input row: mic (primary) + textarea (fallback/edit) ---
    const controls = el("div", "practice-controls");
    const ta = document.createElement("textarea");
    ta.className = "practice-input";
    ta.placeholder = SpeechRec
      ? "Tap the mic and just say your answer — or type it here."
      : "Type your answer here.";

    let recognizer = null;
    let listening = false;
    let usedVoice = false;

    if (SpeechRec) {
      const micBtn = el("button", "practice-mic");
      micBtn.type = "button";
      micBtn.innerHTML = `<span class="mic-icon">🎙</span><span class="mic-label">Tap to answer out loud</span>`;

      const setListening = (on) => {
        listening = on;
        micBtn.classList.toggle("listening", on);
        micBtn.querySelector(".mic-label").textContent = on
          ? "Listening… tap to stop"
          : "Tap to answer out loud";
      };

      micBtn.addEventListener("click", () => {
        if (listening && recognizer) { recognizer.stop(); return; }
        try {
          recognizer = new SpeechRec();
        } catch (e) {
          micBtn.style.display = "none";
          return;
        }
        recognizer.lang = navigator.language || "en-GB";
        recognizer.interimResults = true;
        recognizer.continuous = true;
        let finalText = ta.value ? ta.value + " " : "";

        recognizer.onresult = (ev) => {
          let interim = "";
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const chunk = ev.results[i][0].transcript;
            if (ev.results[i].isFinal) { finalText += chunk + " "; usedVoice = true; }
            else interim += chunk;
          }
          ta.value = (finalText + interim).replace(/\s+/g, " ").trimStart();
        };
        recognizer.onerror = (ev) => {
          setListening(false);
          if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
            status.textContent = "Mic access is blocked — you can type your answer instead.";
            status.className = "practice-status warn";
          }
        };
        recognizer.onend = () => setListening(false);

        try { recognizer.start(); setListening(true); } catch (e) { setListening(false); }
      });

      controls.appendChild(micBtn);
    }

    controls.appendChild(ta);
    wrap.appendChild(controls);

    const actions = el("div", "practice-actions");
    const submitBtn = el("button", "practice-submit", "Get feedback");
    submitBtn.type = "button";
    actions.appendChild(submitBtn);
    const status = el("span", "practice-status", "");
    actions.appendChild(status);
    wrap.appendChild(actions);

    const resultBox = el("div", "practice-result");
    resultBox.style.display = "none";
    wrap.appendChild(resultBox);

    function showResult(result, responseText) {
      resultBox.innerHTML = "";
      resultBox.appendChild(renderScorePips(result.score));
      resultBox.appendChild(el("p", "practice-feedback", result.feedback));
      const again = el("button", "practice-retry", "Try it again");
      again.type = "button";
      again.addEventListener("click", () => {
        resultBox.style.display = "none";
        ta.value = "";
        submitBtn.disabled = false;
        submitBtn.textContent = "Get feedback";
        status.textContent = "";
        ta.focus();
      });
      resultBox.appendChild(again);
      resultBox.style.display = "block";
      cachePractice(ctx, promptKey, { response: responseText, result });
    }

    // Restore a previous attempt on this device
    const cached = loadCachedPractice(ctx, promptKey);
    if (cached && cached.result) {
      ta.value = cached.response || "";
      showResult(cached.result, cached.response);
      submitBtn.disabled = true;
      submitBtn.textContent = "Graded";
    }

    submitBtn.addEventListener("click", () => {
      const text = ta.value.trim();
      if (text.length < 5) {
        status.textContent = "Say or write a little more first.";
        status.className = "practice-status warn";
        return;
      }
      if (listening && recognizer) recognizer.stop();

      const c = window.KNOOPS_CONFIG || {};
      if (!c.SUPABASE_URL) {
        // No backend configured — still keep the answer, be honest about it.
        status.textContent = "Saved on this device. AI feedback needs the backend connected.";
        status.className = "practice-status";
        cachePractice(ctx, promptKey, { response: text, result: null });
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Reading your answer…";
      status.textContent = "";
      status.className = "practice-status";

      fetch(`${c.SUPABASE_URL}/functions/v1/knoops-academy-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${c.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: "grade",
          academy: DATA.slug,
          module: ctx.moduleId,
          moduleTitle: ctx.moduleTitle,
          prompt: block.text,
          response: text,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data || typeof data.score === "undefined") throw new Error("bad response");
          showResult(data, text);
          submitBtn.textContent = "Graded";
          savePracticeToSupabase(
            ctx, promptKey, block.text, text, usedVoice ? "voice" : "text", data
          );
        })
        .catch(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = "Get feedback";
          status.textContent = "Couldn't reach the grader just now — your answer is saved, try again in a moment.";
          status.className = "practice-status warn";
          cachePractice(ctx, promptKey, { response: text, result: null });
          savePracticeToSupabase(ctx, promptKey, block.text, text, usedVoice ? "voice" : "text", null);
        });
    });

    return wrap;
  }

  // ---------- Block renderers ----------
  function renderBlock(block, ctx) {
    switch (block.type) {
      case "quote":
        return el("blockquote", "", block.text);
      case "para":
        return el("p", "", block.text);
      case "dialogue": {
        const wrap = el("div", "dialogue");
        block.lines.forEach((line) => {
          const p = el("div", "line");
          p.innerHTML = `<span class="speaker">${line.speaker}:</span> "${line.text}"`;
          wrap.appendChild(p);
        });
        return wrap;
      }
      case "do":
        return renderPracticeBlock(block, ctx);
      case "placeholder":
        return el("div", "placeholder-flag", `⚠ Placeholder — ${block.text}`);
      case "list": {
        const ul = el("ul");
        block.items.forEach((i) => ul.appendChild(el("li", "", i)));
        return ul;
      }
      default:
        return el("p", "", block.text || "");
    }
  }

  // ---------- Reading module (screens) ----------
  function renderReadingModule(mod, container) {
    mod.screens.forEach((screen, idx) => {
      const s = el("div", "screen");
      s.appendChild(el("h2", "", `${idx + 1}. ${screen.heading}`));
      screen.blocks.forEach((b, bIdx) => s.appendChild(renderBlock(b, {
        moduleId: mod.id,
        moduleTitle: mod.title,
        screenIdx: idx,
        blockIdx: bIdx,
      })));
      container.appendChild(s);
    });
    const doneBtn = el("button", "btn", "Mark module complete");
    doneBtn.onclick = () => {
      saveProgress(mod.id, true);
      doneBtn.textContent = "✓ Completed";
      doneBtn.disabled = true;
    };
    if (loadProgress()[mod.id]) {
      doneBtn.textContent = "✓ Completed";
      doneBtn.disabled = true;
    }
    container.appendChild(doneBtn);
  }

  // ---------- Ask widget (Ask the Founder / Ask This Manual) ----------
  async function callAskAI(question, mod) {
    const cfg = window.KNOOPS_CONFIG || {};
    if (!cfg.SUPABASE_URL) {
      return {
        notConnected: true,
        text: "This widget isn't connected to a live AI backend yet — once Supabase is set up (see README), this will answer using Jens' real, sourced quotes below.",
      };
    }
    try {
      const resp = await fetch(`${cfg.SUPABASE_URL}/functions/v1/${cfg.AI_FUNCTION_NAME}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ academy: DATA.slug, module: mod.id, question }),
      });
      const json = await resp.json();
      return { text: json.answer || "No answer returned." };
    } catch (e) {
      return { text: "Something went wrong reaching the AI — check your Supabase config.", error: true };
    }
  }

  function renderAskModule(mod, container) {
    const wrap = el("div", "ask-widget");
    wrap.appendChild(el("h3", "", mod.title));
    wrap.appendChild(el("p", "", mod.intro));

    const chips = el("div", "chips");
    (mod.chips || []).forEach((c) => {
      const chip = el("button", "chip", c);
      chip.onclick = () => { input.value = c; ask(); };
      chips.appendChild(chip);
    });
    wrap.appendChild(chips);

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Ask a question...";
    wrap.appendChild(input);

    const answerBox = el("div", "answer");
    answerBox.style.display = "none";
    wrap.appendChild(answerBox);

    const note = el("div", "config-note");
    if (mod.groundingTable) {
      note.appendChild(document.createTextNode("Grounded in Jens Knoop's real, "));
      const link = el("a", "sources-link", "sourced interviews");
      link.href = "#";
      link.onclick = (e) => { e.preventDefault(); openSourcesModal(mod.groundingTable); };
      note.appendChild(link);
      note.appendChild(document.createTextNode(" — never invented quotes."));
    } else {
      note.textContent = "Grounded in Jens Knoop's real, sourced interviews — never invented quotes.";
    }
    wrap.appendChild(note);

    async function ask() {
      if (!input.value.trim()) return;
      answerBox.style.display = "block";
      answerBox.textContent = "Thinking...";
      const result = await callAskAI(input.value.trim(), mod);
      answerBox.textContent = result.text;
    }
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") ask(); });

    container.appendChild(wrap);
  }

  // ---------- Sources modal (the grounding-quote popup) ----------
  function openSourcesModal(groundingTable) {
    let overlay = qs("#sources-modal-overlay");
    if (overlay) overlay.remove();

    overlay = el("div", "sources-modal-overlay");
    const card = el("div", "sources-modal");
    const closeBtn = el("button", "sources-modal-close", "×");
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.onclick = () => overlay.remove();
    card.appendChild(closeBtn);
    card.appendChild(el("h2", "", "Where these answers come from"));
    card.appendChild(el("p", "", "Every answer above is grounded only in these real, sourced quotes — nothing is invented."));

    const table = document.createElement("table");
    table.className = "sources-table";
    groundingTable.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td class="sources-topic">${row.topic}</td><td>${row.quote}<br><a href="${row.sourceUrl}" target="_blank" rel="noopener">${row.source}</a></td>`;
      table.appendChild(tr);
    });
    card.appendChild(table);
    overlay.appendChild(card);
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  }

  // ---------- Quiz module (reveal-and-explain) ----------
  function renderQuizModule(mod, container) {
    const results = {};
    if (mod.intro) {
      container.appendChild(el("p", "quiz-intro", mod.intro));
    }
    mod.questions.forEach((q, qi) => {
      const box = el("div", "quiz-q");
      box.appendChild(el("div", "q-text", `${qi + 1}. ${q.q}`));
      const explain = el("div", "explain", q.explain);
      explain.style.display = "none";
      q.options.forEach((opt, oi) => {
        const label = document.createElement("label");
        label.innerHTML = `<input type="radio" name="q${qi}" style="margin-right:8px;">${opt}`;
        label.onclick = () => {
          [...box.querySelectorAll("label")].forEach((l) => l.classList.remove("correct", "incorrect"));
          if (oi === q.answer) {
            label.classList.add("correct");
          } else {
            label.classList.add("incorrect");
            box.querySelectorAll("label")[q.answer].classList.add("correct");
          }
          explain.style.display = "block";
          results[qi] = oi === q.answer;
        };
        box.appendChild(label);
      });
      box.appendChild(explain);
      container.appendChild(box);
    });
    if (mod.note) {
      container.appendChild(el("p", "quiz-note", mod.note));
    }
    const doneBtn = el("button", "btn", "Mark module complete");
    doneBtn.onclick = () => {
      const answered = Object.keys(results).length;
      const correct = Object.values(results).filter(Boolean).length;
      const scorePct = answered ? Math.round((correct / mod.questions.length) * 100) : 0;
      saveProgress(mod.id, true, { quiz: { scorePct } });
      doneBtn.textContent = "✓ Completed";
      doneBtn.disabled = true;
    };
    container.appendChild(doneBtn);
  }

  // ---------- Entry point for module.html ----------
  function initModulePage() {
    const params = new URLSearchParams(location.search);
    const modId = parseInt(params.get("m") || "1", 10);
    const mod = DATA.modules.find((m) => m.id === modId);
    if (!mod) return;

    document.title = `${mod.title} — ${DATA.title}`;
    qs("#module-title").textContent = `${DATA.title} — Module ${mod.id}`;
    renderModuleNav(modId);

    const container = qs("#module-content");
    if (mod.type === "ask") renderAskModule(mod, container);
    else if (mod.type === "quiz") renderQuizModule(mod, container);
    else renderReadingModule(mod, container);

    // prev/next
    const idx = DATA.modules.findIndex((m) => m.id === modId);
    const prev = DATA.modules[idx - 1];
    const next = DATA.modules[idx + 1];
    const footer = qs("#footer-nav");
    if (footer) {
      footer.innerHTML = "";
      if (prev) {
        const a = el("a", "btn secondary", `← ${prev.title}`);
        a.href = `module.html?m=${prev.id}`;
        footer.appendChild(a);
      } else {
        footer.appendChild(el("a", "btn secondary", "← Back to hub")).href = "../index.html";
      }
      if (next) {
        const a = el("a", "btn", `${next.title} →`);
        a.href = `module.html?m=${next.id}`;
        footer.appendChild(a);
      } else {
        const a = el("a", "btn", "Back to all academies →");
        a.href = "../index.html";
        footer.appendChild(a);
      }
    }
  }

  // ---------- Entry point for academy index.html ----------
  function initAcademyIndex() {
    qs("#academy-title").textContent = DATA.title;
    qs("#academy-desc").textContent = DATA.description || "";
    const grid = qs("#module-grid");
    const progress = loadProgress();
    DATA.modules.forEach((m) => {
      const card = el("a", "card");
      card.href = `module.html?m=${m.id}`;
      const icon = el("div", `button-icon ${progress[m.id] ? "done" : "tan"}`, progress[m.id] ? "✓" : m.id);
      card.appendChild(icon);
      card.appendChild(el("h3", "", m.title));
      card.appendChild(el("p", "", m.summary || ""));
      grid.appendChild(card);
    });
  }

  window.KnoopsAcademy = { initModulePage, initAcademyIndex, loadProgress };
})();
