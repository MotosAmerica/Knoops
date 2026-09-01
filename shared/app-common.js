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

  // ---------- Block renderers ----------
  function renderBlock(block) {
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
      case "do": {
        const wrap = el("div", "do-prompt");
        wrap.appendChild(el("div", "tag", "Do — practice"));
        wrap.appendChild(el("p", "", block.text));
        const ta = document.createElement("textarea");
        ta.placeholder = "Write your response here (saved on this device only)...";
        wrap.appendChild(ta);
        return wrap;
      }
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
      screen.blocks.forEach((b) => s.appendChild(renderBlock(b)));
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
