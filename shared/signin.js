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

  async function insertTrainee(name, store, role) {
    const c = cfg();
    if (!c.SUPABASE_URL) {
      // No backend yet — still let people through with a local-only id so
      // the rest of the platform (progress, quizzes) keeps working offline.
      return { id: `local-${Date.now()}`, name, store_location: store, role, _local: true };
    }
    const resp = await fetch(`${c.SUPABASE_URL}/rest/v1/trainees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": c.SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${c.SUPABASE_ANON_KEY}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify([{ name, store_location: store, role }]),
    });
    if (!resp.ok) throw new Error(`sign-in failed (${resp.status})`);
    const rows = await resp.json();
    return rows[0];
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

  function init() {
    renderTopbarUser();
    if (getTrainee()) return;
    buildOverlay(renderTopbarUser);
  }

  window.KnoopsSignIn = { init, getTrainee, isManager, clearTrainee, ROLES, MANAGER_ROLES };

  // Auto-run: this script tag sits right before the page's other scripts, at
  // the bottom of <body>, so the DOM (including #topbar-user) already exists.
  init();
})();
