// Knoops Academy — Team Progress tracker
// Reads (never writes) from the same `trainees` and `module_progress` /
// `quiz_attempts` tables every academy page writes to. No new backend, no
// login of its own — see README for why, same model as the Motos tracker.
(function () {
  const ACADEMY_CONFIG = {
    academy1: { label: "Brand & Culture", modules: 6 },
    academy2: { label: "Ritual & Hospitality", modules: 9 },
    academy3: { label: "Counter Operations & Safety", modules: 7 },
    academy4: { label: "Craft & Recipes", modules: 5 },
    academy5: { label: "Leadership & Store Trainer", modules: 7 },
  };
  const LEADERSHIP_ROLES = ["store_trainer", "store_manager", "district_manager"];
  const CORE_ACADEMIES = ["academy1", "academy2", "academy3", "academy4"];

  function cfg() { return window.KNOOPS_CONFIG || {}; }
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function academyLabel(slug) {
    return (ACADEMY_CONFIG[slug] && ACADEMY_CONFIG[slug].label) || slug;
  }

  async function fetchTable(table, select) {
    const c = cfg();
    const resp = await fetch(`${c.SUPABASE_URL}/rest/v1/${table}?select=${select}`, {
      headers: {
        "apikey": c.SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${c.SUPABASE_ANON_KEY}`,
      },
    });
    if (!resp.ok) throw new Error(`${table} fetch failed (${resp.status})`);
    return resp.json();
  }

  function totalModulesFor(role) {
    const academies = LEADERSHIP_ROLES.indexOf(role) !== -1
      ? Object.keys(ACADEMY_CONFIG)
      : CORE_ACADEMIES;
    return academies.reduce((sum, a) => sum + ACADEMY_CONFIG[a].modules, 0);
  }

  // This page deliberately doesn't load signin.js (it has no sign-in of its
  // own), so it can't read KnoopsSignIn.ROLES — keep a local label map and
  // fall back to prettifying the raw value rather than showing "store_trainer".
  const ROLE_LABELS = {
    knoopologist: "Knoopologist",
    shift_lead: "Shift Lead",
    store_trainer: "Store Trainer",
    store_manager: "Store Manager",
    district_manager: "District / Regional Manager",
  };
  function roleLabel(role) {
    if (!role) return "Knoopologist";
    if (ROLE_LABELS[role]) return ROLE_LABELS[role];
    return String(role).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async function init() {
    const c = cfg();
    const wrap = document.getElementById("tracker-table-wrap");
    if (!c.SUPABASE_URL) {
      wrap.innerHTML = "";
      wrap.appendChild(el("div", "tracker-empty", "Supabase isn't connected yet — once it is (see README), this page will show live sign-ins and progress."));
      return;
    }

    let trainees, progress, attempts, practice, ratings;
    try {
      [trainees, progress, attempts, practice, ratings] = await Promise.all([
        fetchTable("trainees", "id,name,store_location,role,created_at"),
        fetchTable("module_progress", "trainee_id,academy,module_num,completed_at"),
        fetchTable("quiz_attempts", "trainee_id,academy,module_num,score,passed,created_at"),
        fetchTable("practice_responses", "trainee_id,academy,module_num,score,input_mode,created_at"),
        fetchTable("module_ratings", "trainee_id,academy,module_num,q_useful,q_confident,q_practice,comment,created_at"),
      ]);
    } catch (e) {
      wrap.innerHTML = "";
      wrap.appendChild(el("div", "tracker-empty", "Couldn't load progress right now — check your connection and reload."));
      return;
    }

    // Build per-trainee stats
    const progressByTrainee = {};
    progress.forEach((p) => {
      (progressByTrainee[p.trainee_id] = progressByTrainee[p.trainee_id] || []).push(p);
    });
    // Practice: how many prompts they've actually spoken/written an answer to,
    // and how those were graded. Counts every attempt — retries are the point.
    const practiceByTrainee = {};
    (practice || []).forEach((p) => {
      (practiceByTrainee[p.trainee_id] = practiceByTrainee[p.trainee_id] || []).push(p);
    });

    const lastActiveByTrainee = {};
    progress.concat(attempts, practice || []).forEach((row) => {
      const ts = row.completed_at || row.created_at;
      if (!ts) return;
      if (!lastActiveByTrainee[row.trainee_id] || ts > lastActiveByTrainee[row.trainee_id]) {
        lastActiveByTrainee[row.trainee_id] = ts;
      }
    });

    const rows = trainees.map((t) => {
      const done = progressByTrainee[t.id] || [];
      const total = totalModulesFor(t.role);
      const completedCount = done.length;
      const byAcademy = {};
      done.forEach((d) => { byAcademy[d.academy] = (byAcademy[d.academy] || 0) + 1; });
      const myPractice = practiceByTrainee[t.id] || [];
      const graded = myPractice.filter((p) => typeof p.score === "number");
      const avgPractice = graded.length
        ? Math.round((graded.reduce((s, p) => s + p.score, 0) / graded.length) * 10) / 10
        : null;
      return {
        ...t,
        completedCount,
        total,
        pct: total ? Math.round((completedCount / total) * 100) : 0,
        byAcademy,
        practiceCount: myPractice.length,
        practiceVoiceCount: myPractice.filter((p) => p.input_mode === "voice").length,
        avgPractice,
        lastActive: lastActiveByTrainee[t.id] || t.created_at,
      };
    });

    renderStats(rows);
    renderRatings(ratings || []);
    populateFilters(rows);
    renderTable(rows);

    document.getElementById("filter-search").addEventListener("input", () => renderTable(rows));
    document.getElementById("filter-store").addEventListener("change", () => renderTable(rows));
    document.getElementById("filter-academy").addEventListener("change", () => renderTable(rows));
  }

  // How trainees rate the training itself. The headline is deliberately
  // "% who rated 4 or 5" rather than an average: it's the more honest read of
  // the distribution, and it's the number that actually means something in a
  // conversation ("9 in 10 said they learned something they could use").
  const RATING_LABELS = [
    ["q_useful",    "Learned something usable"],
    ["q_confident", "Feel more confident"],
    ["q_practice",  "Practice beat reading"],
  ];

  function renderRatings(ratings) {
    const host = document.getElementById("tracker-ratings");
    if (!host) return;
    host.innerHTML = "";
    if (!ratings.length) {
      host.appendChild(el("div", "tracker-empty",
        "No training ratings yet — these appear once someone finishes an academy's quiz."));
      return;
    }

    host.appendChild(el("h2", "ratings-heading", "How trainees rate the training"));

    const grid = el("div", "tracker-stats");
    RATING_LABELS.forEach(([key, label]) => {
      const vals = ratings.map((r) => r[key]).filter((v) => typeof v === "number");
      const top = vals.filter((v) => v >= 4).length;
      const pct = vals.length ? Math.round((top / vals.length) * 100) : 0;
      const avg = vals.length
        ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : "—";
      const box = el("div", "tracker-stat");
      box.appendChild(el("div", "num", vals.length ? pct + "%" : "—"));
      box.appendChild(el("div", "label", label));
      box.appendChild(el("div", "sub", vals.length
        ? `rated 4-5 · avg ${avg} · ${vals.length} response${vals.length === 1 ? "" : "s"}`
        : "no responses"));
      grid.appendChild(box);
    });
    host.appendChild(grid);

    const comments = ratings
      .filter((r) => r.comment && r.comment.trim())
      .sort((a, b) => (b.created_at || "") > (a.created_at || "") ? 1 : -1);
    if (comments.length) {
      host.appendChild(el("h3", "ratings-subheading",
        `What they said (${comments.length})`));
      const list = el("div", "ratings-comments");
      comments.slice(0, 25).forEach((c) => {
        const item = el("div", "ratings-comment");
        item.appendChild(el("div", "ratings-comment-text", `"${escapeHtml(c.comment.trim())}"`));
        const meta = ACADEMY_CONFIG[c.academy] ? ACADEMY_CONFIG[c.academy].label : c.academy;
        item.appendChild(el("div", "ratings-comment-meta",
          `${escapeHtml(meta)}${c.created_at ? " · " + new Date(c.created_at).toLocaleDateString() : ""}`));
        list.appendChild(item);
      });
      host.appendChild(list);
    }
  }

  function renderStats(rows) {
    const el2 = document.getElementById("tracker-stats");
    el2.innerHTML = "";
    const totalTrainees = rows.length;
    const avgPct = totalTrainees ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / totalTrainees) : 0;
    const certified = rows.filter((r) => r.pct >= 100).length;
    const stores = new Set(rows.map((r) => r.store_location)).size;
    const withPractice = rows.filter((r) => r.avgPractice !== null);
    const avgPractice = withPractice.length
      ? (withPractice.reduce((s, r) => s + r.avgPractice, 0) / withPractice.length).toFixed(1)
      : "—";
    const practiceReps = rows.reduce((s, r) => s + r.practiceCount, 0);
    [
      { num: totalTrainees, label: "Signed in" },
      { num: `${avgPct}%`, label: "Avg. completion" },
      { num: certified, label: "Fully certified" },
      { num: stores, label: "Stores represented" },
      { num: avgPractice, label: "Avg. practice score" },
      { num: practiceReps, label: "Practice reps logged" },
    ].forEach((s) => {
      const box = el("div", "tracker-stat");
      box.appendChild(el("div", "num", s.num));
      box.appendChild(el("div", "label", s.label));
      el2.appendChild(box);
    });
  }

  function populateFilters(rows) {
    const storeSel = document.getElementById("filter-store");
    const stores = Array.from(new Set(rows.map((r) => r.store_location))).sort();
    stores.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s; opt.textContent = s;
      storeSel.appendChild(opt);
    });
    const academySel = document.getElementById("filter-academy");
    Object.keys(ACADEMY_CONFIG).forEach((slug) => {
      const opt = document.createElement("option");
      opt.value = slug; opt.textContent = ACADEMY_CONFIG[slug].label;
      academySel.appendChild(opt);
    });
  }

  function renderTable(rows) {
    const wrap = document.getElementById("tracker-table-wrap");
    const search = document.getElementById("filter-search").value.trim().toLowerCase();
    const storeFilter = document.getElementById("filter-store").value;
    const academyFilter = document.getElementById("filter-academy").value;

    let filtered = rows.filter((r) => {
      if (search && r.name.toLowerCase().indexOf(search) === -1) return false;
      if (storeFilter && r.store_location !== storeFilter) return false;
      if (academyFilter && !(r.byAcademy[academyFilter] > 0)) return false;
      return true;
    });
    filtered.sort((a, b) => a.pct - b.pct);

    wrap.innerHTML = "";
    if (!filtered.length) {
      wrap.appendChild(el("div", "tracker-empty", "No one matches these filters yet."));
      return;
    }

    const table = document.createElement("table");
    table.className = "tracker-table";
    table.innerHTML = `<thead><tr>
      <th>Name</th><th>Store</th><th>Role</th><th>Progress</th><th>Practice</th><th>Last active</th>
    </tr></thead>`;
    const tbody = document.createElement("tbody");
    filtered.forEach((r) => {
      const tr = document.createElement("tr");
      const lastActive = r.lastActive ? new Date(r.lastActive).toLocaleDateString() : "—";
      const practiceCell = r.practiceCount
        ? `<strong>${r.avgPractice !== null ? r.avgPractice : "—"}</strong>${r.avgPractice !== null ? "<span style=\"color:#999\">/5</span>" : ""}
           <div style="font-size:0.78rem;color:#777;margin-top:4px;">${r.practiceCount} rep${r.practiceCount === 1 ? "" : "s"}${r.practiceVoiceCount ? ` · ${r.practiceVoiceCount} spoken` : ""}</div>`
        : `<span style="color:#999">—</span>`;
      tr.innerHTML = `
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.store_location || "—")}</td>
        <td>${escapeHtml(roleLabel(r.role))}</td>
        <td>
          <div class="tracker-bar-wrap"><div class="tracker-bar" style="width:${r.pct}%"></div></div>
          <div style="font-size:0.78rem;color:#777;margin-top:4px;">${r.completedCount}/${r.total} modules (${r.pct}%)</div>
        </td>
        <td>${practiceCell}</td>
        <td>${lastActive}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  window.KnoopsTracker = { init };
})();
