const CONFIG = {
  API: {
    INFERMEDICA: { BASE_URL: "https://api.infermedica.com/v3", APP_ID: "", APP_KEY: "" },
    NPPES: "https://clinicaltables.nlm.nih.gov/api/npi_idv/v3/search"
  },
  STORAGE: { USER: "hc_user", APPOINTMENTS: "hc_appointments", THEME: "hc_theme" }
};

const state = { symptoms: [], isLoggedIn: false, user: null, currentBooking: null };

const utils = {
  showToast(msg, type = 'info', dur = 5000) {
    const c = document.getElementById('toast-container'), t = document.createElement('div');
    t.className = `toast ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    t.innerHTML = `<i class="fas ${icons[type]}"></i><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => { t.style.animation = 'fadeOut 0.3s ease forwards'; setTimeout(() => t.remove(), 300); }, dur);
  },

  initTheme() {
    const s = localStorage.getItem(CONFIG.STORAGE.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', s);
    this.updateThemeIcon(s);
  },

  toggleTheme() {
    const c = document.documentElement.getAttribute('data-theme'), n = c === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', n);
    localStorage.setItem(CONFIG.STORAGE.THEME, n);
    this.updateThemeIcon(n);
    this.showToast(`Switched to ${n} mode`, 'success', 2000);
  },

  updateThemeIcon(t) { const i = document.querySelector('#theme-toggle i'); if(i) i.className = t === 'light' ? 'fas fa-moon' : 'fas fa-sun'; },
  calculateBMI(w, h) { const hm = h/100; return (w/(hm*hm)).toFixed(1); },
  getBMICategory(bmi) {
    if(bmi < 18.5) return { cat: 'underweight', color: 'var(--bmi-underweight)', advice: 'Please consider consulting a nutritionist. You can book an appointment below' };
    if(bmi < 25) return { cat: 'normal', color: 'var(--bmi-normal)', advice: 'Great job! Maintain your healthy lifestyle.' };
    if(bmi < 30) return { cat: 'overweight', color: 'var(--bmi-overweight)', advice: 'Small lifestyle changes can help. For more info consider booking an appointment with a healthcare professional.' };
    return { cat: 'obese', color: 'var(--bmi-obese)', advice: 'Please consult a healthcare professional.' };
  },
  getToday() { return new Date().toISOString().split('T')[0]; },
  formatDT(d, t) { return new Date(`${d}T${t}`).toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }); }
};

document.addEventListener("DOMContentLoaded", () => {
  utils.initTheme(); 
  initAuth(); 
  initThemeToggle(); 
  initEmergency(); 
  initSymptomChecker();
  initHealthTools(); 
  initFilters(); 
  initProviderSearch(); 
  displayAppointments(); 
  initBookingModal(); 
  registerSW();
  initOffline();
  document.querySelectorAll('.nav-links a').forEach(l => l.addEventListener('click', e => {
    e.preventDefault(); const t = document.querySelector(l.getAttribute('href')); if(t) t.scrollIntoView({ behavior: 'smooth' });
  }));
});

// Adding a firebase login authentication feature.
async function initAuth() {
  const form = document.getElementById("auth-form");
  const btn = document.getElementById("login-btn");

  // Initialize Firebase Auth
  const auth = firebase.auth();

  // Check if user logged in
  auth.onAuthStateChanged(user => {
    if (user) {
      state.isLoggedIn = true;
      state.user = user.email.split('@')[0];
      btn.textContent = `👋 ${state.user}`;
      document.getElementById("auth-section").classList.add("hidden");
    } else {
      state.isLoggedIn = false;
      document.getElementById("auth-section").classList.remove("hidden");
    }
  });

  form?.addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // Register or Login
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => utils.showToast("Account created!", "success"))
      .catch(err => {
        if (err.code === 'auth/email-already-in-use') {
          auth.signInWithEmailAndPassword(email, password)
            .then(() => utils.showToast("Welcome back!", "success"));
        } else {
          utils.showToast(`Error: ${err.message}`, "error");
        }
      });
  });
}

function initThemeToggle() { document.getElementById('theme-toggle')?.addEventListener('click', () => utils.toggleTheme()); }

// :::::::::::::::::: EMERGENCY:::::::::::::::::::
async function initEmergency() {
  const el = document.querySelector(".emergency");
  if (!el) return;

  // Emergency numbers by country code
  const EMERGENCY_NUMBERS = {
    MY: "999 / 994",
    US: "911",
    UK: "999 / 112",
    AU: "000",
    CA: "911",
    DEFAULT: "112"
  };

  try {
    // Fetch location from IP API
    const response = await fetch("https://ipapi.co/json/");
    
    if (!response.ok) throw new Error("Network response failed");
    
    const data = await response.json();

    // Extract essential information
    const countryCode = data.country_code?.toUpperCase() || "DEFAULT";
    const city = data.city || "Unknown";
    const countryName = data.country_name || "Unknown";
    const lat = data.latitude || 0;
    const lng = data.longitude || 0;
    
    // Get appropriate emergency number
    const num = EMERGENCY_NUMBERS[countryCode] || EMERGENCY_NUMBERS.DEFAULT;

    // Create clean HTML output
    el.innerHTML = `
      <div class="card">
        <h3>🚨 Emergency Contact</h3>
        <p style="margin-top:0.5rem"><strong>${num}</strong></p>
        <small style="color: var(--text-secondary)">
          ${city === "Unknown" ? countryName : `${city}, ${countryName}`}
        </small>
        <br><br>
        
        <!-- Emergency Call -->
        <a href="tel:${num}" style="display:inline-flex; align-items:center; gap:0.5rem; background:#dc2626; color:white; padding:0.75rem 1.5rem; border-radius:8px; text-decoration:none;">
          <i class="fas fa-phone"></i> Call ${num}
        </a>
        
        <!-- View on Maps -->
        <a href="https://www.google.com/maps?q=${lat},${lng}" 
           target="_blank" rel="noopener noreferrer"
           style="display:inline-flex; align-items:center; gap:0.5rem; background:var(--accent); color:white; padding:0.75rem 1.5rem; border-radius:8px; text-decoration:none; margin-left:0.5rem;">
          <i class="fas fa-map"></i> Location
        </a>
      </div>
    `;

  } catch (error) {
    console.error("Emergency info error:", error);
    
    // Fallback message
    el.innerHTML = `
      <div class="card" style="border-left: 4px solid var(--warning)">
        <h3>⚠️ Location Unavailable</h3>
        <p>In emergency? Call <strong>112</strong> (Universal)</p>
        <a href="tel:112" style="display:inline-block; background:var(--accent); color:white; padding:0.75rem 1.5rem; border-radius:8px; text-decoration:none; margin-top:0.5rem;">
          <i class="fas fa-phone"></i> Call 112
        </a>
      </div>
    `;
  }
}

// :::::::::::::Symptoms Checker:::::::::::::::::::::::::::::::

function initSymptomChecker() {
  const input = document.getElementById("symptom-input"), addBtn = document.getElementById("add-symptom"), searchBtn = document.getElementById("search-symptoms"), list = document.getElementById("symptom-list"), results = document.getElementById("results-area"), suggestions = document.getElementById("suggestions");
  const all = ["fever","cough","headache","nausea","sneezing","fatigue","rash","dizziness","shortness of breath","chest pain"];
  let to;
  input?.addEventListener("input", () => {
    clearTimeout(to); to = setTimeout(() => {
      const v = input.value.toLowerCase().trim(); suggestions.innerHTML = "";
      if(v.length < 2) { suggestions.classList.remove('show'); return; }
      const m = all.filter(s => s.includes(v) && !state.symptoms.includes(s));
      if(m.length > 0) { suggestions.classList.add('show'); m.forEach(s => { const d = document.createElement("div"); d.textContent = s; d.onclick = () => { input.value = s; suggestions.classList.remove('show'); input.focus(); }; suggestions.appendChild(d); }); }
      else suggestions.classList.remove('show');
    }, 150);
  });
  document.addEventListener('click', e => { if(!e.target.closest('.input-group')) suggestions?.classList.remove('show'); });
  addBtn?.addEventListener("click", () => {
    const v = input.value.toLowerCase().trim(); if(!v) { utils.showToast("Enter a symptom", "warning"); return; }
    if(state.symptoms.includes(v)) { utils.showToast("Already added", "info"); return; }
    state.symptoms.push(v); renderTags(); input.value = ""; suggestions.classList.remove('show'); utils.showToast(`✓ ${v} added`, "success", 2000);
  });
  input?.addEventListener("keypress", e => { if(e.key === "Enter") { e.preventDefault(); addBtn.click(); } });
  searchBtn?.addEventListener("click", async () => {
    if(state.symptoms.length === 0) { utils.showToast("Add symptoms to check", "warning"); return; }
    results.innerHTML = '<p style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Analyzing...</p>';
    await new Promise(r => setTimeout(r, 600));
    const diseases = [{ name:"Flu", symptoms:["fever","cough","headache","fatigue"], advice:"Rest, hydrate, OTC pain relief.", severity:"moderate" }, { name:"Common Cold", symptoms:["cough","sneezing","runny nose"], advice:"Rest, fluids. Resolves in 7-10 days.", severity:"mild" }, { name:"Migraine", symptoms:["headache","nausea","dizziness"], advice:"Rest in dark room. Track triggers.", severity:"moderate" }];
    const matches = diseases.filter(d => state.symptoms.some(s => d.symptoms.includes(s)));
    if(matches.length === 0) { results.innerHTML = `<div class="card" style="border-left:4px solid var(--warning)"><h3>⚠️ No match found</h3><p>Consult a healthcare provider.</p><button onclick="document.getElementById('doctors').scrollIntoView({behavior:'smooth'})" style="margin-top:1rem"><i class="fas fa-user-md"></i> Find a Doctor</button></div>`; return; }
    results.innerHTML = ""; const colors = { mild:'var(--success)', moderate:'var(--warning)', severe:'var(--error)' };
    matches.forEach(d => {
      const div = document.createElement("div"); div.className = "card"; div.style.borderLeft = `4px solid ${colors[d.severity]||'var(--accent)'}`;
      div.innerHTML = `<h3>${d.name} <small style="color:${colors[d.severity]}">● ${d.severity}</small></h3><p><strong>Symptoms:</strong> ${d.symptoms.join(", ")}</p><p><strong>💡 Advice:</strong> ${d.advice}</p><button onclick="document.getElementById('doctors').scrollIntoView({behavior:'smooth'})" style="margin-top:0.5rem"><i class="fas fa-calendar-plus"></i> Book Consultation</button>`;
      results.appendChild(div);
    });
    utils.showToast(`Found ${matches.length} condition(s)`, "info");
  });
  function renderTags() { list.innerHTML = ""; state.symptoms.forEach(s => { const li = document.createElement("li"); li.innerHTML = `${s}<button type="button" onclick="removeSymptom('${s}')"><i class="fas fa-times"></i></button>`; list.appendChild(li); }); }
  window.removeSymptom = function(s) { state.symptoms = state.symptoms.filter(x => x !== s); renderTags(); utils.showToast(`Removed "${s}"`, "info", 2000); };
}

function initHealthTools() {
  const btn = document.getElementById("calc-bmi"), res = document.getElementById("bmi-result"), mark = document.getElementById("bmi-marker");
  btn?.addEventListener("click", () => {
    const w = parseFloat(document.getElementById("weight").value), h = parseFloat(document.getElementById("height").value);
    if(!w || !h || w < 1 || h < 50) { utils.showToast("Enter valid values", "error"); return; }
    const bmi = utils.calculateBMI(w, h), { cat, color, advice } = utils.getBMICategory(parseFloat(bmi));
    document.getElementById("bmi-number").textContent = bmi; document.getElementById("bmi-category").textContent = cat.replace('_',' ');
    document.getElementById("bmi-category").style.color = color; document.getElementById("bmi-advice").textContent = advice;
    const pos = Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100)); mark.style.left = `${pos}%`; mark.style.background = color;
    res.classList.remove("hidden"); res.scrollIntoView({ behavior: "smooth", block: "center" }); utils.showToast(`BMI: ${bmi} (${cat})`, "success", 3000);
  });
}

// :::::::::::::::::Doctor's and Therapists Display:::::::::::::::::::: 
const doctorsData = [{ id:1, name:"Dr. Sarah Lee", type:"general", gender:"female", specialty:"Family Medicine", hospital:"Penang General Hospital", mode:"physical", time:"9am-1pm", rating:4.8 }, { id:2, name:"Dr. John Smith", type:"general", gender:"male", specialty:"Internal Medicine", hospital:"Island Hospital", mode:"physical", time:"2pm-6pm", rating:4.6 }, { id:3, name:"Dr. Aisha Khan", type:"mental", gender:"female", specialty:"Clinical Psychologist", hospital:"MindCare Online", mode:"virtual", time:"10am-4pm", rating:4.9 }];

function displayDoctors(f = {}) {
  const c = document.getElementById("results"), load = document.getElementById("loading-doctors"); if(!c) return;
  load?.classList.remove("hidden"); c.innerHTML = "";
  setTimeout(() => {
    load?.classList.add("hidden");
    const filtered = doctorsData.filter(d => (!f.type || d.type === f.type) && (!f.gender || d.gender === f.gender) && (!f.mode || d.mode === f.mode));
    if(filtered.length === 0) { c.innerHTML = `<p class="empty-state">No providers match your filters.</p>`; return; }
    filtered.forEach(doc => {
      const card = document.createElement("div"); card.className = "card";
      card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:start"><div><h3>${doc.name}</h3><p style="color:var(--accent);font-weight:500">${doc.specialty}</p></div><span style="background:var(--success);color:white;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.85rem">⭐ ${doc.rating}</span></div><p><i class="fas fa-hospital"></i> ${doc.hospital}</p><p><i class="fas fa-clock"></i> ${doc.time}</p><p><i class="fas fa-${doc.mode==='virtual'?'video':'user-injured'}"></i> ${doc.mode==='virtual'?'Virtual':'In-Person'}</p><button onclick="openBookingModal(${doc.id})" class="primary" style="width:100%;justify-content:center"><i class="fas fa-calendar-plus"></i> Book</button>`;
      c.appendChild(card);
    });
  }, 400);
}

function initFilters() {
  const t = document.getElementById("filter-type"), g = document.getElementById("filter-gender"), m = document.getElementById("filter-mode");
  function apply() { displayDoctors({ type: t?.value||"", gender: g?.value||"", mode: m?.value||"" }); }
  [t,g,m].forEach(e => e?.addEventListener("change", apply));
}

function initProviderSearch() {
  const inp = document.createElement("input"); inp.id = "provider-search"; inp.placeholder = "Search by specialty, name, or condition..."; inp.style.marginBottom = "1rem";
  const sec = document.getElementById("doctors"); if(sec) sec.insertBefore(inp, sec.querySelector(".filters"));
  let to; inp.addEventListener("input", e => { clearTimeout(to); to = setTimeout(() => fetchRealProviders(e.target.value, getFilters()), 500); });
}

function getFilters() { return { type: document.getElementById("filter-type")?.value||"", gender: document.getElementById("filter-gender")?.value||"", mode: document.getElementById("filter-mode")?.value||"" }; }

async function fetchRealProviders(term = '', f = {}) {
  const load = document.getElementById("loading-doctors"), c = document.getElementById("results"); load?.classList.remove("hidden");
  try {
    const params = new URLSearchParams({ maxList: "20", df: "NPI,name.full,provider_type,addr_practice.full,phone" });
    if(term) params.append("terms", term); if(f.state) params.append("state", f.state); if(f.city) params.append("city", f.city);
    const res = await fetch(`${CONFIG.API.NPPES}?${params}`), [total, codes, extra, data] = await res.json();
    const providers = data.map((item, i) => ({ npi: codes[i], name: item[1]||"Unknown", specialty: item[2]||"General", address: item[3]||"", phone: item[4]||"", type: classifyType(item[2]), gender: "unknown", mode: "physical", rating: (4+Math.random()).toFixed(1) }));
    load?.classList.add("hidden"); renderProviders(providers); utils.showToast(`Found ${providers.length} providers`, "success");
  } catch(e) { console.error("API Error:", e); load?.classList.add("hidden"); utils.showToast("Using demo data", "warning"); displayDoctors(f); }
}

function classifyType(s) { if(!s) return "general"; const l = s.toLowerCase(); if(l.includes("psych")||l.includes("mental")) return "mental"; if(l.includes("cardio")) return "specialist"; return "general"; }

function renderProviders(providers) {
  const c = document.getElementById("results"); if(!c) return; c.innerHTML = "";
  if(providers.length === 0) { c.innerHTML = `<p class="empty-state">No providers found.</p>`; return; }
  providers.forEach(p => {
    const card = document.createElement("div"); card.className = "card";
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:start"><div><h3>${p.name}</h3><p style="color:var(--accent);font-weight:500">${p.specialty}</p><p style="font-size:0.9rem;color:var(--text-secondary)">NPI: ${p.npi}</p></div><span style="background:var(--success);color:white;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.85rem">⭐ ${p.rating}</span></div>${p.address?`<p><i class="fas fa-map-marker-alt"></i> ${p.address}</p>`:''}${p.phone?`<p><i class="fas fa-phone"></i> ${p.phone}</p>`:''}<p><i class="fas fa-user-injured"></i> In-Person</p><div style="display:flex;gap:0.5rem;margin-top:1rem"><button onclick="openBookingModalFromProvider('${p.name}','${p.specialty}')" class="primary" style="flex:1"><i class="fas fa-calendar-plus"></i> Book</button><button onclick="window.open('tel:${p.phone}')" style="flex:1"><i class="fas fa-phone"></i> Call</button></div>`;
    c.appendChild(card);
  });
}

// :::::::::::::::::::Appointments::::::::::::::::::::
function displayAppointments() {
  const c = document.getElementById("appointments-list"), empty = document.getElementById("no-appointments"); if(!c) return;
  const apps = JSON.parse(localStorage.getItem(CONFIG.STORAGE.APPOINTMENTS)) || []; c.innerHTML = "";
  if(apps.length === 0) { empty?.classList.remove("hidden"); return; } empty?.classList.add("hidden");
  apps.sort((a,b) => new Date(a.datetime) - new Date(b.datetime));
  apps.forEach((a, idx) => {
    const card = document.createElement("div"); card.className = "card"; card.style.borderLeft = `4px solid ${a.status==='confirmed'?'var(--success)':'var(--warning)'}`;
    card.innerHTML = `<div style="display:flex;justify-content:space-between"><h3>${a.providerName}</h3><small style="background:${a.status==='confirmed'?'var(--success)':'var(--warning)'};color:white;padding:0.2rem 0.5rem;border-radius:12px">${a.status}</small></div><p><i class="fas fa-calendar-day"></i> ${utils.formatDT(a.date, a.time)}</p><p><i class="fas fa-${a.mode==='virtual'?'video':'map-marker-alt'}"></i> ${a.mode==='virtual'?'Virtual':a.hospital||'Clinic'}</p>${a.notes?`<p><i class="fas fa-sticky-note"></i> <em>${a.notes}</em></p>`:''}<div style="display:flex;gap:0.5rem;margin-top:1rem"><button onclick="addToCalendar('${a.providerName}','${a.date}','${a.time}')" style="flex:1"><i class="fab fa-google"></i> Calendar</button><button onclick="cancelAppointment(${idx})" style="flex:1;background:var(--error)"><i class="fas fa-times"></i> Cancel</button></div>`;
    c.appendChild(card);
  });
}

// :::::::::::::::::::Booking::::::::::::::::::::::::
function initBookingModal() {
  const modal = document.getElementById("booking-modal"), form = document.getElementById("booking-form"), cancel = document.getElementById("cancel-booking"), dateInp = document.getElementById("booking-date");
  if(dateInp) dateInp.min = utils.getToday();
  window.openBookingModal = function(id) {
    const p = doctorsData.find(d => d.id === id); if(!p) return;
    state.currentBooking = p; document.getElementById("modal-provider-name").textContent = p.name;
    document.getElementById("modal-provider-mode").textContent = p.mode === 'virtual' ? '🌐 Virtual' : '🏥 In-Person';
    if(modal?.showModal) modal.showModal(); else { modal?.classList.remove("hidden"); modal?.setAttribute("open","open"); }
  };
  window.openBookingModalFromProvider = function(name, spec) {
    state.currentBooking = { id: Date.now(), name, specialty: spec, mode: "physical", hospital: "Clinic" };
    document.getElementById("modal-provider-name").textContent = name; document.getElementById("modal-provider-mode").textContent = '🏥 In-Person';
    if(modal?.showModal) modal.showModal(); else { modal?.classList.remove("hidden"); }
  };
  cancel?.addEventListener("click", () => { if(modal?.close) modal.close(); else modal?.classList.add("hidden"); state.currentBooking = null; });
  modal?.addEventListener("click", e => { if(e.target === modal) { if(modal.close) modal.close(); else modal.classList.add("hidden"); state.currentBooking = null; } });
  form?.addEventListener("submit", async e => {
    e.preventDefault(); if(!state.currentBooking || !state.user) { utils.showToast("Please login to book", "error"); return; }
    const date = document.getElementById("booking-date").value, time = document.getElementById("booking-time").value, notes = document.getElementById("booking-notes").value.trim();
    const appt = { id: Date.now(), userId: state.user, providerId: state.currentBooking.id, providerName: state.currentBooking.name, hospital: state.currentBooking.hospital, specialty: state.currentBooking.specialty, mode: state.currentBooking.mode, date, time, datetime: `${date}T${time}`, notes, status: "confirmed", createdAt: new Date().toISOString() };
    try {
      if(typeof FirestoreService !== 'undefined') {
        await FirestoreService.createAppointment(appt);
        appt.synced = true;
      }
      const apps = JSON.parse(localStorage.getItem(CONFIG.STORAGE.APPOINTMENTS)) || []; apps.push(appt);
      localStorage.setItem(CONFIG.STORAGE.APPOINTMENTS, JSON.stringify(apps)); addToGoogleCalendar(appt); displayAppointments();
      if(modal?.close) modal.close(); else modal?.classList.add("hidden"); form.reset(); state.currentBooking = null;
      utils.showToast("✅ Appointment booked!", "success");
    } catch(err) { console.error("Booking error:", err); utils.showToast("Failed to book. Try again.", "error"); }
  });
}

window.cancelAppointment = function(idx) {
  if(confirm("Cancel this appointment?")) {
    const apps = JSON.parse(localStorage.getItem(CONFIG.STORAGE.APPOINTMENTS)) || []; apps.splice(idx, 1);
    localStorage.setItem(CONFIG.STORAGE.APPOINTMENTS, JSON.stringify(apps)); displayAppointments(); utils.showToast("Cancelled", "warning");
  }
};

function addToGoogleCalendar(a) {
  const start = a.datetime.replace(/[-:]/g,'').slice(0,15)+"00Z", end = new Date(new Date(a.datetime).getTime()+3600000).toISOString().replace(/[-:]/g,'').slice(0,15)+"00Z";
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Appointment+with+${encodeURIComponent(a.providerName)}&dates=${start}/${end}&details=${encodeURIComponent(a.notes||'Health consultation')}&location=${encodeURIComponent(a.hospital||'Virtual')}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function registerSW() {
  if('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('SW registered:', reg.scope);
      if('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    } catch(e) { console.error('SW failed:', e); }
  }
}

// Adding an offline notification message to notify the user incase they have no internet or are offline
function initOffline() {
  const offlineBanner = document.getElementById("offline-warning");
  
  window.addEventListener('offline', () => {
    if(offlineBanner) offlineBanner.classList.remove("hidden");
  });

  window.addEventListener('online', () => {
    if(offlineBanner) offlineBanner.classList.add("hidden");
    // Re-fetch location data after connection restored
    if(typeof initEmergency === 'function') {
      initEmergency();
    }
  });
}