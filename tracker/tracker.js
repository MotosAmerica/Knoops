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

  function roleLabel(role) {
    const found = (window.KnoopsSignIn && window.KnoopsSignIn.ROLES || []).find((r) => r.value === role);
    return found ? found.label : (role || "Knoopologist");
  }

  async function init() {
    const c = cfg();
    const wrap = document.getElementById("tracker-table-wrap");
    if (!c.SUPABASE_URL) {
      wrap.innerHTML = "";
      wrap.appendChild(el("div", "tracker-empty", "Supabase isn't connected yet — once it is (see README), this page will show live sign-ins and progress."));
      return;
    }

    let trainees, progress, attempts;
    try {
      [trainees, progress, attempts] = await Promise.all([
        fetchTable("trainees", "id,name,store_location,role,created_at"),
        fetchTable("module_progress", "trainee_id,academy,module_num,completed_at"),
        fetchTable("quiz_attempts", "trainee_id,academy,module_num,score,passed,created_at"),
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
    const lastActiveByTrainee = {};
    progress.concat(attempts).forEach((row) => {
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
      return {
        ...t,
        completedCount,
        total,
        pct: total ? Math.round((completedCount / total) * 100) : 0,
        byAcademy,
        lastActive: lastActiveByTrainee[t.id] || t.created_at,
      };
    });

    renderStats(rows);
    populateFilters(rows);
    renderTable(rows);

    document.getElementById("filter-search").addEventListener("input", () => renderTable(rows));
    document.getElementById("filter-store").addEventListener("change", () => renderTable(rows));
    document.getElementById("filter-academy").addEventListener("change", () => renderTable(rows));
  }

  function renderStats(rows) {
    const el2 = document.getElementById("tracker-stats");
    el2.innerHTML = "";
    const totalTrainees = rows.length;
    const avgPct = totalTrainees ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / totalTrainees) : 0;
    const certified = rows.filter((r) => r.pct >= 100).length;
    const stores = new Set(rows.map((r) => r.store_location)).size;
    [
      { num: totalTrainees, label: "Signed in" },
      { num: `${avgPct}%`, label: "Avg. completion" },
      { num: certified, label: "Fully certified" },
      { num: stores, label: "Stores represented" },
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
      <th>Name</th><th>Store</th><th>Role</th><th>Progress</th><th>Last active</th>
    </tr></thead>`;
    const tbody = document.createElement("tbody");
    filtered.forEach((r) => {
      const tr = document.createElement("tr");
      const lastActive = r.lastActive ? new Date(r.lastActive).toLocaleDateString() : "—";
      tr.innerHTML = `
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.store_location || "—")}</td>
        <td>${escapeHtml(roleLabel(r.role))}</td>
        <td>
          <div class="tracker-bar-wrap"><div class="tracker-bar" style="width:${r.pct}%"></div></div>
          <div style="font-size:0.78rem;color:#777;margin-top:4px;">${r.completedCount}/${r.total} modules (${r.pct}%)</div>
        </td>
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
