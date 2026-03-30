// ================= CONFIG =================
const CONFIG = {
  API: {
    NPPES: "https://clinicaltables.nlm.nih.gov/api/npi_idv/v3/search"
  },
  STORAGE: { 
    USER: "hc_user", 
    APPOINTMENTS: "hc_appointments", 
    THEME: "hc_theme" 
  }
};

const state = { 
  symptoms: [], 
  isLoggedIn: false, 
  user: null, 
  currentBooking: null 
};

// ================= UTILS =================
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
    if(bmi < 18.5) return { cat: 'underweight', color: '#63b3ed', advice: 'Please consider consulting a nutritionist.' };
    if(bmi < 25) return { cat: 'normal', color: '#48bb78', advice: 'Great job! Maintain your healthy lifestyle.' };
    if(bmi < 30) return { cat: 'overweight', color: '#ecc94b', advice: 'Small lifestyle changes can help.' };
    return { cat: 'obese', color: '#f56565', advice: 'Please consult a healthcare professional.' };
  },
  getToday() { return new Date().toISOString().split('T')[0]; },
  formatDT(d, t) { return new Date(`${d}T${t}`).toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }); }
};

document.addEventListener("DOMContentLoaded", () => {
  // Check for logged-in user
  const currentUser = JSON.parse(localStorage.getItem(CONFIG.STORAGE.USER));
  if(currentUser) {
    state.isLoggedIn = true;
    state.user = currentUser.username;
    const btn = document.getElementById("logout-btn");
    if(btn) {
      btn.textContent = `👋 ${state.user}`;
      btn.style.display = 'inline-flex';
    }
    document.getElementById("auth-section").classList.add("hidden");
  } else {
    document.getElementById("auth-section").classList.remove("hidden");
  }

  // Init Functions
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
  initOffline();
});

// ================= AUTH =================
function initAuth() {
  const formContainer = document.getElementById("auth-section");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const msgElement = document.getElementById("auth-message");
  
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const logoutBtn = document.getElementById("logout-btn");

  function showMessage(text, type) {
    if(msgElement) msgElement.textContent = text;
    if(type === "error") msgElement.style.color = "#e53e3e";
    if(type === "success") msgElement.style.color = "#38a169";
    if(type === "info") msgElement.style.color = "var(--accent)";
    setTimeout(() => { if(msgElement) msgElement.textContent = ''; }, 5000);
  }

  function handleLogin(success) {
    if(success) {
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      
      if(!username || !password) { showMessage("Please fill all fields", "error"); return; }
      
      // Save User
      localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify({ username, password }));
      
      // Reset UI
      state.isLoggedIn = true;
      state.user = username;
      
      usernameInput.value = '';
      passwordInput.value = '';
      document.getElementById("auth-section").classList.add("hidden");
      
      const btn = document.getElementById("logout-btn");
      if(btn) {
        btn.textContent = `👋 ${username}`;
        btn.style.display = 'inline-flex';
      }
      
      utils.showToast(`Welcome back, ${username}!`, "success", 3000);
    }
  }

  loginBtn.addEventListener("click", () => handleLogin(true));

  registerBtn.addEventListener("click", () => {
    const email = usernameInput.value.trim();
    const password = passwordInput.value;

    if (password.length < 6) { showMessage("Password must be at least 6 characters long", "error"); return; }
    
    // Simple check (in real app, verify against DB)
    if(email.includes("@")) {
       // Treat input as username
       showMessage("Account created successfully!", "success");
       handleLogin(true);
    } else {
       showMessage("Invalid Email Format", "error");
    }
  });

  if(logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(CONFIG.STORAGE.USER);
      location.reload();
    });
  }
}

// ================= EMERGENCY =================
async function initEmergency() {
  const el = document.querySelector(".emergency");
  if (!el) return;

  const EMERGENCY_NUMBERS = {
    MY: "999 / 994",
    US: "911",
    UK: "999 / 112",
    DEFAULT: "112"
  };

  try {
    const response = await fetch("https://ipapi.co/json/");
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
        <a href="tel:${num}" class="btn-call" style="background:#dc2626; color:white; padding:0.75rem 1.5rem; border-radius:8px; text-decoration:none; margin-right:0.5rem">
          <i class="fas fa-phone"></i> Call ${num}
        </a>
        <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" class="btn-map" style="background:#38a169; color:white; padding:0.75rem 1.5rem; border-radius:8px; text-decoration:none;">
          <i class="fas fa-map"></i> Location
        </a>
      </div>
    `;
  } catch (error) {
    el.innerHTML = `
      <div class="card" style="border-left: 4px solid var(--warning)">
        <h3>⚠️ Location Unavailable</h3>
        <p>In emergency? Call <strong>112</strong> (Universal)</p>
        <a href="tel:112" class="btn-call" style="display:inline-block; background:var(--accent); color:white; padding:0.75rem 1.5rem; border-radius:8px; text-decoration:none;">Call 112</a>
      </div>
    `;
  }
}

// ================= SYMPTOMS =================
function initSymptomChecker() {
  const input = document.getElementById("symptom-input"), addBtn = document.getElementById("add-symptom"), searchBtn = document.getElementById("search-symptoms"), list = document.getElementById("symptom-list"), results = document.getElementById("results-area"), suggestions = document.getElementById("suggestions");
  const all = ["fever","cough","headache","nausea","sneezing","fatigue","rash","dizziness"];
  let to;
  input?.addEventListener("input", () => {
    clearTimeout(to); to = setTimeout(() => {
      const v = input.value.toLowerCase().trim(); suggestions.innerHTML = "";
      if(v.length < 2) { suggestions.classList.remove('show'); return; }
      const m = all.filter(s => s.includes(v) && !state.symptoms.includes(s));
      if(m.length > 0) { suggestions.classList.add('show'); m.forEach(s => { 
        const d = document.createElement("div"); 
        d.textContent = s; 
        d.onclick = () => { input.value = s; suggestions.classList.remove('show'); input.focus(); }; 
        suggestions.appendChild(d); 
      }); }
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
    const diseases = [{ name:"Flu", symptoms:["fever","cough","headache","fatigue"], advice:"Rest, hydrate, OTC pain relief.", severity:"moderate" }, { name:"Common Cold", symptoms:["cough","sneezing"], advice:"Rest, fluids.", severity:"mild" }];
    const matches = diseases.filter(d => state.symptoms.some(s => d.symptoms.includes(s)));
    if(matches.length === 0) { results.innerHTML = `<div class="card" style="border-left:4px solid var(--warning)"><h3>⚠️ No match found</h3><p>Consult a provider.</p></div>`; return; }
    results.innerHTML = ""; const colors = { mild:'#48bb78', moderate:'#dd6b20' };
    matches.forEach(d => {
      const div = document.createElement("div"); div.className = "card";
      div.innerHTML = `<h3>${d.name}</h3><p>${d.advice}</p>`;
      results.appendChild(div);
    });
    utils.showToast(`Found ${matches.length}`, "info");
  });
  function renderTags() { list.innerHTML = ""; state.symptoms.forEach(s => { const li = document.createElement("li"); li.innerHTML = `${s}<button onclick="removeSymptom('${s}')">×</button>`; list.appendChild(li); }); }
  window.removeSymptom = function(s) { state.symptoms = state.symptoms.filter(x => x !== s); renderTags(); };
}

// ================= HEALTH TOOLS =================
function initHealthTools() {
  const btn = document.getElementById("calc-bmi"), res = document.getElementById("bmi-result"), mark = document.getElementById("bmi-marker");
  btn?.addEventListener("click", () => {
    const w = parseFloat(document.getElementById("weight").value), h = parseFloat(document.getElementById("height").value);
    if(!w || !h) { utils.showToast("Enter valid values", "error"); return; }
    const bmi = utils.calculateBMI(w, h), { cat, color, advice } = utils.getBMICategory(parseFloat(bmi));
    document.getElementById("bmi-number").textContent = bmi; 
    document.getElementById("bmi-category").textContent = cat.replace('_',' ');
    document.getElementById("bmi-category").style.color = color; 
    document.getElementById("bmi-advice").textContent = advice;
    const pos = Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100)); mark.style.left = `${pos}%`; mark.style.background = color;
    res.classList.remove("hidden"); res.scrollIntoView({ behavior: "smooth", block: "center" }); utils.showToast(`BMI: ${bmi} (${cat})`, "success", 3000);
  });
}

// ================= DOCTORS =================
const doctorsData = [{ id:1, name:"Dr. Sarah Lee", type:"general", gender:"female", specialty:"Family Medicine", hospital:"Penang General Hospital", mode:"physical", time:"9am - 1pm", rating:4.8 }, { id:2, name:"Dr. John Smith", type:"general", gender:"male", specialty:"Internal Medicine", hospital:"Island Hospital", mode:"physical", time:"2pm - 6pm", rating:4.6 }, { id:3, name:"Dr. Aisha Khan", type:"mental", gender:"female", specialty:"Clinical Psychologist", hospital:"MindCare Online", mode:"virtual", time:"10am - 4pm", rating:4.9 }];

function displayDoctors(f = {}) {
  const c = document.getElementById("results"), load = document.getElementById("loading-doctors"); if(!c) return;
  load?.classList.remove("hidden"); c.innerHTML = "";
  setTimeout(() => {
    load?.classList.add("hidden");
    const filtered = doctorsData.filter(d => (!f.type || d.type === f.type) && (!f.gender || d.gender === f.gender) && (!f.mode || d.mode === f.mode));
    if(filtered.length === 0) { c.innerHTML = `<p class="empty-state">No providers match.</p>`; return; }
    filtered.forEach(doc => {
      const card = document.createElement("div"); card.className = "card";
      card.innerHTML = `<h3>${doc.name}</h3><p>${doc.specialty}</p><p>${doc.hospital}</p><button onclick="openBookingModal(${doc.id})" class="primary">Book</button>`;
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
  const inp = document.getElementById("provider-search");
  if(inp) {
    let to; 
    inp.addEventListener("input", e => { 
      clearTimeout(to); 
      to = setTimeout(() => { 
        const term = e.target.value.toLowerCase(); 
        const filtered = doctorsData.filter(d => d.name.toLowerCase().includes(term) || d.specialty.toLowerCase().includes(term));
        
        const container = document.getElementById("results");
        container.innerHTML = "";
        filtered.forEach(doc => {
          const card = document.createElement("div"); card.className = "card";
          card.innerHTML = `<h3>${doc.name}</h3><p>${doc.specialty}</p><button onclick="openBookingModal(${doc.id})" class="primary">Book</button>`;
          container.appendChild(card);
        });
      }, 500); 
    });
  }
}

// ================= APPOINTMENTS =================
function displayAppointments() {
  const c = document.getElementById("appointments-list"), empty = document.getElementById("no-appointments");
  if(!c) return;
  const apps = JSON.parse(localStorage.getItem(CONFIG.STORAGE.APPOINTMENTS)) || []; 
  c.innerHTML = "";
  if(apps.length === 0) { empty?.classList.remove("hidden"); return; }
  empty?.classList.add("hidden");
  apps.sort((a,b) => new Date(a.datetime) - new Date(b.datetime));
  apps.forEach((a, idx) => {
    const card = document.createElement("div"); card.className = "card";
    card.innerHTML = `
      <h3>${a.providerName}</h3>
      <p><i class="fas fa-calendar-day"></i> ${utils.formatDT(a.date, a.time)}</p>
      <div style="display:flex;gap:0.5rem;margin-top:1rem">
        <button onclick="addToCalendar('${a.providerName}','${a.date}','${a.time}')" style="flex:1">Calendar</button>
        <button onclick="cancelAppointment(${idx})" style="flex:1;background:var(--error)">Cancel</button>
      </div>
    `;
    c.appendChild(card);
  });
}

function cancelAppointment(index) {
  if(confirm("Cancel appointment?")) {
    const apps = JSON.parse(localStorage.getItem(CONFIG.STORAGE.APPOINTMENTS)) || [];
    apps.splice(index, 1);
    localStorage.setItem(CONFIG.STORAGE.APPOINTMENTS, JSON.stringify(apps));
    displayAppointments();
  }
}

// ================= BOOKING =================
function initBookingModal() {
  const modal = document.getElementById("booking-modal");
  const form = document.getElementById("booking-form");
  const cancel = document.getElementById("cancel-booking");
  const dateInp = document.getElementById("booking-date");
  const smsCheckbox = document.getElementById("sms-notifications");
  const smsPhoneSection = document.getElementById("sms-phone-section");
  const phoneNumberInput = document.getElementById("phone-number");

  if(dateInp) dateInp.min = utils.getToday();

  if(smsCheckbox && smsPhoneSection) {
    smsCheckbox.addEventListener('change', () => {
      smsPhoneSection.style.display = smsCheckbox.checked ? "block" : "none";
      smsPhoneSection.classList.toggle("hidden", !smsCheckbox.checked);
    });
  }

  window.openBookingModal = function(id) {
    const p = doctorsData.find(d => d.id === id); 
    if(!p) return;
    state.currentBooking = p; 
    document.getElementById("modal-provider-name").textContent = p.name;
    document.getElementById("modal-provider-mode").textContent = p.mode === 'virtual' ? '🌐 Virtual' : '🏥 In-Person';
    if(modal?.showModal) modal.showModal(); 
    else { modal?.classList.remove("hidden"); modal?.setAttribute("open","open"); }
  };

  window.openBookingModalFromProvider = function(name, spec) {
    state.currentBooking = { id: Date.now(), name, specialty: spec, mode: "physical", hospital: "Clinic" };
    document.getElementById("modal-provider-name").textContent = name; 
    document.getElementById("modal-provider-mode").textContent = '🏥 In-Person';
    if(modal?.showModal) modal.showModal(); 
    else { modal?.classList.remove("hidden"); }
  };

  cancel?.addEventListener("click", () => { 
    if(modal?.close) modal.close(); 
    else modal?.classList.add("hidden"); 
    state.currentBooking = null; 
  });

  modal?.addEventListener("click", e => { 
    if(e.target === modal) { 
      if(modal.close) modal.close(); 
      else modal.classList.add("hidden"); 
      state.currentBooking = null; 
    } 
  });

  form?.addEventListener("submit", async e => {
    e.preventDefault();
    
    if(!state.currentBooking) { utils.showToast("Select a doctor first", "error"); return; }
    if(!state.isLoggedIn) { utils.showToast("Please Login/Register", "error"); return; }

    const date = document.getElementById("booking-date").value;
    const time = document.getElementById("booking-time").value;
    const notes = document.getElementById("booking-notes").value.trim();

    const appt = { 
      id: Date.now(), 
      userId: state.user, 
      providerId: state.currentBooking.id, 
      providerName: state.currentBooking.name, 
      hospital: state.currentBooking.hospital, 
      specialty: state.currentBooking.specialty, 
      mode: state.currentBooking.mode, 
      date, time, datetime: `${date}T${time}`, notes, status: "confirmed" 
    };

    // Save to LocalStorage
    const apps = JSON.parse(localStorage.getItem(CONFIG.STORAGE.APPOINTMENTS)) || []; 
    apps.push(appt); 
    localStorage.setItem(CONFIG.STORAGE.APPOINTMENTS, JSON.stringify(apps)); 

    // Simulate SMS
    const phoneOptedIn = smsCheckbox?.checked;
    const phoneNumber = phoneNumberInput?.value.trim();

    if(phoneOptedIn && phoneNumber) {
      utils.showToast("SMS sent successfully!", "success", 2000);
    } else {
      utils.showToast("Appointment booked!", "success", 2000);
    }

    addToGoogleCalendar(appt);
    displayAppointments();
    if(modal?.close) modal.close(); 
    else modal?.classList.add("hidden"); 
    form.reset(); 
    state.currentBooking = null;
  });
}

function addToGoogleCalendar(a) {
  const start = a.datetime.replace(/[-:]/g,'').slice(0,15)+"00Z", end = new Date(new Date(a.datetime).getTime()+3600000).toISOString().replace(/[-:]/g,'').slice(0,15)+"00Z";
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Appointment+with+${encodeURIComponent(a.providerName)}&dates=${start}/${end}&details=${encodeURIComponent(a.notes||'Health consultation')}&location=${encodeURIComponent(a.hospital||'Virtual')}`;
  window.open(url, '_blank');
}

// ================= OFFLINE =================
function initOffline() {
  const offlineBanner = document.getElementById("offline-warning");
  window.addEventListener('offline', () => { if(offlineBanner) offlineBanner.classList.remove("hidden"); });
  window.addEventListener('online', () => { if(offlineBanner) offlineBanner.classList.add("hidden"); });
}

function initThemeToggle() { document.getElementById('theme-toggle')?.addEventListener('click', () => utils.toggleTheme()); }