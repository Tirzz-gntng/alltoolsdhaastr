/* =========================================================
   All Tools Dhaa StR — app.js
   Role system: member < vip < owner
   Only owner (admin) can create new accounts.
   Data persisted in localStorage (single-device demo storage).
   ========================================================= */

const DB_KEY = "atds_users_v1";
const SESSION_KEY = "atds_session_v1";
const THEME_KEY = "atds_theme_v1";

/* ---------- Seed data ---------- */
function seedUsers() {
  if (!localStorage.getItem(DB_KEY)) {
    const seed = [
      { username: "owner", password: "owner123", role: "owner", createdAt: Date.now() },
      { username: "vipuser", password: "vip123", role: "vip", createdAt: Date.now() },
      { username: "member", password: "member123", role: "member", createdAt: Date.now() }
    ];
    localStorage.setItem(DB_KEY, JSON.stringify(seed));
  }
}
function getUsers() {
  return JSON.parse(localStorage.getItem(DB_KEY) || "[]");
}
function saveUsers(list) {
  localStorage.setItem(DB_KEY, JSON.stringify(list));
}

/* ---------- Tool catalog ---------- */
/* minRole: member | vip | owner  (owner tier also unlocks vip-only tools) */
const TOOLS = [
  { id: "walink", icon: "🔗", name: "WA Link Generator", desc: "Buat link wa.me instan", minRole: "member", type: "walink" },
  { id: "quickmsg", icon: "💬", name: "Quick Message", desc: "Template pesan siap pakai", minRole: "member", type: "quickmsg" },
  { id: "analyzer", icon: "📊", name: "Message Analyzer", desc: "Hitung kata, karakter, emoji", minRole: "member", type: "analyzer" },
  { id: "qr", icon: "▦", name: "QR Code Generator", desc: "Buat QR untuk link / teks", minRole: "member", type: "qr" },
  { id: "numfmt", icon: "#", name: "Number Formatter", desc: "Format nomor ke +62", minRole: "member", type: "numfmt" },
  { id: "security", icon: "🛡️", name: "Security Checklist", desc: "Skor keamanan akun", minRole: "member", type: "security" },
  { id: "bulk", icon: "📚", name: "Bulk WA Link", desc: "Generate banyak link sekaligus", minRole: "vip", type: "bulk" },
  { id: "textfmt", icon: "🔤", name: "Text Formatter", desc: "Bold, Italic, Strikethrough, Monospace", minRole: "vip", type: "textfmt" },
  { id: "vcard", icon: "👤", name: "vCard Generator", desc: "Buat file kontak .vcf", minRole: "vip", type: "vcard" },
  { id: "reminder", icon: "⏰", name: "Penjadwal Pengingat", desc: "Pengingat kirim pesan", minRole: "vip", type: "soon" },
  { id: "catalog", icon: "🗂️", name: "Katalog Produk", desc: "Link katalog WA Business", minRole: "vip", type: "soon" },
  { id: "polling", icon: "📈", name: "Polling/Voting", desc: "Buat polling teks", minRole: "member", type: "polling" },
  { id: "grouplink", icon: "👥", name: "Manajer Link Grup", desc: "Simpan link grup + QR", minRole: "vip", type: "grouplink" },
  { id: "autoreply", icon: "↩️", name: "Auto-Reply", desc: "Pesan sibuk/otomatis", minRole: "vip", type: "soon" },
  { id: "privacy", icon: "🔒", name: "Checklist Privasi", desc: "Keamanan & privasi akun", minRole: "member", type: "security" },
  { id: "backup", icon: "🗄️", name: "Backup Chat", desc: "Kalkulator & panduan", minRole: "owner", type: "soon" },
];

const ROLE_RANK = { member: 1, vip: 2, owner: 3 };

/* ---------- Session ---------- */
function getSession() {
  return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
}
function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username, role: user.role }));
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/* ---------- UI namespace ---------- */
const AppUI = {
  finishSplash() { goTo(getSession() ? "app" : "login"); }
};

function goTo(screen) {
  document.getElementById("splash").classList.add("hidden");
  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.add("hidden");
  if (screen === "login") document.getElementById("login").classList.remove("hidden");
  if (screen === "app") { document.getElementById("app").classList.remove("hidden"); renderApp(); }
}

/* Fallback: if splash video doesn't fire 'ended' (blocked autoplay etc.) auto-advance */
setTimeout(() => {
  if (!document.getElementById("splash").classList.contains("hidden")) {
    AppUI.finishSplash();
  }
}, 3200);

/* ---------- Login ---------- */
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const u = document.getElementById("loginUsername").value.trim();
  const p = document.getElementById("loginPassword").value;
  const users = getUsers();
  const found = users.find(x => x.username === u && x.password === p);
  const errEl = document.getElementById("loginError");
  if (found) {
    errEl.classList.add("hidden");
    setSession(found);
    document.getElementById("loginForm").reset();
    goTo("app");
  } else {
    errEl.textContent = "Username atau password salah.";
    errEl.classList.remove("hidden");
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearSession();
  goTo("login");
});

/* ---------- Theme ---------- */
function applyTheme() {
  const theme = localStorage.getItem(THEME_KEY) || "light";
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("themeBtn").textContent = theme === "dark" ? "☀️" : "🌙";
}
document.getElementById("themeBtn").addEventListener("click", () => {
  const cur = localStorage.getItem(THEME_KEY) || "light";
  localStorage.setItem(THEME_KEY, cur === "light" ? "dark" : "light");
  applyTheme();
});

/* ---------- Search ---------- */
document.getElementById("searchBtn").addEventListener("click", () => {
  document.getElementById("searchBar").classList.toggle("hidden");
  document.getElementById("searchInput").focus();
});
document.getElementById("searchInput").addEventListener("input", (e) => {
  renderTools(e.target.value.toLowerCase());
});
document.getElementById("settingsBtn").addEventListener("click", () => {
  openModal(`<h3>Pengaturan</h3>
    <p class="muted small">Mode tema, notifikasi, dan preferensi lain akan hadir di versi berikutnya.</p>`);
});

/* ---------- Bottom nav (visual only for Activity/More) ---------- */
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const nav = btn.dataset.nav;
    if (nav === "activity") {
      openModal(`<h3>Activity</h3><p class="muted small">Riwayat penggunaan tools akan tampil di sini.</p>`);
    } else if (nav === "more") {
      openModal(`<h3>More</h3><p class="muted small">Bantuan, tentang aplikasi, dan pengaturan lanjutan.</p>`);
    } else if (nav === "tools") {
      document.getElementById("toolsGrid").scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
});

/* ---------- Render app (after login) ---------- */
function renderApp() {
  const session = getSession();
  if (!session) { goTo("login"); return; }

  document.getElementById("userNameLabel").textContent = session.username;
  const badge = document.getElementById("roleBadge");
  badge.textContent = session.role;
  badge.className = "role-badge " + (session.role === "owner" ? "owner" : session.role === "vip" ? "vip" : "");

  document.getElementById("adminSection").classList.toggle("hidden", session.role !== "owner");
  if (session.role === "owner") renderUserList();

  renderTools("");
}

/* ---------- Tools grid ---------- */
function renderTools(filter) {
  const session = getSession();
  if (!session) return;
  const myRank = ROLE_RANK[session.role];
  const grid = document.getElementById("toolsGrid");
  grid.innerHTML = "";

  TOOLS
    .filter(t => t.name.toLowerCase().includes(filter))
    .forEach(tool => {
      const locked = ROLE_RANK[tool.minRole] > myRank;
      const card = document.createElement("button");
      card.className = "tool-card";
      card.innerHTML = `
        ${locked ? `<span class="tool-lock">🔒 ${tool.minRole.toUpperCase()}</span>` : ""}
        <div class="tool-icon">${tool.icon}</div>
        <h4>${tool.name}</h4>
        <p>${tool.desc}</p>`;
      card.addEventListener("click", () => {
        if (locked) {
          openModal(`<h3>Fitur ${escapeHtml(tool.name)}</h3>
            <p class="muted small">Fitur ini butuh minimal role <strong>${tool.minRole.toUpperCase()}</strong>. Hubungi Owner untuk upgrade akun kamu.</p>`);
        } else {
          openTool(tool);
        }
      });
      grid.appendChild(card);
    });
}

/* ---------- Modal helpers ---------- */
function openModal(html) {
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("toolModal").classList.remove("hidden");
}
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("toolModal").addEventListener("click", (e) => {
  if (e.target.id === "toolModal") closeModal();
});
function closeModal() { document.getElementById("toolModal").classList.add("hidden"); }

/* ---------- Tool implementations ---------- */
function openTool(tool) {
  switch (tool.type) {
    case "walink": return toolWaLink();
    case "numfmt": return toolNumFmt();
    case "analyzer": return toolAnalyzer();
    case "textfmt": return toolTextFmt();
    case "qr": return toolQr();
    case "quickmsg": return toolQuickMsg();
    case "security": return toolSecurity();
    case "vcard": return toolVcard();
    case "bulk": return toolBulk();
    case "polling": return toolPolling();
    case "grouplink": return toolGroupLink();
    default:
      openModal(`<h3>${escapeHtml(tool.name)}</h3><p class="muted small">Fitur ini akan segera hadir. 🚧</p>`);
  }
}

function escapeHtml(s){return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function normalizePhone(raw) {
  let n = raw.replace(/[^\d]/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (n.startsWith("620")) n = "62" + n.slice(3);
  if (!n.startsWith("62")) n = "62" + n;
  return n;
}

function toolWaLink() {
  openModal(`
    <h3>WA Link Generator</h3>
    <input id="wlPhone" placeholder="Nomor HP (mis. 08123456789)">
    <textarea id="wlMsg" rows="3" placeholder="Pesan (opsional)"></textarea>
    <button class="btn-primary" id="wlGen">Buat Link</button>
    <div id="wlOut"></div>
  `);
  document.getElementById("wlGen").addEventListener("click", () => {
    const phone = normalizePhone(document.getElementById("wlPhone").value || "");
    const msg = encodeURIComponent(document.getElementById("wlMsg").value || "");
    const link = `https://wa.me/${phone}${msg ? "?text=" + msg : ""}`;
    document.getElementById("wlOut").innerHTML = `
      <div class="modal-result">${link}</div>
      <button class="copy-btn" onclick="navigator.clipboard.writeText('${link}')">Salin Link</button>`;
  });
}

function toolNumFmt() {
  openModal(`
    <h3>Number Formatter</h3>
    <input id="nfInput" placeholder="Contoh: 081234567890">
    <button class="btn-primary" id="nfGen">Format ke +62</button>
    <div id="nfOut"></div>
  `);
  document.getElementById("nfGen").addEventListener("click", () => {
    const val = document.getElementById("nfInput").value || "";
    const formatted = "+" + normalizePhone(val);
    document.getElementById("nfOut").innerHTML = `<div class="modal-result">${formatted}</div>`;
  });
}

function toolAnalyzer() {
  openModal(`
    <h3>Message Analyzer</h3>
    <textarea id="anText" rows="5" placeholder="Tempel pesan di sini..."></textarea>
    <button class="btn-primary" id="anGen">Analisis</button>
    <div id="anOut"></div>
  `);
  document.getElementById("anGen").addEventListener("click", () => {
    const text = document.getElementById("anText").value || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const emojiMatches = text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || [];
    document.getElementById("anOut").innerHTML = `
      <div class="modal-result">
        Kata: <strong>${words}</strong><br>
        Karakter: <strong>${chars}</strong><br>
        Emoji: <strong>${emojiMatches.length}</strong>
      </div>`;
  });
}

function toolTextFmt() {
  openModal(`
    <h3>Text Formatter (WhatsApp)</h3>
    <textarea id="tfText" rows="3" placeholder="Tulis teks di sini..."></textarea>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
      <button class="copy-btn" id="tfBold">Bold</button>
      <button class="copy-btn" id="tfItalic">Italic</button>
      <button class="copy-btn" id="tfStrike">Strikethrough</button>
      <button class="copy-btn" id="tfMono">Monospace</button>
    </div>
    <div id="tfOut"></div>
  `);
  const wrap = (symbol) => {
    const t = document.getElementById("tfText").value || "";
    const out = `${symbol}${t}${symbol}`;
    document.getElementById("tfOut").innerHTML = `
      <div class="modal-result">${escapeHtml(out)}</div>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify(out)})">Salin</button>`;
  };
  document.getElementById("tfBold").addEventListener("click", () => wrap("*"));
  document.getElementById("tfItalic").addEventListener("click", () => wrap("_"));
  document.getElementById("tfStrike").addEventListener("click", () => wrap("~"));
  document.getElementById("tfMono").addEventListener("click", () => wrap("```"));
}

function toolQr() {
  openModal(`
    <h3>QR Code Generator</h3>
    <input id="qrText" placeholder="Link atau teks">
    <button class="btn-primary" id="qrGen">Buat QR</button>
    <div id="qrOut" style="text-align:center;margin-top:12px;"></div>
    <p class="muted small">QR dibuat lewat layanan publik api.qrserver.com.</p>
  `);
  document.getElementById("qrGen").addEventListener("click", () => {
    const text = encodeURIComponent(document.getElementById("qrText").value || "");
    document.getElementById("qrOut").innerHTML = text
      ? `<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${text}" alt="QR" style="border-radius:12px;">`
      : "";
  });
}

function toolQuickMsg() {
  const templates = [
    "Halo, mohon info lebih lanjut mengenai produk/layanan ini 🙏",
    "Terima kasih atas responnya, ditunggu kabar selanjutnya ya.",
    "Mohon maaf mengganggu, apakah pesanan saya sudah diproses?",
    "Selamat pagi/siang, saya ingin menanyakan ketersediaan stok.",
  ];
  openModal(`
    <h3>Quick Message</h3>
    <div id="qmList"></div>
  `);
  document.getElementById("qmList").innerHTML = templates.map(t => `
    <div class="modal-result" style="display:flex;justify-content:space-between;gap:10px;align-items:center;">
      <span>${escapeHtml(t)}</span>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify(t)})">Salin</button>
    </div>`).join("");
}

function toolSecurity() {
  openModal(`
    <h3>Security & Privacy Checklist</h3>
    <div id="secList" style="display:flex;flex-direction:column;gap:8px;"></div>
    <div id="secScore" class="modal-result">Skor: 0 / 5</div>
  `);
  const items = [
    "Verifikasi 2 langkah aktif",
    "Kode PIN cadangan tersimpan aman",
    "Privasi foto profil dibatasi",
    "Privasi 'Terakhir dilihat' dibatasi",
    "Tidak membagikan OTP ke siapa pun"
  ];
  const list = document.getElementById("secList");
  list.innerHTML = items.map((label, i) => `
    <label style="display:flex;gap:8px;align-items:center;font-size:13px;">
      <input type="checkbox" class="secItem" data-i="${i}"> ${label}
    </label>`).join("");
  list.querySelectorAll(".secItem").forEach(cb => {
    cb.addEventListener("change", () => {
      const checked = list.querySelectorAll(".secItem:checked").length;
      document.getElementById("secScore").textContent = `Skor: ${checked} / ${items.length}`;
    });
  });
}

function toolVcard() {
  openModal(`
    <h3>vCard Generator</h3>
    <input id="vcName" placeholder="Nama lengkap">
    <input id="vcPhone" placeholder="Nomor HP">
    <input id="vcOrg" placeholder="Perusahaan (opsional)">
    <button class="btn-primary" id="vcGen">Buat & Unduh .vcf</button>
  `);
  document.getElementById("vcGen").addEventListener("click", () => {
    const name = document.getElementById("vcName").value || "Tanpa Nama";
    const phone = normalizePhone(document.getElementById("vcPhone").value || "");
    const org = document.getElementById("vcOrg").value || "";
    const vcf = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;TYPE=CELL:+${phone}\nORG:${org}\nEND:VCARD`;
    const blob = new Blob([vcf], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name}.vcf`; a.click();
  });
}

function toolBulk() {
  openModal(`
    <h3>Bulk WA Link</h3>
    <p class="muted small">Satu nomor per baris.</p>
    <textarea id="bkNumbers" rows="4" placeholder="0812xxxx&#10;0813xxxx&#10;0821xxxx"></textarea>
    <textarea id="bkMsg" rows="2" placeholder="Pesan (opsional)"></textarea>
    <button class="btn-primary" id="bkGen">Generate Semua Link</button>
    <div id="bkOut" style="margin-top:10px;display:flex;flex-direction:column;gap:6px;"></div>
  `);
  document.getElementById("bkGen").addEventListener("click", () => {
    const nums = (document.getElementById("bkNumbers").value || "").split("\n").map(s => s.trim()).filter(Boolean);
    const msg = encodeURIComponent(document.getElementById("bkMsg").value || "");
    const out = document.getElementById("bkOut");
    out.innerHTML = nums.map(n => {
      const link = `https://wa.me/${normalizePhone(n)}${msg ? "?text=" + msg : ""}`;
      return `<div class="modal-result" style="font-size:12px;">${link}</div>`;
    }).join("");
  });
}

function toolPolling() {
  openModal(`
    <h3>Polling / Voting (Teks)</h3>
    <input id="plQuestion" placeholder="Pertanyaan polling">
    <textarea id="plOptions" rows="3" placeholder="Satu opsi per baris"></textarea>
    <button class="btn-primary" id="plGen">Buat Teks Polling</button>
    <div id="plOut"></div>
  `);
  document.getElementById("plGen").addEventListener("click", () => {
    const q = document.getElementById("plQuestion").value || "";
    const opts = (document.getElementById("plOptions").value || "").split("\n").map(s => s.trim()).filter(Boolean);
    const emojiNum = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣"];
    const text = `📊 *${q}*\n\n` + opts.map((o, i) => `${emojiNum[i] || i+1+"."} ${o}`).join("\n") + `\n\nBalas dengan angka pilihanmu!`;
    document.getElementById("plOut").innerHTML = `
      <div class="modal-result" style="white-space:pre-wrap;">${escapeHtml(text)}</div>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify(text)})">Salin</button>`;
  });
}

function toolGroupLink() {
  openModal(`
    <h3>Manajer Link Grup</h3>
    <input id="glName" placeholder="Nama grup">
    <input id="glLink" placeholder="Link undangan grup (chat.whatsapp.com/...)">
    <button class="btn-primary" id="glSave">Simpan</button>
    <div id="glList" style="margin-top:12px;display:flex;flex-direction:column;gap:8px;"></div>
  `);
  const KEY = "atds_grouplinks";
  const load = () => JSON.parse(localStorage.getItem(KEY) || "[]");
  const render = () => {
    const list = load();
    document.getElementById("glList").innerHTML = list.map((g, i) => `
      <div class="modal-result" style="display:flex;justify-content:space-between;align-items:center;">
        <span><strong>${escapeHtml(g.name)}</strong><br><span class="small muted">${escapeHtml(g.link)}</span></span>
        <button class="copy-btn" onclick="navigator.clipboard.writeText('${g.link.replace(/'/g, "\\'")}')">Salin</button>
      </div>`).join("") || `<p class="muted small">Belum ada grup tersimpan.</p>`;
  };
  document.getElementById("glSave").addEventListener("click", () => {
    const name = document.getElementById("glName").value.trim();
    const link = document.getElementById("glLink").value.trim();
    if (!name || !link) return;
    const list = load();
    list.push({ name, link });
    localStorage.setItem(KEY, JSON.stringify(list));
    document.getElementById("glName").value = "";
    document.getElementById("glLink").value = "";
    render();
  });
  render();
}

/* ---------- Admin: user management (owner only) ---------- */
document.getElementById("createUserForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value;
  const role = document.getElementById("newRole").value;
  const msgEl = document.getElementById("createUserMsg");
  const users = getUsers();

  if (users.some(u => u.username === username)) {
    msgEl.style.color = "var(--danger)";
    msgEl.textContent = "Username sudah dipakai.";
    return;
  }
  users.push({ username, password, role, createdAt: Date.now() });
  saveUsers(users);
  msgEl.style.color = "var(--success)";
  msgEl.textContent = `Akun "${username}" (${role}) berhasil dibuat.`;
  document.getElementById("createUserForm").reset();
  renderUserList();
});

function renderUserList() {
  const session = getSession();
  const users = getUsers();
  const container = document.getElementById("userList");
  container.innerHTML = users.map(u => `
    <div class="user-row">
      <div class="u-left">
        <strong>${escapeHtml(u.username)}</strong>
        <span class="role-badge ${u.role === "owner" ? "owner" : u.role === "vip" ? "vip" : ""}" style="margin-left:4px;">${u.role}</span>
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <select data-user="${u.username}" class="roleSelect">
          <option value="member" ${u.role === "member" ? "selected" : ""}>member</option>
          <option value="vip" ${u.role === "vip" ? "selected" : ""}>vip</option>
          <option value="owner" ${u.role === "owner" ? "selected" : ""}>owner</option>
        </select>
        ${u.username === session.username ? "" : `<button data-del="${u.username}">Hapus</button>`}
      </div>
    </div>
  `).join("");

  container.querySelectorAll(".roleSelect").forEach(sel => {
    sel.addEventListener("change", () => {
      const list = getUsers();
      const target = list.find(u => u.username === sel.dataset.user);
      if (target) target.role = sel.value;
      saveUsers(list);
      if (sel.dataset.user === session.username) { setSession(target); renderApp(); }
    });
  });
  container.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      let list = getUsers();
      list = list.filter(u => u.username !== btn.dataset.del);
      saveUsers(list);
      renderUserList();
    });
  });
}

/* ---------- Init ---------- */
seedUsers();
applyTheme();
