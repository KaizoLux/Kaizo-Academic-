// ═══════════════════════════════════════════════════════════════
// KAIZO ACADEMY — SHARED CORE v4.0
// White Minimal Theme · Role System · Auth · Theme Engine
// ═══════════════════════════════════════════════════════════════
const APP_VERSION = "4.0";
const ADMIN_PASS = "Kaizzo24$";

// ── Storage ────────────────────────────────────────────────────
const KS = {
  get(key) { try { const v=localStorage.getItem("kaizo:"+key); return v?JSON.parse(v):null; } catch{return null;} },
  set(key,val) { try { localStorage.setItem("kaizo:"+key,JSON.stringify(val)); return true; } catch{return false;} },
  del(key) { localStorage.removeItem("kaizo:"+key); },
  keys(prefix="") { const out=[]; for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith("kaizo:"+prefix))out.push(k.replace("kaizo:",""));} return out; }
};

// ── Default Theme (White Minimal) ──────────────────────────────
const DEFAULT_THEME = {
  colorPrimary:"#2563EB", colorBg:"#FFFFFF", colorBg2:"#F8FAFC",
  colorText:"#111827", colorTextSub:"#6B7280", colorBorder:"#E5E7EB",
  colorCard:"#FFFFFF", colorSuccess:"#10B981", colorDanger:"#EF4444", colorWarning:"#F59E0B",
  font:"Inter", fontSize:"medium",
  academyName:"KAIZO ACADEMIC", academyTagline:"Learn · Play · Grow",
  logoUrl:"", faviconUrl:"", bgImageUrl:"",
  navStyle:"sticky", cardRadius:"16", buttonRadius:"10", shadowLevel:"medium",
  navItems:[
    {label:"Home",       icon:"🏠", href:"index.html"},
    {label:"Courses",    icon:"🎓", href:"courses.html"},
    {label:"Games",      icon:"🎮", href:"games.html"},
    {label:"Community",  icon:"💬", href:"community.html"},
    {label:"Leaderboard",icon:"🏆", href:"leaderboard.html"},
  ],
  features:{ games:true, community:true, certificates:true, gamification:true }
};

// ── Theme Engine ───────────────────────────────────────────────
const Theme = {
  get() { return Object.assign({}, DEFAULT_THEME, KS.get("theme")||{}); },
  set(t) { KS.set("theme", t); this.apply(t); },
  apply(t) {
    const r = document.documentElement;
    r.style.setProperty('--c-primary',  t.colorPrimary  || DEFAULT_THEME.colorPrimary);
    r.style.setProperty('--c-bg',       t.colorBg       || DEFAULT_THEME.colorBg);
    r.style.setProperty('--c-bg2',      t.colorBg2      || DEFAULT_THEME.colorBg2);
    r.style.setProperty('--c-text',     t.colorText     || DEFAULT_THEME.colorText);
    r.style.setProperty('--c-text-sub', t.colorTextSub  || DEFAULT_THEME.colorTextSub);
    r.style.setProperty('--c-border',   t.colorBorder   || DEFAULT_THEME.colorBorder);
    r.style.setProperty('--c-card',     t.colorCard     || DEFAULT_THEME.colorCard);
    r.style.setProperty('--c-success',  t.colorSuccess  || DEFAULT_THEME.colorSuccess);
    r.style.setProperty('--c-danger',   t.colorDanger   || DEFAULT_THEME.colorDanger);
    r.style.setProperty('--c-warning',  t.colorWarning  || DEFAULT_THEME.colorWarning);
    r.style.setProperty('--font-main',  `'${t.font||"Inter"}',system-ui,sans-serif`);
    r.style.setProperty('--radius-card',(t.cardRadius||"16")+"px");
    r.style.setProperty('--radius-btn', (t.buttonRadius||"10")+"px");
    const sizeMap={small:"14px",medium:"16px",large:"18px",xlarge:"20px"};
    r.style.setProperty('--font-size',  sizeMap[t.fontSize||"medium"]||"16px");
    const sh={none:"none",soft:"0 1px 3px rgba(0,0,0,0.06)",medium:"0 4px 6px rgba(0,0,0,0.07),0 2px 4px rgba(0,0,0,0.05)",strong:"0 10px 25px rgba(0,0,0,0.12)"};
    r.style.setProperty('--shadow', sh[t.shadowLevel||"medium"]);
    r.style.setProperty('--shadow-sm','0 1px 3px rgba(0,0,0,0.06)');
    r.style.setProperty('--shadow-lg','0 10px 25px rgba(0,0,0,0.12),0 4px 10px rgba(0,0,0,0.06)');
    document.body.style.background = t.colorBg || "#FFFFFF";
    document.body.style.color = t.colorText || "#111827";
    if(t.bgImageUrl) document.body.style.backgroundImage=`url(${t.bgImageUrl})`;
    else document.body.style.backgroundImage="";
  },
  init() { this.apply(this.get()); }
};

// ── Roles ──────────────────────────────────────────────────────
const ROLES = {
  guest:     {id:"guest",     label:"Guest",           icon:"👤", level:0, color:"#9CA3AF"},
  user:      {id:"user",      label:"User",            icon:"🎓", level:1, color:"#2563EB"},
  creator:   {id:"creator",   label:"Creator",         icon:"✏️",  level:2, color:"#7C3AED"},
  developer: {id:"developer", label:"Developer",       icon:"🛠",  level:3, color:"#0891B2"},
  owner:     {id:"owner",     label:"Developer Owner", icon:"👑", level:4, color:"#D97706"},
};

// ── Auth System ────────────────────────────────────────────────
const Auth = {
  getUsers()   { return KS.get("users") || []; },
  saveUsers(u) { KS.set("users", u); },
  getCurrent() { return KS.get("session") || null; },
  isLoggedIn() { return !!this.getCurrent(); },
  getRoleLevel(role) { return (ROLES[role]||ROLES.guest).level; },
  hasRole(minRole) {
    const u = this.getCurrent();
    return (u ? this.getRoleLevel(u.role) : 0) >= this.getRoleLevel(minRole);
  },
  hashPass(p) {
    // Simple hash — safe for all characters
    let h = 0;
    const s = String(p);
    for(let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
    return 'h' + Math.abs(h).toString(36) + s.length.toString(36);
  },
  register(name, email, password) {
    const users = this.getUsers();
    if(users.find(u=>u.email===email)) return {ok:false, msg:"Email sudah terdaftar"};
    const isFirst = users.length === 0;
    const newUser = {
      id:"u"+Date.now(), name, email, password:this.hashPass(password),
      role: isFirst ? "owner" : "user",
      xp:0, badges:[], completedLessons:[], completedCourses:[],
      quizResults:[], gamesPlayed:0, posts:0,
      joinDate:new Date().toISOString(), avatar:""
    };
    users.push(newUser);
    this.saveUsers(users);
    const sess = {...newUser}; delete sess.password;
    KS.set("session", sess);
    return {ok:true, user:sess};
  },
  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u=>u.email===email && u.password===this.hashPass(password));
    if(!user) return {ok:false, msg:"Email atau password salah"};
    const sess = {...user}; delete sess.password;
    KS.set("session", sess);
    return {ok:true, user:sess};
  },
  logout() { KS.del("session"); window.location.href="index.html"; },
  updateSession(data) {
    const sess = this.getCurrent(); if(!sess) return;
    const updated = {...sess, ...data};
    KS.set("session", updated);
    const users = this.getUsers();
    const idx = users.findIndex(u=>u.id===sess.id);
    if(idx>=0) { users[idx]={...users[idx],...data}; this.saveUsers(users); }
    return updated;
  },
  requireAuth(redirect="login.html") {
    if(!this.isLoggedIn()) { window.location.href=redirect; return false; } return true;
  }
};

// ── XP Levels ──────────────────────────────────────────────────
const XP_LEVELS = [
  {level:1,title:"Novice", minXP:0,    maxXP:200,  color:"#9CA3AF",icon:"⭐"},
  {level:2,title:"Learner",minXP:200,  maxXP:500,  color:"#2563EB",icon:"💫"},
  {level:3,title:"Scholar",minXP:500,  maxXP:1000, color:"#10B981",icon:"🎓"},
  {level:4,title:"Expert", minXP:1000, maxXP:2000, color:"#F59E0B",icon:"🔥"},
  {level:5,title:"Master", minXP:2000, maxXP:4000, color:"#7C3AED",icon:"💜"},
  {level:6,title:"Legend", minXP:4000, maxXP:99999,color:"#EF4444",icon:"👑"},
];
function getLevel(xp) { return XP_LEVELS.findLast(l=>xp>=l.minXP)||XP_LEVELS[0]; }

// ── XP Control ─────────────────────────────────────────────────
const XPSystem = {
  logs() { return KS.get("xp_logs")||[]; },
  addLog(e) { const l=this.logs(); l.unshift(e); KS.set("xp_logs",l.slice(0,300)); },
  awardUser(userId, amount, reason, awardedBy="system") {
    const users=Auth.getUsers(); const idx=users.findIndex(u=>u.id===userId); if(idx<0) return false;
    users[idx].xp=(users[idx].xp||0)+amount; Auth.saveUsers(users);
    this.addLog({userId,userName:users[idx].name,amount,reason,awardedBy,time:new Date().toISOString()});
    const sess=Auth.getCurrent(); if(sess?.id===userId) Auth.updateSession({xp:users[idx].xp});
    return true;
  },
  awardAll(amount, reason, awardedBy="system") {
    const users=Auth.getUsers(); users.forEach(u=>{u.xp=(u.xp||0)+amount;}); Auth.saveUsers(users);
    this.addLog({userId:"all",userName:"ALL USERS",amount,reason,awardedBy,time:new Date().toISOString()});
    const sess=Auth.getCurrent(); if(sess){const u=users.find(x=>x.id===sess.id);if(u)Auth.updateSession({xp:u.xp});}
  },
  awardCurrent(amount, reason) {
    const sess=Auth.getCurrent(); if(!sess) return;
    this.awardUser(sess.id, amount, reason, sess.name);
  }
};

// ── Badges ─────────────────────────────────────────────────────
const DEFAULT_BADGES = [
  {id:"b1",name:"First Step",   icon:"👟",desc:"Selesaikan lesson pertama",   xp:50},
  {id:"b2",name:"Quiz Master",  icon:"⚡",desc:"Selesaikan quiz pertama",     xp:100},
  {id:"b3",name:"Scholar",      icon:"📚",desc:"Selesaikan 10 lesson",        xp:200},
  {id:"b4",name:"Course Hero",  icon:"🎓",desc:"Selesaikan 1 course",         xp:300},
  {id:"b5",name:"Perfect Score",icon:"💯",desc:"Nilai 100 di quiz",           xp:250},
  {id:"b6",name:"Gamer",        icon:"🎮",desc:"Mainkan 5 game",              xp:150},
  {id:"b7",name:"Academy Elite",icon:"💎",desc:"Selesaikan 3 course",         xp:500},
  {id:"b8",name:"Contributor",  icon:"✏️",desc:"Post pertama di community",   xp:80},
  {id:"b9",name:"Legend",       icon:"👑",desc:"Raih level 6",                xp:1000},
];
function checkAndAwardBadges(userId) {
  const users=Auth.getUsers(); const u=users.find(x=>x.id===userId); if(!u) return [];
  const newBadges=[];
  DEFAULT_BADGES.forEach(badge=>{
    if(u.badges?.includes(badge.id)) return;
    let earn=false;
    if(badge.id==="b1"&&(u.completedLessons?.length||0)>=1) earn=true;
    if(badge.id==="b2"&&(u.quizResults?.length||0)>=1) earn=true;
    if(badge.id==="b3"&&(u.completedLessons?.length||0)>=10) earn=true;
    if(badge.id==="b4"&&(u.completedCourses?.length||0)>=1) earn=true;
    if(badge.id==="b5"&&u.quizResults?.some(r=>r.score>=100)) earn=true;
    if(badge.id==="b6"&&(u.gamesPlayed||0)>=5) earn=true;
    if(badge.id==="b7"&&(u.completedCourses?.length||0)>=3) earn=true;
    if(badge.id==="b9"&&getLevel(u.xp||0).level>=6) earn=true;
    if(earn){u.badges=u.badges||[];u.badges.push(badge.id);u.xp=(u.xp||0)+badge.xp;newBadges.push(badge);}
  });
  if(newBadges.length>0){const idx=users.findIndex(x=>x.id===userId);users[idx]=u;Auth.saveUsers(users);const sess=Auth.getCurrent();if(sess?.id===userId)Auth.updateSession({badges:u.badges,xp:u.xp});}
  return newBadges;
}

// ── Default Courses ────────────────────────────────────────────
const DEFAULT_COURSES = [
  {id:"c1",title:"IPS Ekonomi Dasar",category:"Ekonomi",level:"Beginner",thumbnail:"",instructor:"Tim Kaizo",duration:"3 jam",description:"Pelajari dasar-dasar ilmu ekonomi: kelangkaan, permintaan, penawaran.",rating:4.8,students:234,xpReward:200,
    modules:[
      {id:"m1",title:"Pengantar Ekonomi",lessons:[
        {id:"l1",title:"Apa itu Ilmu Ekonomi?",type:"text",duration:"10 min",content:"Ilmu ekonomi adalah ilmu yang mempelajari bagaimana manusia menggunakan sumber daya terbatas.\n\n**Konsep Dasar:**\n- Kelangkaan (Scarcity)\n- Pilihan (Choice)\n- Biaya kesempatan (Opportunity Cost)"},
        {id:"l2",title:"Kebutuhan vs Keinginan",type:"text",duration:"8 min",content:"**Kebutuhan** adalah sesuatu yang harus dipenuhi.\n**Keinginan** adalah sesuatu yang diinginkan tapi tidak wajib.\n\nContoh kebutuhan: makan, pakaian, tempat tinggal."},
        {id:"l3",title:"Quiz: Pengantar",type:"quiz",duration:"5 min",content:""}
      ]},
      {id:"m2",title:"Permintaan & Penawaran",lessons:[
        {id:"l4",title:"Hukum Permintaan",type:"text",duration:"12 min",content:"**Hukum Permintaan:** Jika harga naik, jumlah yang diminta turun (ceteris paribus).\n\nFaktor: harga, pendapatan, selera, ekspektasi."},
        {id:"l5",title:"Hukum Penawaran",type:"text",duration:"12 min",content:"**Hukum Penawaran:** Jika harga naik, jumlah yang ditawarkan naik (ceteris paribus).\n\nFaktor: biaya produksi, teknologi, harga input."},
        {id:"l6",title:"Quiz: P&P",type:"quiz",duration:"5 min",content:""}
      ]}
    ]},
  {id:"c2",title:"Matematika Kelas 9",category:"Matematika",level:"Beginner",thumbnail:"",instructor:"Tim Kaizo",duration:"4 jam",description:"Kuasai aljabar, geometri, dan statistika dasar kelas 9.",rating:4.6,students:189,xpReward:250,
    modules:[
      {id:"m3",title:"Aljabar",lessons:[
        {id:"l7",title:"Persamaan Linear",type:"text",duration:"15 min",content:"**SPLDV** — bentuk ax+b=c.\n\nContoh: 2x+3=7 → x=2"},
        {id:"l8",title:"Sistem Persamaan",type:"text",duration:"15 min",content:"Metode: substitusi, eliminasi, grafik."}
      ]},
      {id:"m4",title:"Statistika",lessons:[
        {id:"l9",title:"Mean, Median, Modus",type:"text",duration:"12 min",content:"**Mean:** rata-rata. **Median:** nilai tengah. **Modus:** paling sering muncul."},
        {id:"l10",title:"Diagram & Grafik",type:"text",duration:"10 min",content:"Jenis: batang, lingkaran, garis, histogram."}
      ]}
    ]},
  {id:"c3",title:"Bahasa Indonesia Sastra",category:"Bahasa",level:"Intermediate",thumbnail:"",instructor:"Tim Kaizo",duration:"2.5 jam",description:"Analisis puisi, prosa, dan drama untuk ujian nasional.",rating:4.5,students:156,xpReward:180,
    modules:[
      {id:"m5",title:"Puisi",lessons:[
        {id:"l11",title:"Unsur Intrinsik Puisi",type:"text",duration:"12 min",content:"Tema, diksi, imaji, majas, rima, ritme, amanat."},
        {id:"l12",title:"Menganalisis Puisi",type:"text",duration:"15 min",content:"Langkah: baca → tema → majas → diksi → amanat."}
      ]},
      {id:"m6",title:"Prosa",lessons:[
        {id:"l13",title:"Unsur Intrinsik Cerpen",type:"text",duration:"12 min",content:"Tema, alur, tokoh, latar, sudut pandang, amanat."}
      ]}
    ]}
];

// ── Helpers ────────────────────────────────────────────────────
const escHtml = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const initials = n => (n||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const MEDAL = ["🥇","🥈","🥉"];
const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const CAT_ICONS = {Ekonomi:'📊',Matematika:'🧮',Bahasa:'✍️',Sains:'🔬',Sejarah:'🏛',default:'📚'};
function timeAgo(iso){const s=Math.floor((Date.now()-new Date(iso))/1000);if(s<60)return"baru saja";if(s<3600)return Math.floor(s/60)+"m lalu";if(s<86400)return Math.floor(s/3600)+"j lalu";return Math.floor(s/86400)+"h lalu";}
function getCourses() { return KS.get("courses") || DEFAULT_COURSES; }
function getCourseProgress(courseId) {
  const user = Auth.getCurrent(); if(!user) return 0;
  const fullUser = Auth.getUsers().find(u=>u.id===user.id) || user;
  const course = getCourses().find(c=>c.id===courseId); if(!course) return 0;
  const all = course.modules.flatMap(m=>m.lessons); if(!all.length) return 0;
  const done = all.filter(l=>(fullUser.completedLessons||[]).includes(`${courseId}:${l.id}`)).length;
  return Math.round(done/all.length*100);
}
function markdownToHtml(text) {
  return (text||'')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/^### (.+)$/gm,'<h3 style="margin:20px 0 8px;font-size:1rem;font-weight:700">$1</h3>')
    .replace(/^## (.+)$/gm,'<h2 style="margin:24px 0 10px;font-size:1.1rem;font-weight:700">$1</h2>')
    .replace(/^- (.+)$/gm,'<li style="margin-bottom:5px">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g,m=>`<ul style="padding-left:20px;margin:10px 0">${m}</ul>`)
    .replace(/\n\n/g,'</p><p style="margin-bottom:12px">')
    .replace(/\n/g,'<br>');
}

// ── SHARED CSS (White Minimal) ─────────────────────────────────
const SHARED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
:root{
  --c-primary:#2563EB;--c-bg:#FFFFFF;--c-bg2:#F8FAFC;
  --c-text:#111827;--c-text-sub:#6B7280;--c-border:#E5E7EB;
  --c-card:#FFFFFF;--c-success:#10B981;--c-danger:#EF4444;--c-warning:#F59E0B;
  --font-main:'Inter',system-ui,sans-serif;--font-size:16px;
  --radius-card:16px;--radius-btn:10px;
  --shadow-sm:0 1px 3px rgba(0,0,0,0.06);
  --shadow:0 4px 6px rgba(0,0,0,0.07),0 2px 4px rgba(0,0,0,0.05);
  --shadow-lg:0 10px 25px rgba(0,0,0,0.12),0 4px 10px rgba(0,0,0,0.06);
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;font-size:var(--font-size)}
body{font-family:var(--font-main);background:var(--c-bg);color:var(--c-text);min-height:100vh;-webkit-font-smoothing:antialiased}
/* NAVBAR */
.navbar{position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-bottom:1px solid var(--c-border)}
.navbar-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;height:64px;padding:0 24px;gap:8px}
.nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0}
.nav-logo-box{width:34px;height:34px;background:var(--c-primary);border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.9rem;color:#fff}
.nav-logo-text{font-weight:800;font-size:.88rem;color:var(--c-text);line-height:1.1}
.nav-logo-sub{font-size:.65rem;color:var(--c-text-sub)}
.nav-links{display:flex;gap:2px;margin-left:12px}
.nav-link{padding:7px 13px;border-radius:8px;text-decoration:none;font-size:.85rem;font-weight:500;color:var(--c-text-sub);transition:.18s;white-space:nowrap}
.nav-link:hover{color:var(--c-text);background:var(--c-bg2)}
.nav-link.active{color:var(--c-primary);background:#EFF6FF;font-weight:600}
.nav-sp{flex:1}
.nav-user{display:flex;align-items:center;gap:8px}
.nav-xp-pill{display:flex;align-items:center;gap:5px;padding:5px 12px;background:#EFF6FF;border-radius:999px;font-size:.78rem;font-weight:600;color:var(--c-primary);text-decoration:none;transition:.18s}
.nav-xp-pill:hover{background:#DBEAFE}
.nav-avatar{width:34px;height:34px;border-radius:50%;background:var(--c-primary);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:#fff;text-decoration:none;overflow:hidden;flex-shrink:0}
.nav-avatar img{width:100%;height:100%;object-fit:cover}
/* ROLE BADGE */
.role-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:.7rem;font-weight:600}
/* LAYOUT */
.page-wrap{max-width:1200px;margin:0 auto;padding:40px 24px 80px}
.page-wrap-sm{max-width:860px;margin:0 auto;padding:40px 24px 80px}
.page-wrap-md{max-width:1000px;margin:0 auto;padding:40px 24px 80px}
/* CARDS */
.card{background:var(--c-card);border:1px solid var(--c-border);border-radius:var(--radius-card);padding:24px;box-shadow:var(--shadow-sm)}
.card-hover{transition:all .22s;cursor:pointer}
.card-hover:hover{box-shadow:var(--shadow-lg);transform:translateY(-2px);border-color:#D1D5DB}
/* GRID */
.grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.grid-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
.grid-auto-sm{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
/* BUTTONS */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 20px;border-radius:var(--radius-btn);font-family:var(--font-main);font-size:.85rem;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .18s;text-decoration:none;white-space:nowrap}
.btn:disabled{opacity:.45;cursor:not-allowed;pointer-events:none}
.btn-primary{background:var(--c-primary);color:#fff;border-color:var(--c-primary)}
.btn-primary:hover{background:#1D4ED8;box-shadow:0 4px 12px rgba(37,99,235,0.3)}
.btn-ghost{background:transparent;border-color:var(--c-border);color:var(--c-text-sub)}
.btn-ghost:hover{background:var(--c-bg2);color:var(--c-text);border-color:#D1D5DB}
.btn-danger{background:#FEF2F2;border-color:#FECACA;color:#DC2626}
.btn-danger:hover{background:#FEE2E2}
.btn-success{background:#ECFDF5;border-color:#A7F3D0;color:#059669}
.btn-outline{background:transparent;border-color:var(--c-primary);color:var(--c-primary)}
.btn-outline:hover{background:#EFF6FF}
.btn-full{width:100%}
.btn-xl{padding:13px 28px;font-size:.95rem;border-radius:12px}
.btn-sm{padding:6px 14px;font-size:.78rem;border-radius:8px}
.btn-xs{padding:4px 10px;font-size:.72rem;border-radius:6px}
/* FORMS */
.flabel{display:block;font-size:.82rem;font-weight:600;color:var(--c-text);margin-bottom:6px}
.finput,.fselect,.ftextarea{width:100%;padding:10px 14px;background:var(--c-bg);border:1px solid var(--c-border);border-radius:10px;font-size:.9rem;color:var(--c-text);outline:none;transition:.18s;font-family:var(--font-main)}
.finput:focus,.fselect:focus,.ftextarea:focus{border-color:var(--c-primary);box-shadow:0 0 0 3px rgba(37,99,235,0.1)}
.finput.err{border-color:var(--c-danger);box-shadow:0 0 0 3px rgba(239,68,68,0.1)}
.ftextarea{resize:vertical;min-height:80px}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.fgroup{margin-bottom:16px}
.fhint{font-size:.75rem;color:var(--c-text-sub);margin-top:5px}
/* CHIPS */
.chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:.75rem;font-weight:600}
.chip-blue{background:#EFF6FF;color:#1D4ED8}
.chip-green{background:#ECFDF5;color:#059669}
.chip-red{background:#FEF2F2;color:#DC2626}
.chip-purple{background:#F5F3FF;color:#6D28D9}
.chip-yellow{background:#FFFBEB;color:#D97706}
.chip-gray{background:#F3F4F6;color:#6B7280}
.chip-owner{background:#FFFBEB;color:#D97706}
.chip-developer{background:#ECFEFF;color:#0891B2}
.chip-creator{background:#F5F3FF;color:#7C3AED}
.chip-user{background:#EFF6FF;color:#2563EB}
/* PROGRESS */
.prog{height:6px;background:#E5E7EB;border-radius:999px;overflow:hidden}
.progf{height:100%;background:var(--c-primary);border-radius:999px;transition:width .4s ease}
/* XP */
.xp-bar-bg{height:8px;background:#E5E7EB;border-radius:999px;overflow:hidden}
.xp-bar-fill{height:100%;border-radius:999px;transition:width .5s ease}
/* TABS */
.tabs{display:flex;gap:2px;background:var(--c-bg2);border-radius:12px;padding:4px;margin-bottom:24px;border:1px solid var(--c-border)}
.tab{flex:1;padding:8px 12px;border:none;background:transparent;border-radius:8px;font-size:.82rem;font-weight:500;cursor:pointer;color:var(--c-text-sub);transition:.18s;font-family:var(--font-main)}
.tab:hover{color:var(--c-text);background:rgba(0,0,0,0.03)}
.tab.on{background:var(--c-card);color:var(--c-primary);font-weight:600;box-shadow:var(--shadow-sm)}
/* MODAL */
.ov{position:fixed;inset:0;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:var(--c-card);border-radius:20px;padding:32px;max-width:440px;width:100%;box-shadow:var(--shadow-lg),0 0 0 1px var(--c-border);animation:modal-in .22s ease;max-height:90vh;overflow-y:auto}
@keyframes modal-in{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}
/* SECTION */
.section-label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--c-primary);margin-bottom:8px}
.section-title{font-size:1.6rem;font-weight:800;letter-spacing:-.5px;color:var(--c-text);margin-bottom:8px;line-height:1.2}
.section-sub{font-size:.95rem;color:var(--c-text-sub);line-height:1.7;margin-bottom:28px}
/* COURSE CARD */
.course-card{background:var(--c-card);border:1px solid var(--c-border);border-radius:var(--radius-card);overflow:hidden;transition:all .22s;cursor:pointer;text-decoration:none;display:block;box-shadow:var(--shadow-sm)}
.course-card:hover{box-shadow:var(--shadow-lg);transform:translateY(-3px);border-color:#D1D5DB}
.course-thumb{height:140px;background:linear-gradient(135deg,#EFF6FF,#DBEAFE);display:flex;align-items:center;justify-content:center;font-size:3rem;overflow:hidden}
.course-thumb img{width:100%;height:100%;object-fit:cover}
.course-body{padding:18px}
.course-cat{font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--c-primary);margin-bottom:6px}
.course-title{font-size:.92rem;font-weight:700;color:var(--c-text);margin-bottom:8px;line-height:1.4}
.course-level{padding:2px 9px;border-radius:999px;font-size:.7rem;font-weight:600}
.level-beginner{background:#ECFDF5;color:#059669}
.level-intermediate{background:#FFFBEB;color:#D97706}
.level-advanced{background:#FEF2F2;color:#DC2626}
/* GAME CARD */
.game-card{background:var(--c-card);border:1px solid var(--c-border);border-radius:var(--radius-card);padding:22px;cursor:pointer;transition:all .22s;text-decoration:none;display:block;box-shadow:var(--shadow-sm);position:relative;overflow:hidden}
.game-card:hover{box-shadow:var(--shadow-lg);transform:translateY(-3px);border-color:#D1D5DB}
.game-card-top{position:absolute;top:0;left:0;right:0;height:4px}
/* COMMUNITY */
.post-card{background:var(--c-card);border:1px solid var(--c-border);border-radius:var(--radius-card);padding:20px;margin-bottom:12px;transition:box-shadow .18s}
.post-card:hover{box-shadow:var(--shadow)}
/* STAT */
.stat-card{background:var(--c-card);border:1px solid var(--c-border);border-radius:var(--radius-card);padding:20px;box-shadow:var(--shadow-sm)}
/* MISC */
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.sp{flex:1}.tc{text-align:center}
.divider{height:1px;background:var(--c-border);margin:20px 0}
.h1{font-size:1.8rem;font-weight:800;letter-spacing:-.5px;color:var(--c-text)}
.h2{font-size:1.15rem;font-weight:700;color:var(--c-text)}
.h3{font-size:.95rem;font-weight:600;color:var(--c-text)}
.sub{font-size:.9rem;color:var(--c-text-sub);line-height:1.7}
.muted{color:var(--c-text-sub);font-size:.85rem}
/* ANIMS */
@keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
.fadein{animation:fadein .35s ease both}
.fadein-d1{animation-delay:.06s}.fadein-d2{animation-delay:.12s}.fadein-d3{animation-delay:.18s}.fadein-d4{animation-delay:.24s}
.shake{animation:shake .35s ease}
/* TOAST */
.toast{position:fixed;bottom:24px;right:24px;z-index:9999;background:#111827;color:#fff;border-radius:12px;padding:13px 18px;display:flex;align-items:center;gap:10px;box-shadow:var(--shadow-lg);animation:fadein .3s ease;max-width:320px;font-size:.88rem;font-weight:500}
/* SCROLLBAR */
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:999px}
/* RESPONSIVE */
@media(max-width:768px){.grid-3,.grid-4{grid-template-columns:repeat(2,1fr)}.grid-2{grid-template-columns:1fr}.nav-links{display:none}.page-wrap,.page-wrap-sm,.page-wrap-md{padding:24px 16px 60px}.frow{grid-template-columns:1fr}.section-title{font-size:1.3rem}}
@media(max-width:480px){.grid-3,.grid-4,.grid-2,.grid-auto{grid-template-columns:1fr}}
`;

// ── Navbar ─────────────────────────────────────────────────────
function renderNavbar(activePage) {
  const theme=Theme.get(); const user=Auth.getCurrent();
  const logoText=theme.academyName||"KAIZO ACADEMIC";
  const links=(theme.navItems||DEFAULT_THEME.navItems).map(item=>
    `<a href="${item.href}" class="nav-link${item.href===activePage?' active':''}">${item.icon||''} ${item.label}</a>`
  ).join('');
  const role = user ? ROLES[user.role]||ROLES.user : null;
  const userArea = user
    ? `<div class="nav-user">
        <a href="leaderboard.html" class="nav-xp-pill">⚡ ${(user.xp||0).toLocaleString()} XP</a>
        <a href="leaderboard.html" class="nav-avatar" title="${escHtml(user.name)}">
          ${user.avatar?`<img src="${user.avatar}">`:`${initials(user.name)}`}
        </a>
        <button class="btn btn-ghost btn-sm" onclick="Auth.logout()">Keluar</button>
      </div>`
    : `<div class="nav-user">
        <a href="login.html" class="btn btn-ghost btn-sm">Masuk</a>
        <a href="register.html" class="btn btn-primary btn-sm">Daftar</a>
      </div>`;
  return `<nav class="navbar">
    <div class="navbar-inner">
      <a href="index.html" class="nav-logo">
        ${theme.logoUrl?`<img src="${theme.logoUrl}" style="width:34px;height:34px;border-radius:9px;object-fit:contain">`
          :`<div class="nav-logo-box">${logoText.charAt(0)}</div>`}
        <div><div class="nav-logo-text">${escHtml(logoText)}</div>
        <div class="nav-logo-sub">${escHtml(theme.academyTagline||'Learn · Play · Grow')}</div></div>
      </a>
      <div class="nav-links">${links}</div>
      <div class="nav-sp"></div>
      ${userArea}
      ${Auth.hasRole('developer')?`<a href="developer.html" class="btn btn-ghost btn-sm" style="margin-left:2px">⚙️</a>`:''}
    </div>
  </nav>`;
}

// ── Toast ──────────────────────────────────────────────────────
function showToast(msg, icon="✓", duration=3000) {
  const el=document.createElement('div'); el.className='toast';
  el.innerHTML=`<span style="font-size:1.1rem">${icon}</span><span>${escHtml(msg)}</span>`;
  document.body.appendChild(el);
  setTimeout(()=>{el.style.transition='.3s';el.style.opacity='0';},duration-300);
  setTimeout(()=>el.remove(),duration);
}

document.addEventListener('DOMContentLoaded',()=>{ Theme.init(); });

// ── Community ──────────────────────────────────────────────────
function getPosts() { return KS.get("posts") || []; }
function savePosts(p) { KS.set("posts", p); }

// ── Leaderboard ────────────────────────────────────────────────
function getLeaderboard() {
  return [...Auth.getUsers()].sort((a,b)=>(b.xp||0)-(a.xp||0));
}
