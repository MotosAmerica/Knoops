// Knoops Academy — Analytics
//
// Read-only aggregate view over every table the platform writes to. The
// tracker answers "how is this person doing"; this answers "how is the
// TRAINING doing" — which academy is landing, where people stop, whether the
// AI grader is calibrated, and what trainees think of it.
//
// Charts are hand-rolled inline SVG: no chart library, consistent with the
// rest of this no-build static site. Single-hue magnitude bars throughout
// (the data's job is nearly always "how much", not "which one"), with one
// validated two-colour pair where a real categorical split exists.
(function () {
  // Palette: #9A532E (brand brown) + #4A5FA5 — validated together for
  // lightness band, chroma floor, CVD separation (ΔE 18.5 protan), normal
  // vision (ΔE 20.7) and contrast on this surface.
  const INK = "#9A532E";
  const ALT = "#4A5FA5";
  const TRACK = "rgba(18,18,18,0.07)";
  const AXIS = "rgba(18,18,18,0.18)";
  const TEXT_MUTED = "#8a8a8a";

  const ACADEMY_CONFIG = {
    academy1: { label: "Brand & Culture", modules: 6 },
    academy2: { label: "Ritual & Hospitality", modules: 9 },
    academy3: { label: "Counter Operations & Safety", modules: 7 },
    academy4: { label: "Craft & Recipes", modules: 5 },
    academy5: { label: "Leadership & Store Trainer", modules: 7 },
  };
  const ACADEMY_ORDER = Object.keys(ACADEMY_CONFIG);
  const LEADERSHIP_ROLES = ["store_trainer", "store_manager", "district_manager"];
  const CORE_ACADEMIES = ["academy1", "academy2", "academy3", "academy4"];
  const ROLE_LABELS = {
    knoopologist: "Knoopologist",
    shift_lead: "Shift Lead",
    store_trainer: "Store Trainer",
    store_manager: "Store Manager",
    district_manager: "District / Regional Manager",
  };

  function cfg() { return window.KNOOPS_CONFIG || {}; }
  function academyLabel(slug) {
    return (ACADEMY_CONFIG[slug] && ACADEMY_CONFIG[slug].label) || slug || "—";
  }
  function roleLabel(role) {
    if (!role) return "Knoopologist";
    return ROLE_LABELS[role] ||
      String(role).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function mean(nums) {
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
  }
  function fmt(n, dp) {
    return n === null || n === undefined ? "—" : Number(n).toFixed(dp === undefined ? 1 : dp);
  }

  async function fetchTable(table, select) {
    const c = cfg();
    const resp = await fetch(`${c.SUPABASE_URL}/rest/v1/${table}?select=${select}`, {
      headers: {
        "apikey": c.SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${c.SUPABASE_ANON_KEY}`,
      },
    });
    if (!resp.ok) throw new Error(`${table} (${resp.status})`);
    return resp.json();
  }
  // A table that may not exist yet shouldn't take the whole page down.
  async function fetchOptional(table, select) {
    try { return await fetchTable(table, select); } catch (e) { return []; }
  }

  // ---------------------------------------------------------------------
  // Chart primitives — inline SVG, thin marks, rounded data-ends, hover
  // tooltips, recessive axes.
  // ---------------------------------------------------------------------
  function tooltipFor(host) {
    let tip = host.querySelector(".an-tip");
    if (!tip) {
      tip = el("div", "an-tip");
      tip.style.display = "none";
      host.appendChild(tip);
    }
    return tip;
  }
  function wireTip(host, node, html) {
    const tip = tooltipFor(host);
    node.addEventListener("mouseenter", () => {
      tip.innerHTML = html;
      tip.style.display = "block";
    });
    node.addEventListener("mousemove", (ev) => {
      const r = host.getBoundingClientRect();
      tip.style.left = Math.min(ev.clientX - r.left + 12, r.width - 190) + "px";
      tip.style.top = (ev.clientY - r.top - 10) + "px";
    });
    node.addEventListener("mouseleave", () => { tip.style.display = "none"; });
  }

  // Horizontal bars — the default for "magnitude across named categories".
  // Category names read left-to-right without rotated labels.
  function hBarChart(host, rows, opts) {
    opts = opts || {};
    host.innerHTML = "";
    if (!rows.length) {
      host.appendChild(el("div", "tracker-empty", opts.empty || "Nothing recorded yet."));
      return;
    }
    const max = opts.max || Math.max(...rows.map((r) => r.value), 1);
    const list = el("div", "an-hbars");
    rows.forEach((r) => {
      const row = el("div", "an-hbar-row");
      row.appendChild(el("div", "an-hbar-label", esc(r.label)));
      const track = el("div", "an-hbar-track");
      const fill = el("div", "an-hbar-fill");
      fill.style.width = Math.max((r.value / max) * 100, r.value > 0 ? 1.5 : 0) + "%";
      fill.style.background = r.color || INK;
      track.appendChild(fill);
      row.appendChild(track);
      row.appendChild(el("div", "an-hbar-value", r.display !== undefined ? r.display : r.value));
      wireTip(host, row, r.tip || `<strong>${esc(r.label)}</strong><br>${r.display !== undefined ? r.display : r.value}`);
      list.appendChild(row);
    });
    host.appendChild(list);
  }

  // Vertical bars for an ordered sequence (time, or a 1-5 scale).
  function vBarChart(host, rows, opts) {
    opts = opts || {};
    host.innerHTML = "";
    if (!rows.length || rows.every((r) => !r.value)) {
      host.appendChild(el("div", "tracker-empty", opts.empty || "Nothing recorded yet."));
      return;
    }
    const W = 100, H = 34, pad = 2;
    const max = Math.max(...rows.map((r) => r.value), 1);
    const bw = (W - pad * 2) / rows.length;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H + 6}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("class", "an-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", opts.ariaLabel || "bar chart");

    // baseline
    const base = document.createElementNS("http://www.w3.org/2000/svg", "line");
    base.setAttribute("x1", pad); base.setAttribute("x2", W - pad);
    base.setAttribute("y1", H); base.setAttribute("y2", H);
    base.setAttribute("stroke", AXIS); base.setAttribute("stroke-width", "0.3");
    svg.appendChild(base);

    rows.forEach((r, i) => {
      const h = r.value ? Math.max((r.value / max) * (H - 3), 0.8) : 0;
      if (!h) return;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      // 2px surface gap between adjacent bars
      rect.setAttribute("x", pad + i * bw + bw * 0.16);
      rect.setAttribute("width", bw * 0.68);
      rect.setAttribute("y", H - h);
      rect.setAttribute("height", h);
      rect.setAttribute("rx", Math.min(bw * 0.16, 1.2));
      rect.setAttribute("fill", r.color || INK);
      svg.appendChild(rect);
    });
    host.appendChild(svg);

    // Labels + hover targets sit in HTML over the SVG so they stay crisp.
    const labels = el("div", "an-vbar-labels");
    rows.forEach((r) => {
      const cell = el("div", "an-vbar-cell");
      cell.appendChild(el("div", "an-vbar-tick", esc(r.label)));
      wireTip(host, cell, r.tip || `<strong>${esc(r.fullLabel || r.label)}</strong><br>${r.value}`);
      labels.appendChild(cell);
    });
    host.appendChild(labels);
  }

  function statTile(num, label, sub) {
    const box = el("div", "tracker-stat");
    box.appendChild(el("div", "num", num));
    box.appendChild(el("div", "label", label));
    if (sub) box.appendChild(el("div", "sub", sub));
    return box;
  }

  function isoWeekStart(d) {
    const dt = new Date(d);
    const day = (dt.getUTCDay() + 6) % 7; // Monday = 0
    dt.setUTCDate(dt.getUTCDate() - day);
    dt.setUTCHours(0, 0, 0, 0);
    return dt;
  }

  // ---------------------------------------------------------------------
  async function init() {
    const c = cfg();
    const errBox = document.getElementById("an-error");
    if (!c.SUPABASE_URL) {
      errBox.hidden = false;
      errBox.textContent = "Supabase isn't connected yet — once it is (see README), this page fills in.";
      return;
    }

    let trainees, progress, quizzes, practice, ratings, asks;
    try {
      [trainees, progress, quizzes, practice, ratings, asks] = await Promise.all([
        fetchTable("trainees", "id,name,store_location,role,created_at,last_seen_at,login_count"),
        fetchTable("module_progress", "trainee_id,academy,module_num,module_title,completed_at"),
        fetchTable("quiz_attempts", "trainee_id,academy,module_num,score,passed,created_at"),
        fetchOptional("practice_responses", "trainee_id,academy,module_num,prompt_key,prompt_text,score,input_mode,created_at"),
        fetchOptional("module_ratings", "trainee_id,academy,module_num,q_useful,q_confident,q_practice,comment,created_at"),
        fetchOptional("ask_queries", "academy,module_num,question,created_at"),
      ]);
    } catch (e) {
      errBox.hidden = false;
      errBox.textContent = "Couldn't load analytics right now — " + e.message;
      return;
    }

    renderKpis(trainees, progress, practice, ratings, asks);
    renderActivity(progress, quizzes, practice, ratings);
    renderAcademyTable(trainees, progress, quizzes, practice, ratings);
    renderFunnel(progress);
    renderPractice(practice);
    renderRatings(ratings);
    renderQuestions(asks);
    renderStoresAndRoles(trainees, progress);

    document.getElementById("an-generated").textContent =
      "Generated " + new Date().toLocaleString();
  }

  function totalModulesFor(role) {
    const list = LEADERSHIP_ROLES.indexOf(role) !== -1 ? ACADEMY_ORDER : CORE_ACADEMIES;
    return list.reduce((s, a) => s + ACADEMY_CONFIG[a].modules, 0);
  }

  // ---------------------------------------------------------------------
  function renderKpis(trainees, progress, practice, ratings, asks) {
    const host = document.getElementById("an-kpis");
    host.innerHTML = "";
    const grid = el("div", "tracker-stats");

    const now = Date.now();
    const activeSince = (days) => {
      const cut = now - days * 864e5;
      const ids = new Set();
      progress.forEach((p) => {
        if (p.completed_at && new Date(p.completed_at).getTime() >= cut) ids.add(p.trainee_id);
      });
      (practice || []).forEach((p) => {
        if (p.created_at && new Date(p.created_at).getTime() >= cut) ids.add(p.trainee_id);
      });
      return ids.size;
    };

    const certified = trainees.filter((t) => {
      const done = progress.filter((p) => p.trainee_id === t.id).length;
      return done >= totalModulesFor(t.role);
    }).length;

    const gradedPractice = (practice || []).filter((p) => typeof p.score === "number");
    const avgPractice = mean(gradedPractice.map((p) => p.score));

    const ratingVals = [];
    (ratings || []).forEach((r) =>
      ["q_useful", "q_confident", "q_practice"].forEach((k) => {
        if (typeof r[k] === "number") ratingVals.push(r[k]);
      }));
    const pctTop = ratingVals.length
      ? Math.round(ratingVals.filter((v) => v >= 4).length / ratingVals.length * 100)
      : null;

    grid.appendChild(statTile(trainees.length, "Trainees signed in",
      `${activeSince(7)} active in 7 days · ${activeSince(30)} in 30`));
    grid.appendChild(statTile(progress.length, "Modules completed",
      `${certified} fully certified`));
    grid.appendChild(statTile((practice || []).length, "Practice reps",
      gradedPractice.length ? `avg ${fmt(avgPractice)} / 5` : "none graded yet"));
    grid.appendChild(statTile(pctTop === null ? "—" : pctTop + "%", "Rated 4–5",
      ratingVals.length ? `across ${(ratings || []).length} rating${(ratings || []).length === 1 ? "" : "s"}` : "no ratings yet"));
    grid.appendChild(statTile((asks || []).length, "Founder questions asked", "via the AI widget"));
    host.appendChild(grid);
  }

  // ---------------------------------------------------------------------
  function renderActivity(progress, quizzes, practice, ratings) {
    const host = document.getElementById("an-activity");
    const events = []
      .concat(progress.map((p) => p.completed_at))
      .concat(quizzes.map((q) => q.created_at))
      .concat((practice || []).map((p) => p.created_at))
      .concat((ratings || []).map((r) => r.created_at))
      .filter(Boolean);

    if (!events.length) {
      host.innerHTML = "";
      host.appendChild(el("div", "tracker-empty", "No activity recorded yet."));
      return;
    }

    const byWeek = {};
    events.forEach((ts) => {
      const k = isoWeekStart(ts).toISOString().slice(0, 10);
      byWeek[k] = (byWeek[k] || 0) + 1;
    });
    // Fill gaps so a quiet week reads as a gap, not as missing data.
    const keys = Object.keys(byWeek).sort();
    const start = new Date(keys[0]);
    const end = isoWeekStart(Date.now());
    const rows = [];
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 7)) {
      const k = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      rows.push({
        label: rows.length % 2 === 0 ? label : "",
        fullLabel: "Week of " + label,
        value: byWeek[k] || 0,
        tip: `<strong>Week of ${label}</strong><br>${byWeek[k] || 0} event${(byWeek[k] || 0) === 1 ? "" : "s"}`,
      });
    }
    vBarChart(host, rows.slice(-26), { ariaLabel: "Recorded events per week" });
  }

  // ---------------------------------------------------------------------
  function renderAcademyTable(trainees, progress, quizzes, practice, ratings) {
    const host = document.getElementById("an-academy-table");
    host.innerHTML = "";
    const table = document.createElement("table");
    table.className = "tracker-table an-table";
    table.innerHTML = `<thead><tr>
      <th>Academy</th><th>Started</th><th>Finished</th><th>Completion</th>
      <th>Avg quiz</th><th>Avg practice</th><th>Rated 4–5</th>
    </tr></thead>`;
    const tbody = document.createElement("tbody");

    ACADEMY_ORDER.forEach((slug) => {
      const conf = ACADEMY_CONFIG[slug];
      const prog = progress.filter((p) => p.academy === slug);
      const starters = new Set(prog.map((p) => p.trainee_id));
      const finishers = [...starters].filter((id) =>
        prog.filter((p) => p.trainee_id === id).length >= conf.modules).length;
      const possible = starters.size * conf.modules;
      const pct = possible ? Math.round(prog.length / possible * 100) : 0;

      const qs = quizzes.filter((q) => q.academy === slug && typeof q.score === "number");
      const ps = (practice || []).filter((p) => p.academy === slug && typeof p.score === "number");
      const rs = (ratings || []).filter((r) => r.academy === slug);
      const rvals = [];
      rs.forEach((r) => ["q_useful", "q_confident", "q_practice"].forEach((k) => {
        if (typeof r[k] === "number") rvals.push(r[k]);
      }));
      const rpct = rvals.length
        ? Math.round(rvals.filter((v) => v >= 4).length / rvals.length * 100) : null;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${esc(conf.label)}</strong><div class="an-sub">${conf.modules} modules</div></td>
        <td>${starters.size}</td>
        <td>${finishers}</td>
        <td>
          <div class="tracker-bar-wrap"><div class="tracker-bar" style="width:${pct}%"></div></div>
          <div class="an-sub">${pct}% of started modules</div>
        </td>
        <td>${qs.length ? Math.round(mean(qs.map((q) => q.score))) + "%" : "—"}<div class="an-sub">${qs.length} attempt${qs.length === 1 ? "" : "s"}</div></td>
        <td>${ps.length ? fmt(mean(ps.map((p) => p.score))) + " / 5" : "—"}<div class="an-sub">${ps.length} rep${ps.length === 1 ? "" : "s"}</div></td>
        <td>${rpct === null ? "—" : rpct + "%"}<div class="an-sub">${rs.length} rating${rs.length === 1 ? "" : "s"}</div></td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    const scroll = el("div", "an-table-scroll");
    scroll.appendChild(table);
    host.appendChild(scroll);
  }

  // ---------------------------------------------------------------------
  function renderFunnel(progress) {
    const sel = document.getElementById("an-funnel-academy");
    const host = document.getElementById("an-funnel");
    if (!sel.options.length) {
      ACADEMY_ORDER.forEach((slug) => {
        const o = document.createElement("option");
        o.value = slug;
        o.textContent = ACADEMY_CONFIG[slug].label;
        sel.appendChild(o);
      });
      sel.addEventListener("change", () => draw());
    }
    function draw() {
      const slug = sel.value || ACADEMY_ORDER[0];
      const conf = ACADEMY_CONFIG[slug];
      const rows = [];
      for (let m = 1; m <= conf.modules; m++) {
        const done = progress.filter((p) => p.academy === slug && p.module_num === m);
        const title = (done[0] && done[0].module_title) || `Module ${m}`;
        rows.push({
          label: `${m}. ${title}`,
          value: done.length,
          tip: `<strong>${esc(title)}</strong><br>${done.length} completion${done.length === 1 ? "" : "s"}`,
        });
      }
      hBarChart(host, rows, { empty: "Nobody has completed a module in this academy yet." });
    }
    draw();
  }

  // ---------------------------------------------------------------------
  function renderPractice(practice) {
    practice = practice || [];
    const kpis = document.getElementById("an-practice-kpis");
    kpis.innerHTML = "";
    const graded = practice.filter((p) => typeof p.score === "number");
    const voice = practice.filter((p) => p.input_mode === "voice").length;
    const retried = {};
    practice.forEach((p) => {
      const k = `${p.trainee_id}|${p.academy}|${p.module_num}|${p.prompt_key}`;
      retried[k] = (retried[k] || 0) + 1;
    });
    const retryRate = Object.keys(retried).length
      ? Math.round(Object.values(retried).filter((n) => n > 1).length / Object.keys(retried).length * 100)
      : 0;

    const grid = el("div", "tracker-stats");
    grid.appendChild(statTile(practice.length, "Total reps",
      `${graded.length} graded`));
    grid.appendChild(statTile(graded.length ? fmt(mean(graded.map((p) => p.score))) : "—",
      "Average score", "out of 5"));
    grid.appendChild(statTile(practice.length ? Math.round(voice / practice.length * 100) + "%" : "—",
      "Answered by voice", `${voice} of ${practice.length}`));
    grid.appendChild(statTile(retryRate + "%", "Prompts retried",
      "attempted more than once"));
    kpis.appendChild(grid);

    // Score distribution 1-5
    const dist = [1, 2, 3, 4, 5].map((n) => {
      const count = graded.filter((p) => p.score === n).length;
      const pct = graded.length ? Math.round(count / graded.length * 100) : 0;
      return {
        label: String(n),
        fullLabel: `Score ${n}`,
        value: count,
        tip: `<strong>Score ${n}</strong><br>${count} rep${count === 1 ? "" : "s"} (${pct}%)`,
      };
    });
    vBarChart(document.getElementById("an-score-dist"), dist, {
      ariaLabel: "Practice score distribution 1 to 5",
      empty: "No graded reps yet.",
    });

    // Voice vs typed — the one genuine categorical split on this page.
    const typed = practice.length - voice;
    hBarChart(document.getElementById("an-input-mode"), [
      { label: "Spoken", value: voice, color: INK, display: voice },
      { label: "Typed", value: typed, color: ALT, display: typed },
    ], { max: Math.max(voice, typed, 1), empty: "No reps yet." });

    // Hardest prompts
    const byPrompt = {};
    graded.forEach((p) => {
      const k = `${p.academy}|${p.module_num}|${p.prompt_key}`;
      (byPrompt[k] = byPrompt[k] || { scores: [], text: p.prompt_text, academy: p.academy, mod: p.module_num }).scores.push(p.score);
    });
    const hard = Object.values(byPrompt)
      .filter((x) => x.scores.length >= 2)
      .map((x) => ({ ...x, avg: mean(x.scores) }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 8);

    const host = document.getElementById("an-hard-prompts");
    host.innerHTML = "";
    if (!hard.length) {
      host.appendChild(el("div", "tracker-empty", "Not enough attempts yet — a prompt needs at least 2."));
      return;
    }
    const list = el("div", "an-prompt-list");
    hard.forEach((h) => {
      const item = el("div", "an-prompt");
      item.appendChild(el("div", "an-prompt-score", fmt(h.avg)));
      const body = el("div", "an-prompt-body");
      body.appendChild(el("div", "an-prompt-text", esc(h.text || "(prompt text not recorded)")));
      body.appendChild(el("div", "an-sub",
        `${esc(academyLabel(h.academy))} · module ${h.mod} · ${h.scores.length} attempts`));
      item.appendChild(body);
      list.appendChild(item);
    });
    host.appendChild(list);
  }

  // ---------------------------------------------------------------------
  const RATING_QS = [
    ["q_useful", "Learned something usable"],
    ["q_confident", "Feel more confident"],
    ["q_practice", "Practice beat reading"],
  ];

  function renderRatings(ratings) {
    ratings = ratings || [];
    const kpis = document.getElementById("an-rating-kpis");
    kpis.innerHTML = "";
    const grid = el("div", "tracker-stats");
    RATING_QS.forEach(([key, label]) => {
      const vals = ratings.map((r) => r[key]).filter((v) => typeof v === "number");
      const pct = vals.length ? Math.round(vals.filter((v) => v >= 4).length / vals.length * 100) : null;
      grid.appendChild(statTile(pct === null ? "—" : pct + "%", label,
        vals.length ? `rated 4–5 · avg ${fmt(mean(vals))} · n=${vals.length}` : "no responses"));
    });
    kpis.appendChild(grid);

    // Distribution across all three questions pooled
    const pooled = [];
    ratings.forEach((r) => RATING_QS.forEach(([k]) => {
      if (typeof r[k] === "number") pooled.push(r[k]);
    }));
    const dist = [1, 2, 3, 4, 5].map((n) => {
      const count = pooled.filter((v) => v === n).length;
      const pct = pooled.length ? Math.round(count / pooled.length * 100) : 0;
      return {
        label: n + "★",
        fullLabel: `${n} star${n === 1 ? "" : "s"}`,
        value: count,
        tip: `<strong>${n} star${n === 1 ? "" : "s"}</strong><br>${count} response${count === 1 ? "" : "s"} (${pct}%)`,
      };
    });
    vBarChart(document.getElementById("an-rating-dist"), dist, {
      ariaLabel: "Star rating distribution",
      empty: "No ratings yet.",
    });

    const host = document.getElementById("an-comments");
    host.innerHTML = "";
    const comments = ratings.filter((r) => r.comment && r.comment.trim())
      .sort((a, b) => (b.created_at || "") > (a.created_at || "") ? 1 : -1);
    if (!comments.length) {
      host.appendChild(el("div", "tracker-empty", "No written or spoken comments yet."));
      return;
    }
    const list = el("div", "ratings-comments");
    comments.forEach((c) => {
      const item = el("div", "ratings-comment");
      item.appendChild(el("div", "ratings-comment-text", `"${esc(c.comment.trim())}"`));
      item.appendChild(el("div", "ratings-comment-meta",
        `${esc(academyLabel(c.academy))}${c.created_at ? " · " + new Date(c.created_at).toLocaleDateString() : ""}`));
      list.appendChild(item);
    });
    host.appendChild(list);
  }

  // ---------------------------------------------------------------------
  function renderQuestions(asks) {
    asks = asks || [];
    const host = document.getElementById("an-questions");
    host.innerHTML = "";
    if (!asks.length) {
      host.appendChild(el("div", "tracker-empty", "Nobody has asked the founder anything yet."));
      return;
    }
    const counts = {};
    asks.forEach((a) => {
      const q = (a.question || "").trim();
      if (!q) return;
      const key = q.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
      (counts[key] = counts[key] || { q, n: 0 }).n++;
    });
    const top = Object.values(counts).sort((a, b) => b.n - a.n).slice(0, 15);
    const list = el("div", "an-prompt-list");
    top.forEach((t) => {
      const item = el("div", "an-prompt");
      item.appendChild(el("div", "an-prompt-score", "×" + t.n));
      const body = el("div", "an-prompt-body");
      body.appendChild(el("div", "an-prompt-text", esc(t.q)));
      item.appendChild(body);
      list.appendChild(item);
    });
    host.appendChild(list);
  }

  // ---------------------------------------------------------------------
  function renderStoresAndRoles(trainees, progress) {
    const doneBy = {};
    progress.forEach((p) => { doneBy[p.trainee_id] = (doneBy[p.trainee_id] || 0) + 1; });

    const stores = {};
    trainees.forEach((t) => {
      const s = t.store_location || "—";
      (stores[s] = stores[s] || { people: 0, done: 0, possible: 0 });
      stores[s].people++;
      stores[s].done += doneBy[t.id] || 0;
      stores[s].possible += totalModulesFor(t.role);
    });
    const storeRows = Object.entries(stores)
      .map(([label, v]) => ({
        label,
        value: v.possible ? Math.round(v.done / v.possible * 100) : 0,
        display: (v.possible ? Math.round(v.done / v.possible * 100) : 0) + "%",
        tip: `<strong>${esc(label)}</strong><br>${v.people} signed in · ${v.done} modules done`,
      }))
      .sort((a, b) => b.value - a.value);
    hBarChart(document.getElementById("an-by-store"), storeRows,
      { max: 100, empty: "No stores yet." });

    const roles = {};
    trainees.forEach((t) => {
      const r = roleLabel(t.role);
      roles[r] = (roles[r] || 0) + 1;
    });
    const roleRows = Object.entries(roles)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    hBarChart(document.getElementById("an-by-role"), roleRows, { empty: "No roles yet." });
  }

  window.KnoopsAnalytics = { init };
})();
