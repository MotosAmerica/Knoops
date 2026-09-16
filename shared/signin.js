// Knoops Academy — sign-in gate + topbar user + manager tracker link
// No password. A trainee enters their name, store, and role once; that
// record is written to the shared `trainees` table in Supabase and cached
// in localStorage so they're not asked again on this device. Role only
// controls whether the "Team Progress" link (the manager tracker) shows up
// — it never gates any academy content, same pattern as the Motos build.
(function () {
  const TRAINEE_KEY = "knoops_trainee";
  const MANAGER_ROLES = ["store_trainer", "store_manager", "district_manager"];
  const ROLES = [
    { value: "knoopologist", label: "Knoopologist" },
    { value: "shift_lead", label: "Shift Lead" },
    { value: "store_trainer", label: "Store Trainer" },
    { value: "store_manager", label: "Store Manager" },
    { value: "district_manager", label: "District / Regional Manager" },
  ];

  function cfg() { return window.KNOOPS_CONFIG || {}; }

  function getTrainee() {
    try { return JSON.parse(localStorage.getItem(TRAINEE_KEY) || "null"); }
    catch (e) { return null; }
  }
  function setTrainee(t) {
    try { localStorage.setItem(TRAINEE_KEY, JSON.stringify(t)); } catch (e) {}
  }
  function clearTrainee() {
    try { localStorage.removeItem(TRAINEE_KEY); } catch (e) {}
  }
  function isManager(t) {
    t = t || getTrainee();
    return !!t && MANAGER_ROLES.indexOf(t.role) !== -1;
  }

  // Depth-aware relative paths: root index.html vs academyN/index.html|module.html
  function inAcademyFolder() {
    return /\/academy\d\//.test(location.pathname) || /academy\d\/(index|module)\.html$/.test(location.pathname);
  }
  function rel(path) { return inAcademyFolder() ? `../${path}` : path; }

  // Find-or-create, not blind insert.
  //
  // This used to POST straight to /trainees, which meant every sign-in — a new
  // device, a new browser, or just signing out and back in — created a brand
  // new trainee with an empty history, and one person showed up in the manager
  // tracker several times over.
  //
  // The matching now happens in one place, in the database
  // (find_or_create_trainee), so it's atomic and identical for every client.
  // Identity is name + store, and the name match is deliberately forgiving:
  // case, extra spaces, middle names, initials, shortened given names
  // (Doug/Douglas) and nicknames (Bob/Robert) all resolve to one person.
  async function insertTrainee(name, store, role) {
    const c = cfg();
    if (!c.SUPABASE_URL) {
      // No backend yet — still let people through with a local-only id so
      // the rest of the platform (progress, quizzes) keeps working offline.
      return { id: `local-${Date.now()}`, name, store_location: store, role, _local: true };
    }
    const resp = await fetch(`${c.SUPABASE_URL}/rest/v1/rpc/find_or_create_trainee`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": c.SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${c.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ p_name: name, p_store: store, p_role: role }),
    });
    if (!resp.ok) throw new Error(`sign-in failed (${resp.status})`);
    const row = await resp.json();
    // The RPC returns the trainees row itself (an object, not an array).
    return Array.isArray(row) ? row[0] : row;
  }

  function buildOverlay(onDone) {
    const overlay = document.createElement("div");
    overlay.className = "signin-overlay";
    overlay.innerHTML = `
      <div class="signin-card">
        <div class="button-icon" style="margin:0 auto 12px;">K</div>
        <h2>Welcome to Knoops Academy</h2>
        <p>No password needed — just tell us who you are so your progress is saved.</p>
        <label>Your name<input type="text" id="signin-name" autocomplete="name" placeholder="Full name"></label>
        <label>Your store<select id="signin-store"></select></label>
        <label>Your role<select id="signin-role"></select></label>
        <div id="signin-error" class="signin-error" style="display:none;"></div>
        <button class="btn" id="signin-submit">Start training</button>
      </div>`;
    document.body.appendChild(overlay);

    const storeSel = overlay.querySelector("#signin-store");
    (window.KNOOPS_STORES || ["Other / not listed"]).forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s; opt.textContent = s;
      storeSel.appendChild(opt);
    });
    const roleSel = overlay.querySelector("#signin-role");
    ROLES.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.value; opt.textContent = r.label;
      roleSel.appendChild(opt);
    });

    const nameInput = overlay.querySelector("#signin-name");
    const errBox = overlay.querySelector("#signin-error");
    const submitBtn = overlay.querySelector("#signin-submit");

    async function submit() {
      const name = nameInput.value.trim();
      if (!name) {
        errBox.style.display = "block";
        errBox.textContent = "Please enter your name.";
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "Signing in...";
      try {
        const trainee = await insertTrainee(name, storeSel.value, roleSel.value);
        setTrainee({ id: trainee.id, name: trainee.name || name, store: trainee.store_location || storeSel.value, role: trainee.role || roleSel.value });
        overlay.remove();
        onDone();
      } catch (e) {
        errBox.style.display = "block";
        errBox.textContent = "Couldn't sign in right now — check your connection and try again.";
        submitBtn.disabled = false;
        submitBtn.textContent = "Start training";
      }
    }
    submitBtn.addEventListener("click", submit);
    nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
  }

  function renderTopbarUser() {
    const slot = document.getElementById("topbar-user");
    if (!slot) return;
    const t = getTrainee();
    if (!t) { slot.innerHTML = ""; return; }
    slot.innerHTML = "";
    const info = document.createElement("span");
    info.className = "topbar-user-info";
    info.textContent = `${t.name} · ${t.store}`;
    slot.appendChild(info);
    if (isManager(t)) {
      const link = document.createElement("a");
      link.href = rel("tracker/index.html");
      link.textContent = "Team Progress";
      slot.appendChild(link);
    }
    const signout = document.createElement("a");
    signout.href = "#";
    signout.textContent = "Sign out";
    signout.onclick = (e) => { e.preventDefault(); clearTrainee(); location.reload(); };
    slot.appendChild(signout);
  }

  // ---------- Visit sessions, device class, active time ----------
  //
  // A row in `trainee_sessions` is one VISIT, not one page load: the id lives
  // in sessionStorage, so walking from a module to the next module continues
  // the same session. "Sessions per person" therefore means visits.
  //
  // active_ms is time SPENT, not time ELAPSED. Wall-clock from load to close
  // would count a tab left open over a lunch break as an hour of training, and
  // every engagement number downstream would be a lie. The clock only advances
  // while the tab is visible AND there has been real input recently; a gap past
  // IDLE_CUTOFF_MS ends the visit, so this morning's session never gets glued
  // to this afternoon's.
  //
  // Nothing identifying is collected: no user-agent string, no IP, no
  // fingerprint. A coarse device class and the window width are enough to
  // answer "is this being done on a phone?", which is the only question asked
  // of it. This never runs on the tracker or analytics pages — they don't load
  // this script — so staff reading the dashboard don't pollute trainee data.
  const SESSION_KEY = "knoops_session";
  const TICK_MS = 5000;           // how often the clock is evaluated
  const BEAT_MS = 30000;          // how much new time before it's written
  const IDLE_CUTOFF_MS = 180000;  // 3 min without input = not training any more

  function deviceClass() {
    const w = window.innerWidth || (window.screen && window.screen.width) || 0;
    // Width alone misreads a narrowed desktop window as a phone. Pointer type
    // is the honest signal; width then separates phone from tablet.
    const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const touch = (navigator.maxTouchPoints || 0) > 1;
    if (coarse || touch) return w <= 640 ? "phone" : "tablet";
    return "desktop";
  }

  function entryPath() {
    const parts = location.pathname.split("/").filter(Boolean);
    return parts.slice(-2).join("/") || "index.html";
  }

  function trackSession() {
    const c = cfg();
    const t = getTrainee();
    // No backend, no trainee, or an offline-only local id — nothing to write to.
    if (!c.SUPABASE_URL || !t || !t.id || String(t.id).indexOf("local-") === 0) return;

    const headers = {
      "Content-Type": "application/json",
      "apikey": c.SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${c.SUPABASE_ANON_KEY}`,
    };

    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch (e) {}
    const now = Date.now();
    if (!saved || !saved.id || (now - (saved.lastBeat || 0)) > IDLE_CUTOFF_MS) saved = null;

    let sessionId = saved ? saved.id : null;
    let activeMs = saved ? (saved.activeMs || 0) : 0;
    let writtenMs = activeMs;
    let lastTick = now;
    let lastInput = now;
    let creating = null;

    function remember() {
      try {
        sessionStorage.setItem(SESSION_KEY,
          JSON.stringify({ id: sessionId, activeMs, lastBeat: Date.now() }));
      } catch (e) {}
    }

    ["pointerdown", "keydown", "scroll", "wheel", "touchstart"].forEach((ev) => {
      window.addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true });
    });

    function ensureRow() {
      if (sessionId) return Promise.resolve(sessionId);
      if (creating) return creating;
      creating = fetch(`${c.SUPABASE_URL}/rest/v1/trainee_sessions`, {
        method: "POST",
        headers: Object.assign({ "Prefer": "return=representation" }, headers),
        body: JSON.stringify({
          trainee_id: t.id,
          device: deviceClass(),
          screen_w: window.innerWidth || null,
          entry_path: entryPath(),
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((rows) => {
          const row = Array.isArray(rows) ? rows[0] : rows;
          sessionId = row && row.id ? row.id : null;
          remember();
          return sessionId;
        })
        .catch(() => null);
      return creating;
    }

    function persist(isFinal) {
      return ensureRow().then((id) => {
        if (!id) return;
        const body = JSON.stringify({
          active_ms: Math.round(activeMs),
          last_beat_at: new Date().toISOString(),
        });
        // keepalive lets the last write survive the page going away; sendBeacon
        // can't be used here because it cannot set the apikey header.
        return fetch(`${c.SUPABASE_URL}/rest/v1/trainee_sessions?id=eq.${id}`, {
          method: "PATCH", headers, body, keepalive: !!isFinal,
        }).then(() => { writtenMs = activeMs; }).catch(() => {});
      });
    }

    setInterval(() => {
      const t2 = Date.now();
      if (document.visibilityState === "visible" && (t2 - lastInput) < IDLE_CUTOFF_MS) {
        activeMs += t2 - lastTick;
      }
      lastTick = t2;
      remember();
      if (activeMs - writtenMs >= BEAT_MS) persist(false);
    }, TICK_MS);

    // visibilitychange is the reliable one on mobile; pagehide covers the rest.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") persist(true);
    });
    window.addEventListener("pagehide", () => persist(true));

    ensureRow();
  }

  function init() {
    renderTopbarUser();
    if (getTrainee()) { trackSession(); return; }
    buildOverlay(() => { renderTopbarUser(); trackSession(); });
  }

  window.KnoopsSignIn = { init, getTrainee, isManager, clearTrainee, ROLES, MANAGER_ROLES };

  // Auto-run: this script tag sits right before the page's other scripts, at
  // the bottom of <body>, so the DOM (including #topbar-user) already exists.
  init();
})();
