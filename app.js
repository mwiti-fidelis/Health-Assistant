window.CONFIG_APIS = window.CONFIG_APIS || {
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
    const s = localStorage.getItem(CONFIG_APIS.STORAGE.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', s);
    this.updateThemeIcon(s);
  },

  toggleTheme() {
    const c = document.documentElement.getAttribute('data-theme'), n = c === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', n);
    localStorage.setItem(CONFIG_APIS.STORAGE.THEME, n);
    this.updateThemeIcon(n);
    this.showToast(`Switched to ${n} mode`, 'success', 2000);
  },

  updateThemeIcon(t) { const i = document.querySelector('#theme-toggle i'); if(i) i.className = t === 'light' ? 'fas fa-moon' : 'fas fa-sun'; },
  calculateBMI(w, h) { const hm = h/100; return (w/(hm*hm)).toFixed(1); },
  getBMICategory(bmi) {
    if(bmi < 18.5) return { cat: 'underweight', color: 'var(--bmi-underweight)', advice: 'Please consider consulting a nutritionist.' };
    if(bmi < 25) return { cat: 'normal', color: 'var(--bmi-normal)', advice: 'Great job! Maintain your healthy lifestyle.' };
    if(bmi < 30) return { cat: 'overweight', color: 'var(--bmi-overweight)', advice: 'Small lifestyle changes can help.' };
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
    e.preventDefault(); const t = document.querySelector(l.getAttribute('href')); 
    if(t) t.scrollIntoView({ behavior: 'smooth' });
  }));
});

// :::::::::::::::::::: Local Mock Authentication :::::::::::::::::::
function initAuth() {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const authSection = document.getElementById("auth-section");
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");

  // Load user session from LocalStorage
  const savedUser = localStorage.getItem(CONFIG_APIS.STORAGE.USER);
  if (savedUser) {
    state.isLoggedIn = true;
    state.user = savedUser;
    if(authSection) authSection.classList.add("hidden");
    displayAppointments();
  }

  loginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const user = usernameInput.value;
    if(user) {
        state.isLoggedIn = true;
        state.user = user;
        localStorage.setItem(CONFIG_APIS.STORAGE.USER, user);
        authSection.classList.add("hidden");
        utils.showToast(`Welcome back, ${user}!`, "success");
        displayAppointments();
    } else {
        alert("Please enter a username");
    }
  });

  registerBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const user = usernameInput.value;
    if(user) {
        state.isLoggedIn = true;
        state.user = user;
        localStorage.setItem(CONFIG_APIS.STORAGE.USER, user);
        authSection.classList.add("hidden");
        utils.showToast("Account created locally!", "success");
        displayAppointments();
    }
  });
}

function initThemeToggle() { document.getElementById('theme-toggle')?.addEventListener('click', () => utils.toggleTheme()); }

// :::::::::::::::::: EMERGENCY :::::::::::::::::::
async function initEmergency() {
  const el = document.querySelector(".emergency");
  if (!el) return;

  const EMERGENCY_NUMBERS = { MY: "999 / 994", US: "911", UK: "999 / 112", AU: "000", CA: "911", DEFAULT: "112" };

  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) throw new Error("Network response failed");
    const data = await response.json();

    const countryCode = data.country_code?.toUpperCase() || "DEFAULT";
    const city = data.city || "Unknown";
    const countryName = data.country_name || "Unknown";
    const lat = data.latitude || 0;
    const lng = data.longitude || 0;
    const num = EMERGENCY_NUMBERS[countryCode] || EMERGENCY_NUMBERS.DEFAULT;

    el.innerHTML = `
      <div class="card">
        <h3>🚨 Emergency Contact</h3>
        <p style="margin-top:0.5rem"><strong>${num}</strong></p>
        <small style="color: var(--text-secondary)">
          ${city === "Unknown" ? countryName : `${city}, ${countryName}`}
        </small>
        <br><br>
        <a href="tel:${num}" style="display:inline-flex; align-items:center; gap:0.5rem; background:#dc2626; color:white; padding:0.75rem 1.5rem; border-radius:8px; text-decoration:none;">
          <i class="fas fa-phone"></i> Call ${num}
        </a>
        <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener noreferrer"
           style="display:inline-flex; align-items:center; gap:0.5rem; background:var(--success); color:white; padding:0.75rem 1.5rem; border-radius:8px; text-decoration:none; margin-left:0.5rem;">
          <i class="fas fa-map"></i> Location
        </a>
      </div>`;
  } catch (error) {
    el.innerHTML = `
      <div class="card" style="border-left: 4px solid var(--warning)">
        <h3>⚠️ Location Unavailable</h3>
        <p>In emergency? Call <strong>112</strong> (Universal)</p>
        <a href="tel:112" style="display:inline-block; background:var(--accent); color:white; padding:0.75rem 1.5rem; border-radius:8px; text-decoration:none; margin-top:0.5rem;">
          <i class="fas fa-phone"></i> Call 112
        </a>
      </div>`;
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
  addBtn?.addEventListener("click", () => {
    const v = input.value.toLowerCase().trim(); if(!v) return;
    if(state.symptoms.includes(v)) return;
    state.symptoms.push(v); renderTags(); input.value = "";
  });
  searchBtn?.addEventListener("click", async () => {
    if(state.symptoms.length === 0) return;
    results.innerHTML = '<p style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Analyzing...</p>';
    await new Promise(r => setTimeout(r, 600));
    const diseases = [{ name:"Flu", symptoms:["fever","cough","headache","fatigue"], advice:"Rest, hydrate, OTC pain relief.", severity:"moderate" }, { name:"Common Cold", symptoms:["cough","sneezing","runny nose"], advice:"Rest, fluids. Resolves in 7-10 days.", severity:"mild" }, { name:"Migraine", symptoms:["headache","nausea","dizziness"], advice:"Rest in dark room. Track triggers.", severity:"moderate" }];
    const matches = diseases.filter(d => state.symptoms.some(s => d.symptoms.includes(s)));
    results.innerHTML = "";
    matches.forEach(d => {
      const div = document.createElement("div"); div.className = "card"; div.innerHTML = `<h3>${d.name}</h3><p><strong>💡 Advice:</strong> ${d.advice}</p>`;
      results.appendChild(div);
    });
  });
  function renderTags() { list.innerHTML = ""; state.symptoms.forEach(s => { const li = document.createElement("li"); li.innerHTML = `${s}<button type="button" onclick="removeSymptom('${s}')"><i class="fas fa-times"></i></button>`; list.appendChild(li); }); }
  window.removeSymptom = function(s) { state.symptoms = state.symptoms.filter(x => x !== s); renderTags(); };
}

function initHealthTools() {
  const btn = document.getElementById("calc-bmi"), res = document.getElementById("bmi-result");
  btn?.addEventListener("click", () => {
    const w = parseFloat(document.getElementById("weight").value), h = parseFloat(document.getElementById("height").value);
    if(!w || !h) return;
    const bmi = utils.calculateBMI(w, h), { cat, color, advice } = utils.getBMICategory(parseFloat(bmi));
    document.getElementById("bmi-number").textContent = bmi;
    document.getElementById("bmi-category").textContent = cat;
    res.classList.remove("hidden");
  });
}

// :::::::::::::::::Provider Display logic:::::::::::::::::::: 
const doctorsData = [{ id:1, name:"Dr. Sarah Lee", type:"general", gender:"female", specialty:"Family Medicine", hospital:"Penang General Hospital", mode:"physical", time:"9am-1pm", rating:4.8 }, { id:2, name:"Dr. John Smith", type:"general", gender:"male", specialty:"Internal Medicine", hospital:"Island Hospital", mode:"physical", time:"2pm-6pm", rating:4.6 }, { id:3, name:"Dr. Aisha Khan", type:"mental", gender:"female", specialty:"Clinical Psychologist", hospital:"MindCare Online", mode:"virtual", time:"10am-4pm", rating:4.9 }];

function displayDoctors(f = {}) {
  const c = document.getElementById("results"); if(!c) return;
  c.innerHTML = "";
  const filtered = doctorsData.filter(d => (!f.type || d.type === f.type) && (!f.gender || d.gender === f.gender) && (!f.mode || d.mode === f.mode));
  filtered.forEach(doc => {
    const card = document.createElement("div"); card.className = "card";
    card.innerHTML = `<h3>${doc.name}</h3><p>${doc.specialty}</p><button onclick="openBookingModal(${doc.id})" class="primary">Book</button>`;
    c.appendChild(card);
  });
}

function initFilters() {
  const t = document.getElementById("filter-type"), g = document.getElementById("filter-gender"), m = document.getElementById("filter-mode");
  const apply = () => displayDoctors({ type: t?.value||"", gender: g?.value||"", mode: m?.value||"" });
  [t,g,m].forEach(e => e?.addEventListener("change", apply));
}

function initProviderSearch() {
  const inp = document.getElementById("provider-search");
  inp?.addEventListener("input", e => fetchRealProviders(e.target.value, {}));
}

async function fetchRealProviders(term = '', f = {}) {
    displayDoctors(f); // Fallback to local data
}

// ::::::::::::::::::: Local Appointments Display ::::::::::::::::::::
function displayAppointments() {
  const c = document.getElementById("appointments-list"), empty = document.getElementById("no-appointments");
  if(!c) return;

  const apps = JSON.parse(localStorage.getItem(CONFIG_APIS.STORAGE.APPOINTMENTS)) || [];
  c.innerHTML = "";

  if(apps.length === 0) {
    empty?.classList.remove("hidden");
    return;
  }
  empty?.classList.add("hidden");

  apps.forEach((a, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${a.providerName}</h3>
      <p><i class="fas fa-calendar-day"></i> ${a.date} at ${a.time}</p>
      <button onclick="cancelAppointment(${idx})" style="background:var(--error); color:white;">Cancel</button>
    `;
    c.appendChild(card);
  });
}

function cancelAppointment(index) {
  if(confirm("Cancel this appointment?")) {
    const apps = JSON.parse(localStorage.getItem(CONFIG_APIS.STORAGE.APPOINTMENTS)) || [];
    apps.splice(index, 1);
    localStorage.setItem(CONFIG_APIS.STORAGE.APPOINTMENTS, JSON.stringify(apps));
    displayAppointments();
    utils.showToast("Cancelled", "warning");
  }
}

// ::::::::::::::::::: Booking ::::::::::::::::::::::::
function initBookingModal() {
  const modal = document.getElementById("booking-modal");
  const form = document.getElementById("booking-form");
  const cancel = document.getElementById("cancel-booking");

  window.openBookingModal = function(id) {
    const p = doctorsData.find(d => d.id === id); 
    if(!p) return;
    state.currentBooking = p; 
    document.getElementById("modal-provider-name").textContent = p.name;
    modal?.classList.remove("hidden");
  };

  cancel?.addEventListener("click", () => { modal?.classList.add("hidden"); });

  form?.addEventListener("submit", e => {
    e.preventDefault();
    if(!state.user) { utils.showToast("Please login", "error"); return; }

    const appt = { 
      providerName: state.currentBooking.name, 
      date: document.getElementById("booking-date").value, 
      time: document.getElementById("booking-time").value,
      status: "confirmed"
    };

    const apps = JSON.parse(localStorage.getItem(CONFIG_APIS.STORAGE.APPOINTMENTS)) || []; 
    apps.push(appt); 
    localStorage.setItem(CONFIG_APIS.STORAGE.APPOINTMENTS, JSON.stringify(apps)); 

    displayAppointments();
    modal?.classList.add("hidden");
    utils.showToast("Booked locally!", "success");
  });
}

async function registerSW() {
  if('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('/sw.js'); } catch(e) {}
  }
}

function initOffline() {
  window.addEventListener('offline', () => document.getElementById("offline-warning")?.classList.remove("hidden"));
  window.addEventListener('online', () => document.getElementById("offline-warning")?.classList.add("hidden"));
}