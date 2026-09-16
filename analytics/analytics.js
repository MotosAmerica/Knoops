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

  // "2h 14m" / "18m" / "40s" — never "0.31 hours", which nobody reads.
  function fmtDur(ms) {
    if (!ms || ms < 1000) return "—";
    const mins = Math.round(ms / 60000);
    if (mins < 1) return Math.round(ms / 1000) + "s";
    if (mins < 60) return mins + "m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  function median(nums) {
    if (!nums.length) return null;
    const s = nums.slice().sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }
  function dayKey(ts) { return new Date(ts).toISOString().slice(0, 10); }
  function daysAgo(ts) {
    if (!ts) return null;
    return Math.floor((Date.now() - new Date(ts).getTime()) / 864e5);
  }
  function agoLabel(ts) {
    const d = daysAgo(ts);
    if (d === null) return "—";
    if (d <= 0) return "today";
    if (d === 1) return "yesterday";
    if (d < 30) return d + " days ago";
    if (d < 60) return "a month ago";
    return Math.round(d / 30) + " months ago";
  }
  // Consecutive days with activity, counting back from today. A streak that
  // ended yesterday still counts — asking someone to have trained TODAY to
  // have a streak makes the number useless before lunch.
  function streakFrom(dayKeys) {
    if (!dayKeys.length) return 0;
    const set = {};
    dayKeys.forEach((k) => { set[k] = 1; });
    const today = new Date();
    let cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    if (!set[cursor.toISOString().slice(0, 10)]) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      if (!set[cursor.toISOString().slice(0, 10)]) return 0;
    }
    let n = 0;
    while (set[cursor.toISOString().slice(0, 10)]) {
      n++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return n;
  }

  function isoWeekStart(d) {
    const dt = new Date(d);
    const day = (dt.getUTCDay() + 6) % 7; // Monday = 0
    dt.setUTCDate(dt.getUTCDate() - day);
    dt.setUTCHours(0, 0, 0, 0);
    return dt;
  }

  // ---------------------------------------------------------------------
  // Collapsible sections.
  //
  // The page outgrew a single scroll. Each section folds down to its heading —
  // but a heading alone ("AI practice") would force you to open everything to
  // find anything, so every collapsed header carries its own headline number.
  // Collapsed, the page reads as a summary; expanded, it's the same detail as
  // before. Open/closed is remembered per browser, so the default only matters
  // on a first visit.
  const COLLAPSE_KEY = "knoops_an_open";
  const DEFAULT_OPEN = ["people"];
  const openState = {};

  function readOpenState() {
    try {
      const raw = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "null");
      return raw && typeof raw === "object" ? raw : null;
    } catch (e) { return null; }
  }
  function saveOpenState() {
    try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(openState)); } catch (e) {}
  }

  // Render functions call this; it's a no-op if the section isn't on the page.
  function setSummary(key, text) {
    const n = document.querySelector(`[data-summary="${key}"]`);
    if (n) n.textContent = text || "";
  }

  const toggles = {};
  function setOpen(key, open, persist) {
    const t = toggles[key];
    if (!t) return;
    t.btn.setAttribute("aria-expanded", open ? "true" : "false");
    t.body.hidden = !open;
    t.section.classList.toggle("is-open", open);
    openState[key] = open;
    if (persist !== false) saveOpenState();
  }

  // Print one section as a standalone report.
  //
  // A section can be printed while collapsed, and the people table can be
  // capped at 40 rows on screen — a printed report that silently omits rows
  // would be worse than no report, so both are forced open for the print and
  // put back afterwards.
  function printSection(key, label) {
    const t = toggles[key];
    if (!t) return;
    const wasOpen = openState[key] === true;

    const showAll = t.section.querySelector(".an-more");
    if (showAll) showAll.click();

    document.body.classList.add("an-printing");
    t.section.classList.add("an-print-target");
    if (!wasOpen) setOpen(key, true, false);

    const stamp = document.getElementById("an-print-stamp");
    if (stamp) {
      stamp.textContent = `Knoops Academy · ${label || key} · ${new Date().toLocaleString()}`;
    }

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      document.body.classList.remove("an-printing");
      t.section.classList.remove("an-print-target");
      if (!wasOpen) setOpen(key, false, false);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    // Let the reflow land before the dialog snapshots the page, and keep a
    // timer as a backstop for browsers that never fire afterprint.
    setTimeout(() => {
      try { window.print(); } catch (e) {}
      setTimeout(cleanup, 1500);
    }, 60);
  }

  function setupCollapsibles() {
    const saved = readOpenState();
    const sections = Array.from(document.querySelectorAll("section.an-section[data-key]"));
    const hash = (location.hash || "").replace(/^#/, "");

    sections.forEach((sec) => {
      const key = sec.getAttribute("data-key");
      const h2 = sec.querySelector("h2");
      if (!key || !h2) return;

      // Everything after the heading becomes the collapsible body.
      const body = el("div", "an-body");
      body.id = `an-body-${key}`;
      let n = h2.nextSibling;
      while (n) { const next = n.nextSibling; body.appendChild(n); n = next; }
      sec.appendChild(body);

      // Button inside the heading keeps both the heading semantics and a real
      // keyboard-operable control.
      const label = h2.innerHTML;
      h2.innerHTML = "";
      h2.classList.add("an-h2");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "an-head";
      btn.setAttribute("aria-controls", body.id);
      btn.innerHTML =
        `<span class="an-chev" aria-hidden="true"></span>` +
        `<span class="an-head-title">${label}</span>` +
        `<span class="an-head-summary" data-summary="${key}"></span>`;
      h2.appendChild(btn);

      // The print control is a SIBLING of the toggle, never inside it — a
      // button nested inside a button is invalid HTML and the inner click gets
      // swallowed by the outer one.
      const plain = label.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim();
      const printBtn = document.createElement("button");
      printBtn.type = "button";
      printBtn.className = "an-print";
      printBtn.textContent = "Print";
      printBtn.title = `Print this section`;
      printBtn.setAttribute("aria-label", `Print report: ${plain}`);
      h2.appendChild(printBtn);
      printBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        printSection(key, plain);
      });

      toggles[key] = { btn, body, section: sec, printBtn, label: plain };
      btn.addEventListener("click", () => {
        setOpen(key, btn.getAttribute("aria-expanded") !== "true");
      });

      const open = hash === key ? true
        : saved ? !!saved[key]
        : DEFAULT_OPEN.indexOf(key) !== -1;
      setOpen(key, open, false);
    });

    const all = (open) => () => {
      Object.keys(toggles).forEach((k) => setOpen(k, open, false));
      saveOpenState();
    };
    const ex = document.getElementById("an-expand-all");
    const col = document.getElementById("an-collapse-all");
    const printAll = document.getElementById("an-print-all");
    if (ex) ex.addEventListener("click", all(true));
    if (col) col.addEventListener("click", all(false));
    if (printAll) {
      printAll.addEventListener("click", () => {
        // Whole-page report: everything open, nothing singled out.
        Object.keys(toggles).forEach((k) => {
          const more = toggles[k].section.querySelector(".an-more");
          if (more) more.click();
          setOpen(k, true, false);
        });
        const stamp = document.getElementById("an-print-stamp");
        if (stamp) stamp.textContent = `Knoops Academy · Full analytics report · ${new Date().toLocaleString()}`;
        setTimeout(() => { try { window.print(); } catch (e) {} }, 80);
      });
    }
  }

  // ---------------------------------------------------------------------
  async function init() {
    setupCollapsibles();
    const c = cfg();
    const errBox = document.getElementById("an-error");
    if (!c.SUPABASE_URL) {
      errBox.hidden = false;
      errBox.textContent = "Supabase isn't connected yet — once it is (see README), this page fills in.";
      return;
    }

    let trainees, progress, quizzes, practice, ratings, asks, sessions, usage;
    try {
      [trainees, progress, quizzes, practice, ratings, asks, sessions, usage] = await Promise.all([
        fetchTable("trainees", "id,name,store_location,role,created_at,last_seen_at,login_count"),
        fetchTable("module_progress", "trainee_id,academy,module_num,module_title,completed_at"),
        fetchTable("quiz_attempts", "trainee_id,academy,module_num,score,passed,created_at"),
        fetchOptional("practice_responses", "trainee_id,academy,module_num,prompt_key,prompt_text,score,input_mode,created_at"),
        fetchOptional("module_ratings", "trainee_id,academy,module_num,q_useful,q_confident,q_practice,comment,created_at"),
        fetchOptional("ask_queries", "academy,module_num,question,created_at"),
        fetchOptional("trainee_sessions", "trainee_id,started_at,last_beat_at,active_ms,device,screen_w"),
        fetchOptional("ai_usage", "kind,trainee_id,academy,module_num,model,input_tokens,output_tokens,cache_read_tokens,cache_write_tokens,ok,created_at"),
      ]);
    } catch (e) {
      errBox.hidden = false;
      errBox.textContent = "Couldn't load analytics right now — " + e.message;
      return;
    }

    renderKpis(trainees, progress, practice, ratings, asks);
    renderPeople(trainees, progress, quizzes, practice, sessions);
    renderActivity(progress, quizzes, practice, ratings);
    renderHabits(sessions, trainees);
    renderWhen(progress, quizzes, practice, ratings, sessions);
    renderAcademyTable(trainees, progress, quizzes, practice, ratings);
    renderFunnel(progress);
    renderPractice(practice);
    renderTokens(usage, trainees);
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
  // Who's training — the one place on this page that names individuals.
  //
  // The strip is a meter for a whole path, not five separate charts: one block
  // per academy in that person's path, each block's WIDTH proportional to how
  // many modules the academy holds, each block filled by how many they've done.
  // So the ink across the strip is literally their overall completion, and a
  // full strip is a finished path. Identity is positional (see the key above
  // the table) rather than five colours — five hues here would fail CVD
  // separation and would imply the academies are unrelated categories when
  // they're actually a sequence.
  const PEOPLE_PAGE = 40;

  function pathFor(role) {
    return LEADERSHIP_ROLES.indexOf(role) !== -1 ? ACADEMY_ORDER : CORE_ACADEMIES;
  }

  function buildPeopleRows(trainees, progress, quizzes, practice, sessions) {
    const sessionsBy = {};
    (sessions || []).forEach((s) => {
      (sessionsBy[s.trainee_id] = sessionsBy[s.trainee_id] || []).push(s);
    });
    const daysBy = {};
    progress.concat(quizzes || [], practice || []).forEach((r) => {
      const ts = r.completed_at || r.created_at;
      if (!ts || !r.trainee_id) return;
      (daysBy[r.trainee_id] = daysBy[r.trainee_id] || {})[dayKey(ts)] = 1;
    });
    (sessions || []).forEach((s) => {
      if (!s.started_at || !s.trainee_id) return;
      (daysBy[s.trainee_id] = daysBy[s.trainee_id] || {})[dayKey(s.started_at)] = 1;
    });

    const progressBy = {};
    progress.forEach((p) => {
      (progressBy[p.trainee_id] = progressBy[p.trainee_id] || []).push(p);
    });
    const practiceBy = {};
    (practice || []).forEach((p) => {
      (practiceBy[p.trainee_id] = practiceBy[p.trainee_id] || []).push(p);
    });
    const lastActive = {};
    progress.concat(quizzes || [], practice || []).forEach((r) => {
      const ts = r.completed_at || r.created_at;
      if (!ts || !r.trainee_id) return;
      if (!lastActive[r.trainee_id] || ts > lastActive[r.trainee_id]) {
        lastActive[r.trainee_id] = ts;
      }
    });

    return trainees.map((t) => {
      // Count each module once — a module re-opened and re-completed is still
      // one module done, and the raw table has a row per completion.
      const seen = {};
      const doneByAcademy = {};
      (progressBy[t.id] || []).forEach((d) => {
        const k = d.academy + "|" + d.module_num;
        if (seen[k]) return;
        seen[k] = 1;
        doneByAcademy[d.academy] = (doneByAcademy[d.academy] || 0) + 1;
      });

      const path = pathFor(t.role);
      let total = 0, completed = 0;
      const segments = path.map((slug) => {
        const conf = ACADEMY_CONFIG[slug];
        const done = Math.min(doneByAcademy[slug] || 0, conf.modules);
        total += conf.modules;
        completed += done;
        return { slug, label: conf.label, modules: conf.modules, done };
      });

      // Modules finished in an academy that isn't part of this person's path.
      // Nothing stops a Knoopologist opening Academy 5, so this can be real.
      let offPath = 0;
      Object.keys(doneByAcademy).forEach((slug) => {
        if (path.indexOf(slug) === -1) offPath += doneByAcademy[slug];
      });

      const myPractice = practiceBy[t.id] || [];
      const graded = myPractice.filter((p) => typeof p.score === "number");
      const nextUp = segments.filter((s) => s.done < s.modules)[0] || null;

      const mySessions = sessionsBy[t.id] || [];
      const activeMs = mySessions.reduce((s, x) => s + (Number(x.active_ms) || 0), 0);
      const devices = {};
      mySessions.forEach((x) => {
        if (x.device) devices[x.device] = (devices[x.device] || 0) + 1;
      });
      const topDevice = Object.keys(devices).sort((a, b) => devices[b] - devices[a])[0] || null;
      const deviceMix = topDevice && devices[topDevice] < mySessions.length ? "mostly " + topDevice : topDevice;

      const dayKeys = Object.keys(daysBy[t.id] || {});
      const lastTs = lastActive[t.id] || t.last_seen_at || t.created_at || null;
      const since = daysAgo(lastTs);

      return {
        id: t.id,
        name: t.name || "(no name)",
        store: t.store_location || "—",
        role: roleLabel(t.role),
        segments,
        offPath,
        completed,
        total,
        pct: total ? Math.round(completed / total * 100) : 0,
        position: !completed ? "Not started"
          : !nextUp ? "Path complete"
          : `On ${nextUp.label} (${nextUp.done}/${nextUp.modules})`,
        practiceCount: myPractice.length,
        voiceCount: myPractice.filter((p) => p.input_mode === "voice").length,
        avgPractice: graded.length ? mean(graded.map((p) => p.score)) : null,
        lastActive: lastTs,
        // --- engagement ---
        sessionCount: mySessions.length,
        activeMs,
        deviceMix,
        daysActive: dayKeys.length,
        streak: streakFrom(dayKeys),
        daysSince: since,
        // Started, not finished, and gone quiet for a fortnight. Not a
        // judgement — it's the list a Store Trainer should actually work from.
        stalled: completed > 0 && (!nextUp ? false : true) && since !== null && since >= 14,
      };
    });
  }

  function pathStrip(host, row) {
    const strip = el("div", "an-strip");
    strip.setAttribute("role", "img");
    strip.setAttribute("aria-label",
      `${row.completed} of ${row.total} modules complete`);
    row.segments.forEach((s, i) => {
      const seg = el("div", "an-strip-seg");
      seg.style.flex = `${s.modules} 1 0`;
      const fill = el("div", "an-strip-fill");
      fill.style.width = (s.done / s.modules) * 100 + "%";
      seg.appendChild(fill);
      wireTip(host, seg,
        `<strong>${i + 1}. ${esc(s.label)}</strong><br>${s.done} of ${s.modules} modules`);
      strip.appendChild(seg);
    });
    return strip;
  }

  function renderPeopleKey(rows) {
    const host = document.getElementById("an-people-key");
    if (!host) return;
    host.innerHTML = "";
    const anyLeadership = rows.some((r) => r.segments.length === ACADEMY_ORDER.length);
    const shown = anyLeadership ? ACADEMY_ORDER : CORE_ACADEMIES;
    shown.forEach((slug, i) => {
      const item = el("div", "an-key-item");
      item.appendChild(el("span", "an-key-num", String(i + 1)));
      item.appendChild(el("span", null, esc(ACADEMY_CONFIG[slug].label)));
      host.appendChild(item);
    });
  }

  function renderPeople(trainees, progress, quizzes, practice, sessions) {
    const host = document.getElementById("an-people");
    if (!host) return;
    const rows = buildPeopleRows(trainees, progress, quizzes, practice, sessions);
    renderPeopleKey(rows);

    const stalledCount = rows.filter((r) => r.stalled).length;
    const avgPct = rows.length ? Math.round(mean(rows.map((r) => r.pct))) : 0;
    setSummary("people", rows.length
      ? `${rows.length} ${rows.length === 1 ? "trainee" : "trainees"} · ${avgPct}% average completion` +
        (stalledCount ? ` · ${stalledCount} stalled` : "")
      : "nobody signed in yet");

    const search = document.getElementById("an-people-search");
    const storeSel = document.getElementById("an-people-store");
    const sortSel = document.getElementById("an-people-sort");

    if (storeSel && storeSel.options.length <= 1) {
      Array.from(new Set(rows.map((r) => r.store))).sort().forEach((s) => {
        const o = document.createElement("option");
        o.value = s; o.textContent = s;
        storeSel.appendChild(o);
      });
    }

    let expanded = false;
    function draw() {
      const q = (search && search.value || "").trim().toLowerCase();
      const store = storeSel ? storeSel.value : "";
      const sort = sortSel ? sortSel.value : "recent";

      let list = rows.filter((r) => {
        if (q && r.name.toLowerCase().indexOf(q) === -1) return false;
        if (store && r.store !== store) return false;
        return true;
      });
      list = list.slice().sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "progress-desc") return b.pct - a.pct || a.name.localeCompare(b.name);
        if (sort === "progress-asc") return a.pct - b.pct || a.name.localeCompare(b.name);
        return String(b.lastActive || "").localeCompare(String(a.lastActive || ""));
      });

      host.innerHTML = "";
      if (!list.length) {
        host.appendChild(el("div", "tracker-empty",
          rows.length ? "Nobody matches these filters."
                      : "Nobody has signed in yet — this fills in on the first sign-in."));
        return;
      }

      const table = document.createElement("table");
      table.className = "tracker-table an-table an-people-table";
      table.innerHTML = `<thead><tr>
        <th>Trainee</th><th>Store</th><th>Progress</th><th>Practice</th>
        <th>Time on task</th><th>Last active</th>
      </tr></thead>`;
      const tbody = document.createElement("tbody");

      const visible = expanded ? list : list.slice(0, PEOPLE_PAGE);
      visible.forEach((r) => {
        const tr = document.createElement("tr");

        const nameTd = document.createElement("td");
        nameTd.innerHTML =
          `<div class="an-people-name">${esc(r.name)}</div><div class="an-sub">${esc(r.role)}</div>`;

        const storeTd = document.createElement("td");
        storeTd.textContent = r.store;

        const progTd = document.createElement("td");
        progTd.className = "an-people-cell";
        progTd.appendChild(pathStrip(host, r));
        const sub = `${r.completed} / ${r.total} modules · ${r.pct}% · ${esc(r.position)}` +
          (r.offPath ? ` · +${r.offPath} outside their path` : "");
        progTd.appendChild(el("div", "an-sub", sub));

        const pracTd = document.createElement("td");
        pracTd.innerHTML = r.practiceCount
          ? `<strong>${r.avgPractice === null ? "—" : fmt(r.avgPractice)}</strong>${r.avgPractice === null ? "" : " / 5"}
             <div class="an-sub">${r.practiceCount} rep${r.practiceCount === 1 ? "" : "s"}${r.voiceCount ? ` · ${r.voiceCount} spoken` : ""}</div>`
          : `<span style="color:#aaa">—</span>`;

        // Time on task: total active minutes, then the shape of the effort —
        // how many separate days, any current streak, and what they train on.
        const engTd = document.createElement("td");
        const engBits = [];
        if (r.daysActive) engBits.push(`${r.daysActive} day${r.daysActive === 1 ? "" : "s"} active`);
        if (r.streak > 1) engBits.push(`${r.streak}-day streak`);
        if (r.deviceMix) engBits.push(r.deviceMix);
        engTd.innerHTML = r.activeMs
          ? `<strong>${esc(fmtDur(r.activeMs))}</strong>
             <div class="an-sub">${esc(engBits.join(" · ") || "—")}</div>`
          : `<span style="color:#aaa">—</span>${engBits.length
              ? `<div class="an-sub">${esc(engBits.join(" · "))}</div>` : ""}`;

        const lastTd = document.createElement("td");
        lastTd.innerHTML = r.lastActive
          ? `${esc(agoLabel(r.lastActive))}${r.stalled
              ? '<div class="an-pill an-pill--idle">stalled</div>' : ""}`
          : "—";

        [nameTd, storeTd, progTd, pracTd, engTd, lastTd].forEach((td) => tr.appendChild(td));
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);

      const scroll = el("div", "an-table-scroll");
      scroll.appendChild(table);
      host.appendChild(scroll);

      if (!expanded && list.length > PEOPLE_PAGE) {
        const btn = el("button", "an-more",
          `Show all ${list.length} trainees`);
        btn.type = "button";
        btn.addEventListener("click", () => { expanded = true; draw(); });
        host.appendChild(btn);
      }
    }

    if (search) search.addEventListener("input", () => { expanded = false; draw(); });
    if (storeSel) storeSel.addEventListener("change", () => { expanded = false; draw(); });
    if (sortSel) sortSel.addEventListener("change", draw);
    draw();
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
      setSummary("activity", "nothing recorded yet");
      return;
    }
    const cut30 = Date.now() - 30 * 864e5;
    const last30 = events.filter((ts) => new Date(ts).getTime() >= cut30).length;
    setSummary("activity",
      `${events.length} recorded action${events.length === 1 ? "" : "s"} · ${last30} in the last 30 days`);

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
  // How people train — device, visit length, and timing.
  //
  // Device and visit length only exist from the day session tracking shipped,
  // so the scope line says so out loud rather than letting a thin chart read
  // as "nobody trains".
  const DEVICE_ORDER = ["phone", "tablet", "desktop"];
  const DEVICE_LABEL = { phone: "Phone", tablet: "Tablet", desktop: "Desktop" };
  const LEN_BUCKETS = [
    { label: "<2m", max: 2 },
    { label: "2–5m", max: 5 },
    { label: "5–10m", max: 10 },
    { label: "10–20m", max: 20 },
    { label: "20–45m", max: 45 },
    { label: "45m+", max: Infinity },
  ];

  function renderHabits(sessions, trainees) {
    sessions = sessions || [];
    const scope = document.getElementById("an-habits-scope");
    const kpis = document.getElementById("an-habits-kpis");
    const deviceHost = document.getElementById("an-device");
    const lenHost = document.getElementById("an-session-len");
    if (!kpis) return;

    if (!sessions.length) {
      if (scope) {
        scope.innerHTML = "Visit tracking is live but nothing has been recorded yet — " +
          "this fills in from the next time somebody opens a module. It only covers visits " +
          "from the day tracking shipped, so it will stay thin for a while even though the " +
          "rest of the page covers the whole history.";
      }
      kpis.innerHTML = "";
      [deviceHost, lenHost].forEach((h) => {
        if (!h) return;
        h.innerHTML = "";
        h.appendChild(el("div", "tracker-empty", "No visits recorded yet."));
      });
      setSummary("habits", "no visits recorded yet");
      return;
    }

    const first = sessions.map((s) => s.started_at).filter(Boolean).sort()[0];
    if (scope && first) {
      scope.innerHTML =
        `Device and visit length, recorded per visit since <strong>${esc(new Date(first).toLocaleDateString())}</strong> — ` +
        "earlier training predates this tracking and isn't counted here. Durations are <em>active</em> " +
        "time: the clock only runs while someone is on the page and using it, so a tab left open over " +
        "a break isn't counted as training.";
    }

    const durations = sessions.map((s) => Number(s.active_ms) || 0).filter((m) => m > 0);
    const totalMs = durations.reduce((a, b) => a + b, 0);
    const people = new Set(sessions.map((s) => s.trainee_id).filter(Boolean));
    const phone = sessions.filter((s) => s.device === "phone").length;

    const grid = el("div", "tracker-stats");
    grid.appendChild(statTile(fmtDur(median(durations)), "Median visit",
      durations.length ? `${durations.length} visit${durations.length === 1 ? "" : "s"} timed` : "none timed"));
    grid.appendChild(statTile(fmtDur(totalMs), "Total time on task",
      people.size ? `across ${people.size} ${people.size === 1 ? "person" : "people"}` : ""));
    grid.appendChild(statTile(
      sessions.length ? Math.round(phone / sessions.length * 100) + "%" : "—",
      "On a phone", `${phone} of ${sessions.length} visits`));
    grid.appendChild(statTile(
      people.size ? (sessions.length / people.size).toFixed(1) : "—",
      "Visits per person", "since tracking started"));
    kpis.innerHTML = "";
    kpis.appendChild(grid);

    setSummary("habits",
      `median visit ${fmtDur(median(durations))} · ` +
      `${sessions.length ? Math.round(phone / sessions.length * 100) : 0}% on a phone · ` +
      `${fmtDur(totalMs)} total`);

    // Device split — single hue. Three named categories whose job is "how
    // much", so magnitude, not identity; the labels carry the identity.
    const byDevice = {};
    sessions.forEach((s) => {
      const d = DEVICE_ORDER.indexOf(s.device) !== -1 ? s.device : "desktop";
      byDevice[d] = (byDevice[d] || 0) + 1;
    });
    hBarChart(deviceHost, DEVICE_ORDER.map((d) => ({
      label: DEVICE_LABEL[d],
      value: byDevice[d] || 0,
      display: byDevice[d] || 0,
      tip: `<strong>${DEVICE_LABEL[d]}</strong><br>${byDevice[d] || 0} of ${sessions.length} visits`,
    })), { empty: "No visits recorded yet." });

    // Visit length distribution.
    const buckets = LEN_BUCKETS.map((b) => ({ label: b.label, fullLabel: b.label, value: 0 }));
    durations.forEach((ms) => {
      const mins = ms / 60000;
      const idx = LEN_BUCKETS.findIndex((b) => mins < b.max);
      buckets[idx === -1 ? buckets.length - 1 : idx].value++;
    });
    buckets.forEach((b) => {
      b.tip = `<strong>${b.label}</strong><br>${b.value} visit${b.value === 1 ? "" : "s"}`;
    });
    vBarChart(lenHost, buckets, {
      ariaLabel: "Distribution of visit lengths",
      empty: "No timed visits yet.",
    });
  }

  // ---------------------------------------------------------------------
  // When people train — day of week × 2-hour block, in the viewer's own
  // timezone. Built from EVERY recorded event, not just sessions, so it works
  // retroactively over the whole history instead of only since tracking
  // shipped. Sequential single hue (never a rainbow) because the value is
  // magnitude; the peak is also named in text underneath so the finding is
  // never colour-only.
  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const HEAT_STEPS = [0.08, 0.24, 0.44, 0.66, 0.9];

  function renderWhen(progress, quizzes, practice, ratings, sessions) {
    const host = document.getElementById("an-when");
    const peakHost = document.getElementById("an-when-peak");
    if (!host) return;

    const stamps = []
      .concat(progress.map((p) => p.completed_at))
      .concat((quizzes || []).map((q) => q.created_at))
      .concat((practice || []).map((p) => p.created_at))
      .concat((ratings || []).map((r) => r.created_at))
      .concat((sessions || []).map((s) => s.started_at))
      .filter(Boolean);

    host.innerHTML = "";
    if (peakHost) peakHost.textContent = "";
    if (!stamps.length) {
      host.appendChild(el("div", "tracker-empty", "No activity recorded yet."));
      return;
    }

    const grid = {};      // "day|block" -> count
    let max = 0;
    stamps.forEach((ts) => {
      const d = new Date(ts);
      const day = (d.getDay() + 6) % 7;         // Monday = 0, local time
      const block = Math.floor(d.getHours() / 2); // 12 two-hour blocks
      const k = day + "|" + block;
      grid[k] = (grid[k] || 0) + 1;
      if (grid[k] > max) max = grid[k];
    });

    const wrap = el("div", "an-heat");
    const table = el("div", "an-heat-grid");
    for (let day = 0; day < 7; day++) {
      table.appendChild(el("div", "an-heat-daylabel", DAY_LABELS[day]));
      for (let b = 0; b < 12; b++) {
        const n = grid[day + "|" + b] || 0;
        const cell = el("div", "an-heat-cell");
        if (n) {
          const step = Math.min(HEAT_STEPS.length - 1,
            Math.floor((n / max) * HEAT_STEPS.length - 0.0001));
          cell.style.background = `rgba(154, 83, 46, ${HEAT_STEPS[Math.max(step, 0)]})`;
        }
        const from = String(b * 2).padStart(2, "0");
        const to = String(b * 2 + 2).padStart(2, "0");
        wireTip(host, cell,
          `<strong>${DAY_LABELS[day]} ${from}:00–${to}:00</strong><br>${n} action${n === 1 ? "" : "s"}`);
        table.appendChild(cell);
      }
    }
    // Hour ruler under the grid: every 4 hours, so labels never collide.
    table.appendChild(el("div", "an-heat-daylabel", ""));
    for (let b = 0; b < 12; b++) {
      table.appendChild(el("div", "an-heat-hour", b % 2 === 0 ? String(b * 2) : ""));
    }
    wrap.appendChild(table);

    const legend = el("div", "an-heat-legend");
    legend.appendChild(el("span", "an-heat-legend-text", "less"));
    HEAT_STEPS.forEach((a) => {
      const sw = el("span", "an-heat-swatch");
      sw.style.background = `rgba(154, 83, 46, ${a})`;
      legend.appendChild(sw);
    });
    legend.appendChild(el("span", "an-heat-legend-text", "more"));
    wrap.appendChild(legend);
    host.appendChild(wrap);

    if (peakHost) {
      const best = Object.keys(grid).sort((a, b) => grid[b] - grid[a])[0];
      const [day, block] = best.split("|").map(Number);
      const from = String(block * 2).padStart(2, "0");
      const to = String(block * 2 + 2).padStart(2, "0");
      peakHost.textContent =
        `Busiest window: ${DAY_LABELS[day]} ${from}:00–${to}:00 (${grid[best]} of ${stamps.length} recorded actions). ` +
        `Times are your browser's local timezone.`;
    }
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

    const started = ACADEMY_ORDER.filter((slug) =>
      progress.some((p) => p.academy === slug)).length;
    setSummary("academies", `${started} of ${ACADEMY_ORDER.length} academies started`);
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

      // The point of this chart is the cliff, so the collapsed header names it.
      let drop = null;
      for (let i = 1; i < rows.length; i++) {
        const d = rows[i - 1].value - rows[i].value;
        if (d > 0 && (!drop || d > drop.size)) drop = { size: d, at: i + 1 };
      }
      setSummary("funnel", rows.some((r) => r.value)
        ? (drop ? `${conf.label} · biggest drop at module ${drop.at}`
                : `${conf.label} · no drop-off yet`)
        : `${conf.label} · nothing completed yet`);
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

    setSummary("practice", practice.length
      ? `${practice.length} rep${practice.length === 1 ? "" : "s"}` +
        (graded.length ? ` · avg ${fmt(mean(graded.map((p) => p.score)))} / 5` : " · none graded") +
        (practice.length ? ` · ${Math.round(voice / practice.length * 100)}% spoken` : "")
      : "no practice reps yet");

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
  // AI token use.
  //
  // Deliberately tokens only, no currency. Token counts are facts reported by
  // the API on every call; a dollar figure would be this page guessing at a
  // rate card that changes, and the metering that matters already lives in the
  // Anthropic console. What this answers is the question the console can't:
  // WHERE the tokens went — which feature, which week, which trainee.
  const KIND_LABEL = { grade: "Practice grading", ask: "Ask the Founder" };

  function rowTokens(r) {
    return (r.input_tokens || 0) + (r.output_tokens || 0) +
           (r.cache_read_tokens || 0) + (r.cache_write_tokens || 0);
  }
  // Keep one decimal up to 100K. Rounding 15,500 to "16K" implies precision the
  // number doesn't have and makes two different weeks look identical; past 100K
  // the decimal stops carrying information. Trailing ".0" is dropped, so 14,000
  // reads "14K" rather than "14.0K".
  function fmtTokens(n) {
    if (!n) return "0";
    const trim = (x) => x.replace(/\.0$/, "");
    if (n >= 1e7) return Math.round(n / 1e6) + "M";
    if (n >= 1e6) return trim((n / 1e6).toFixed(1)) + "M";
    if (n >= 1e5) return Math.round(n / 1000) + "K";
    if (n >= 1000) return trim((n / 1000).toFixed(1)) + "K";
    return String(Math.round(n));
  }

  function renderTokens(usage, trainees) {
    usage = usage || [];
    const kpis = document.getElementById("an-tokens-kpis");
    const splitHost = document.getElementById("an-token-split");
    const trendHost = document.getElementById("an-token-trend");
    const peopleHost = document.getElementById("an-token-people");
    const noteHost = document.getElementById("an-token-note");
    if (!kpis) return;

    if (!usage.length) {
      kpis.innerHTML = "";
      [splitHost, trendHost, peopleHost].forEach((h) => {
        if (!h) return;
        h.innerHTML = "";
        h.appendChild(el("div", "tracker-empty",
          "No AI calls logged yet — this fills in from the next graded practice answer or founder question."));
      });
      if (noteHost) noteHost.textContent = "";
      setSummary("tokens", "nothing logged yet");
      return;
    }

    const total = usage.reduce((s, r) => s + rowTokens(r), 0);
    const failed = usage.filter((r) => r.ok === false).length;
    const gradeRows = usage.filter((r) => r.kind === "grade");
    const perGrade = gradeRows.length
      ? gradeRows.reduce((s, r) => s + rowTokens(r), 0) / gradeRows.length : null;
    const people = new Set(usage.map((r) => r.trainee_id).filter(Boolean));

    const grid = el("div", "tracker-stats");
    grid.appendChild(statTile(fmtTokens(total), "Tokens used",
      `${usage.length} AI call${usage.length === 1 ? "" : "s"}` +
      (failed ? ` · ${failed} failed` : "")));
    grid.appendChild(statTile(perGrade === null ? "—" : fmtTokens(perGrade),
      "Per graded answer", `${gradeRows.length} graded`));
    grid.appendChild(statTile(
      people.size ? fmtTokens(total / people.size) : "—",
      "Per trainee", people.size ? `across ${people.size}` : "not attributed yet"));
    const outTok = usage.reduce((s, r) => s + (r.output_tokens || 0), 0);
    grid.appendChild(statTile(
      total ? Math.round(outTok / total * 100) + "%" : "—",
      "Returned by the model", "the rest is what we send it"));
    kpis.innerHTML = "";
    kpis.appendChild(grid);

    setSummary("tokens",
      `${fmtTokens(total)} tokens · ${usage.length} call${usage.length === 1 ? "" : "s"}` +
      (perGrade === null ? "" : ` · ${fmtTokens(perGrade)} per graded answer`));

    // Where it goes — by feature, then the sent/returned split. The split is
    // the actionable half: the grading prompt ships the whole module text as
    // `taught` on every rep, which is why "sent" dominates.
    const byKind = {};
    usage.forEach((r) => {
      const k = r.kind || "other";
      (byKind[k] = byKind[k] || { tokens: 0, calls: 0 });
      byKind[k].tokens += rowTokens(r);
      byKind[k].calls++;
    });
    const sumIn = total - outTok;
    const splitRows = Object.keys(byKind)
      .sort((a, b) => byKind[b].tokens - byKind[a].tokens)
      .map((k) => ({
        label: KIND_LABEL[k] || k,
        value: byKind[k].tokens,
        display: fmtTokens(byKind[k].tokens),
        tip: `<strong>${esc(KIND_LABEL[k] || k)}</strong><br>${byKind[k].calls} call${byKind[k].calls === 1 ? "" : "s"}` +
             `<br>${fmtTokens(byKind[k].tokens)} tokens`,
      }))
      .concat([
        { label: "— sent to the model", value: sumIn, display: fmtTokens(sumIn),
          tip: `<strong>Sent to the model</strong><br>${fmtTokens(sumIn)} tokens<br>Prompt, module text and the answer being graded.` },
        { label: "— returned", value: outTok, display: fmtTokens(outTok),
          tip: `<strong>Returned by the model</strong><br>${fmtTokens(outTok)} tokens<br>Scores and feedback.` },
      ]);
    hBarChart(splitHost, splitRows, { empty: "No AI calls logged yet." });

    // Weekly trend
    const byWeek = {};
    usage.forEach((r) => {
      if (!r.created_at) return;
      const k = isoWeekStart(r.created_at).toISOString().slice(0, 10);
      byWeek[k] = (byWeek[k] || 0) + rowTokens(r);
    });
    const weeks = Object.keys(byWeek).sort();
    const trendRows = [];
    if (weeks.length) {
      const start = new Date(weeks[0]);
      const end = isoWeekStart(Date.now());
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 7)) {
        const k = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        trendRows.push({
          label: trendRows.length % 2 === 0 ? label : "",
          fullLabel: "Week of " + label,
          value: byWeek[k] || 0,
          tip: `<strong>Week of ${label}</strong><br>${fmtTokens(byWeek[k] || 0)} tokens`,
        });
      }
    }
    vBarChart(trendHost, trendRows.slice(-26), {
      ariaLabel: "Tokens used per week", empty: "No AI calls logged yet.",
    });

    // Per trainee
    const nameById = {};
    (trainees || []).forEach((t) => { nameById[t.id] = t.name || "(no name)"; });
    const byPerson = {};
    usage.forEach((r) => {
      const key = r.trainee_id || "__none";
      (byPerson[key] = byPerson[key] || { tokens: 0, calls: 0 });
      byPerson[key].tokens += rowTokens(r);
      byPerson[key].calls++;
    });
    const personRows = Object.keys(byPerson)
      .map((id) => {
        const name = id === "__none" ? "Not attributed" : (nameById[id] || "(unknown trainee)");
        return {
          label: name,
          value: byPerson[id].tokens,
          display: fmtTokens(byPerson[id].tokens),
          tip: `<strong>${esc(name)}</strong><br>${byPerson[id].calls} call${byPerson[id].calls === 1 ? "" : "s"}` +
               `<br>${fmtTokens(byPerson[id].tokens)} tokens` +
               (id === "__none" ? "<br>Founder questions aren't tied to a person." : ""),
        };
      })
      .sort((a, b) => b.value - a.value);
    hBarChart(peopleHost, personRows, { empty: "No AI calls logged yet." });

    if (noteHost) {
      noteHost.textContent =
        "Counts are reported by the API on each call and logged server-side, so they're actual usage, " +
        "not an estimate. Billing lives in the Anthropic console — this page answers where the tokens went.";
    }
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
    setSummary("ratings", pooled.length
      ? `${ratings.length} rating${ratings.length === 1 ? "" : "s"} · ` +
        `${Math.round(pooled.filter((v) => v >= 4).length / pooled.length * 100)}% rated 4–5`
      : "no ratings yet");
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
      setSummary("asks", "none asked yet");
      return;
    }
    setSummary("asks", `${asks.length} question${asks.length === 1 ? "" : "s"} asked`);
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

    const storeCount = Object.keys(stores).length;
    setSummary("stores", trainees.length
      ? `${storeCount} store${storeCount === 1 ? "" : "s"} · ${roleRows.length} role${roleRows.length === 1 ? "" : "s"}`
      : "nobody signed in yet");
  }

  window.KnoopsAnalytics = { init };
})();
