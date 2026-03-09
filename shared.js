// ═══════════════════════════════════════════════
// KAIZO ACADEMY — SHARED UTILITIES v3.0
// ═══════════════════════════════════════════════

const SUPABASE_URL = "https://kjcifrrkfpifdrwjufau.supabase.co";
const SUPABASE_KEY = "sb_publishable_8sk82afIl_YihEiIFkvCwQ_LDz1I5C6";
const ADMIN_PASS = "Kaizzo24$";
const APP_VERSION = "3.0";

// ── Storage (localStorage with namespace) ──────────────────────────────────
const KS = {
  get(key) { try { const v=localStorage.getItem("kaizo:"+key); return v?JSON.parse(v):null; } catch{return null;} },
  set(key,val) { try { localStorage.setItem("kaizo:"+key,JSON.stringify(val)); return true; } catch{return false;} },
  del(key) { localStorage.removeItem("kaizo:"+key); },
  keys(prefix="") {
    const out=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k&&k.startsWith("kaizo:"+prefix)) out.push(k.replace("kaizo:",""));
    }
    return out;
  }
};

// ── Default Theme ──────────────────────────────────────────────────────────
const DEFAULT_THEME = {
  bgColor1: "#020408", bgColor2: "#060d1a",
  accentColor: "#00c8ff", accent2Color: "#b000ff",
  textColor: "#e8f4ff", font: "Orbitron",
  fontSize: "medium", logoUrl: "", bgImageUrl: "",
  academyName: "KAIZO ACADEMIC", academyTagline: "Level Up Your Knowledge",
  navItems: [
    {label:"Home", icon:"🏠", href:"index.html"},
    {label:"Courses", icon:"🎓", href:"courses.html"},
    {label:"Leaderboard", icon:"🏆", href:"leaderboard.html"},
    {label:"Quiz", icon:"⚡", href:"quiz.html"},
  ],
  features: { community:true, certificates:true, gamification:true, darkMode:true }
};

// ── Default Courses ────────────────────────────────────────────────────────
const DEFAULT_COURSES = [
  {
    id:"c1", title:"IPS Ekonomi Dasar", category:"Ekonomi", level:"Beginner",
    thumbnail:"", instructor:"Tim Kaizo", duration:"3 jam", totalLessons:6,
    description:"Pelajari dasar-dasar ilmu ekonomi: kelangkaan, permintaan, penawaran, dan sistem perekonomian.",
    rating:4.8, students:234, xpReward:200,
    modules:[
      { id:"m1", title:"Pengantar Ekonomi", lessons:[
        {id:"l1",title:"Apa itu Ilmu Ekonomi?",type:"text",duration:"10 min",content:"Ilmu ekonomi adalah ilmu yang mempelajari bagaimana manusia menggunakan sumber daya yang terbatas untuk memenuhi kebutuhan yang tidak terbatas.\n\n**Konsep Dasar:**\n- Kelangkaan (Scarcity)\n- Pilihan (Choice)\n- Biaya kesempatan (Opportunity Cost)\n\nSetiap keputusan ekonomi melibatkan trade-off antara pilihan satu dengan pilihan lainnya."},
        {id:"l2",title:"Kebutuhan vs Keinginan",type:"text",duration:"8 min",content:"**Kebutuhan** adalah sesuatu yang harus dipenuhi agar manusia dapat bertahan hidup.\n\n**Keinginan** adalah sesuatu yang ingin dimiliki tetapi tidak wajib dipenuhi.\n\nContoh:\n- Kebutuhan: makan, minum, pakaian, tempat tinggal\n- Keinginan: HP terbaru, mobil mewah, liburan ke luar negeri"},
        {id:"l3",title:"Quiz: Pengantar Ekonomi",type:"quiz",duration:"5 min",quizId:"q_ekonomi"}
      ]},
      { id:"m2", title:"Permintaan & Penawaran", lessons:[
        {id:"l4",title:"Hukum Permintaan",type:"text",duration:"12 min",content:"**Hukum Permintaan:** Jika harga suatu barang naik, maka jumlah yang diminta akan turun (ceteris paribus).\n\n**Faktor yang mempengaruhi permintaan:**\n1. Harga barang\n2. Pendapatan konsumen\n3. Selera\n4. Harga barang lain\n5. Ekspektasi"},
        {id:"l5",title:"Hukum Penawaran",type:"text",duration:"12 min",content:"**Hukum Penawaran:** Jika harga suatu barang naik, maka jumlah yang ditawarkan akan naik (ceteris paribus).\n\n**Faktor yang mempengaruhi penawaran:**\n1. Harga barang\n2. Biaya produksi\n3. Teknologi\n4. Harga input\n5. Ekspektasi produsen"},
        {id:"l6",title:"Quiz: Permintaan & Penawaran",type:"quiz",duration:"5 min",quizId:"q_ekonomi"}
      ]}
    ]
  },
  {
    id:"c2", title:"Matematika Dasar Kelas 9", category:"Matematika", level:"Beginner",
    thumbnail:"", instructor:"Tim Kaizo", duration:"4 jam", totalLessons:8,
    description:"Kuasai konsep matematika kelas 9: aljabar, geometri, dan statistika dasar.",
    rating:4.6, students:189, xpReward:250,
    modules:[
      { id:"m3", title:"Aljabar", lessons:[
        {id:"l7",title:"Persamaan Linear",type:"text",duration:"15 min",content:"**Persamaan Linear Satu Variabel** adalah persamaan yang memuat satu variabel dengan pangkat tertinggi 1.\n\nBentuk umum: **ax + b = c**\n\nContoh:\n- 2x + 3 = 7 → 2x = 4 → x = 2\n- 3x - 6 = 9 → 3x = 15 → x = 5"},
        {id:"l8",title:"Sistem Persamaan",type:"text",duration:"15 min",content:"**Sistem Persamaan Linear Dua Variabel (SPLDV)**\n\nMetode penyelesaian:\n1. **Substitusi** - ganti satu variabel\n2. **Eliminasi** - hilangkan satu variabel\n3. **Grafik** - titik potong dua garis"}
      ]},
      { id:"m4", title:"Statistika", lessons:[
        {id:"l9",title:"Mean, Median, Modus",type:"text",duration:"12 min",content:"**Mean (Rata-rata):** jumlah data dibagi banyak data\n\n**Median:** nilai tengah data yang sudah diurutkan\n\n**Modus:** nilai yang paling sering muncul\n\nContoh data: 3, 5, 7, 5, 9\n- Mean = (3+5+7+5+9)/5 = 29/5 = 5,8\n- Median = 5 (urutan: 3,5,5,7,9)\n- Modus = 5"},
        {id:"l10",title:"Diagram & Grafik",type:"text",duration:"10 min",content:"Jenis-jenis diagram:\n\n1. **Diagram Batang** - membandingkan data\n2. **Diagram Lingkaran** - menampilkan proporsi\n3. **Diagram Garis** - menampilkan perubahan\n4. **Histogram** - distribusi frekuensi"}
      ]}
    ]
  },
  {
    id:"c3", title:"Bahasa Indonesia Sastra", category:"Bahasa", level:"Intermediate",
    thumbnail:"", instructor:"Tim Kaizo", duration:"2.5 jam", totalLessons:5,
    description:"Pelajari analisis karya sastra: puisi, prosa, dan drama untuk ujian nasional.",
    rating:4.5, students:156, xpReward:180,
    modules:[
      { id:"m5", title:"Puisi", lessons:[
        {id:"l11",title:"Unsur Intrinsik Puisi",type:"text",duration:"12 min",content:"**Unsur Intrinsik Puisi:**\n\n1. **Tema** - gagasan pokok puisi\n2. **Diksi** - pilihan kata\n3. **Imaji** - gambaran yang ditimbulkan kata\n4. **Majas** - gaya bahasa\n5. **Rima** - persamaan bunyi\n6. **Ritme** - irama\n7. **Amanat** - pesan moral"},
        {id:"l12",title:"Menganalisis Puisi",type:"text",duration:"15 min",content:"Langkah menganalisis puisi:\n\n1. Baca puisi dengan seksama\n2. Tentukan tema utama\n3. Identifikasi majas yang digunakan\n4. Analisis diksi dan citraan\n5. Temukan amanat/pesan\n\n**Tips:** Perhatikan kata-kata yang diulang — biasanya itu penekanan tema."}
      ]},
      { id:"m6", title:"Prosa", lessons:[
        {id:"l13",title:"Unsur Intrinsik Cerpen",type:"text",duration:"12 min",content:"**Unsur Intrinsik Cerpen:**\n\n1. **Tema**\n2. **Alur** (plot) - maju, mundur, campuran\n3. **Tokoh & Penokohan**\n4. **Latar** (setting) - tempat, waktu, suasana\n5. **Sudut Pandang**\n6. **Amanat**"}
      ]}
    ]
  }
];

// ── Default Badges ─────────────────────────────────────────────────────────
const DEFAULT_BADGES = [
  {id:"b1", name:"First Step", icon:"👟", desc:"Selesaikan lesson pertama", condition:"lessons_completed >= 1", xp:50},
  {id:"b2", name:"Quiz Master", icon:"⚡", desc:"Selesaikan quiz pertama", condition:"quizzes_done >= 1", xp:100},
  {id:"b3", name:"Scholar", icon:"📚", desc:"Selesaikan 10 lesson", condition:"lessons_completed >= 10", xp:200},
  {id:"b4", name:"Course Finisher", icon:"🎓", desc:"Selesaikan 1 course", condition:"courses_completed >= 1", xp:300},
  {id:"b5", name:"Top Scorer", icon:"🏆", desc:"Raih nilai 100 di quiz", condition:"perfect_quiz >= 1", xp:250},
  {id:"b6", name:"Dedicated", icon:"🔥", desc:"Belajar 7 hari berturut-turut", condition:"streak >= 7", xp:400},
  {id:"b7", name:"Academy Elite", icon:"💎", desc:"Selesaikan 3 course", condition:"courses_completed >= 3", xp:500},
  {id:"b8", name:"Speedrunner", icon:"⚡", desc:"Selesaikan quiz dalam 5 menit", condition:"fast_quiz >= 1", xp:150},
];

// ── XP Levels ──────────────────────────────────────────────────────────────
const XP_LEVELS = [
  {level:1, title:"Novice", minXP:0, maxXP:200, color:"#9496b0"},
  {level:2, title:"Learner", minXP:200, maxXP:500, color:"#00c8ff"},
  {level:3, title:"Scholar", minXP:500, maxXP:1000, color:"#00ff9d"},
  {level:4, title:"Expert", minXP:1000, maxXP:2000, color:"#ff8c00"},
  {level:5, title:"Master", minXP:2000, maxXP:4000, color:"#b000ff"},
  {level:6, title:"Legend", minXP:4000, maxXP:99999, color:"#ff003c"},
];

function getLevel(xp) {
  return XP_LEVELS.findLast(l => xp >= l.minXP) || XP_LEVELS[0];
}

// ── User Progress ──────────────────────────────────────────────────────────
const UserData = {
  get() {
    return KS.get("user") || {
      name:"", email:"", xp:0, completedLessons:[], completedCourses:[],
      quizResults:[], badges:[], streak:0, lastLogin:"", joinDate: new Date().toISOString()
    };
  },
  set(data) { KS.set("user", data); },
  addXP(amount, reason="") {
    const u = this.get();
    u.xp = (u.xp||0) + amount;
    this.set(u);
    this.checkBadges();
    return u.xp;
  },
  completeLesson(courseId, lessonId) {
    const u = this.get();
    const key = `${courseId}:${lessonId}`;
    if(!u.completedLessons.includes(key)) {
      u.completedLessons.push(key);
      u.xp = (u.xp||0) + 10;
      this.set(u);
      this.checkBadges();
    }
  },
  completeCourse(courseId) {
    const u = this.get();
    if(!u.completedCourses.includes(courseId)) {
      u.completedCourses.push(courseId);
      const course = DEFAULT_COURSES.find(c=>c.id===courseId);
      u.xp = (u.xp||0) + (course?.xpReward||200);
      this.set(u);
      this.checkBadges();
    }
  },
  getCourseProgress(courseId) {
    const u = this.get();
    const course = DEFAULT_COURSES.find(c=>c.id===courseId);
    if(!course) return 0;
    const totalLessons = course.modules.flatMap(m=>m.lessons).length;
    const done = course.modules.flatMap(m=>m.lessons).filter(l=>u.completedLessons.includes(`${courseId}:${l.id}`)).length;
    return totalLessons > 0 ? Math.round(done/totalLessons*100) : 0;
  },
  checkBadges() {
    const u = this.get();
    const lessonsCount = u.completedLessons.length;
    const coursesCount = u.completedCourses.length;
    const quizDone = u.quizResults.length;
    const perfectQuiz = u.quizResults.filter(r=>r.score>=100).length;

    DEFAULT_BADGES.forEach(badge => {
      if(u.badges.includes(badge.id)) return;
      let earn = false;
      if(badge.id==="b1" && lessonsCount>=1) earn=true;
      if(badge.id==="b2" && quizDone>=1) earn=true;
      if(badge.id==="b3" && lessonsCount>=10) earn=true;
      if(badge.id==="b4" && coursesCount>=1) earn=true;
      if(badge.id==="b5" && perfectQuiz>=1) earn=true;
      if(badge.id==="b7" && coursesCount>=3) earn=true;
      if(earn) { u.badges.push(badge.id); u.xp=(u.xp||0)+badge.xp; }
    });
    this.set(u);
  }
};

// ── Theme ──────────────────────────────────────────────────────────────────
const Theme = {
  get() { return KS.get("theme") || DEFAULT_THEME; },
  set(t) { KS.set("theme", t); this.apply(t); },
  apply(t) {
    const r = document.documentElement.style;
    if(t.accentColor) r.setProperty('--neon-blue', t.accentColor);
    if(t.accent2Color) r.setProperty('--neon-purple', t.accent2Color);
    if(t.textColor) r.setProperty('--text-primary', t.textColor);
    if(t.bgColor1) { r.setProperty('--bg-primary', t.bgColor1); document.body.style.background=t.bgColor1; }
    if(t.bgColor2) r.setProperty('--bg-secondary', t.bgColor2);
    if(t.font) r.setProperty('--font-display', `'${t.font}', monospace`);
    const sizeMap={small:"14px",medium:"16px",large:"18px",xlarge:"20px"};
    document.documentElement.style.fontSize=sizeMap[t.fontSize||"medium"]||"16px";
    if(t.bgImageUrl) document.body.style.backgroundImage=`url(${t.bgImageUrl})`;
    else document.body.style.backgroundImage="";
  },
  init() { this.apply(this.get()); }
};

// ── Leaderboard ────────────────────────────────────────────────────────────
const Leaderboard = {
  getAll() {
    const keys = KS.keys("lb:");
    return keys.map(k=>KS.get(k)).filter(Boolean).sort((a,b)=>b.xp-a.xp||(b.score||0)-(a.score||0));
  },
  save(entry) { KS.set(`lb:${entry.email}`, entry); }
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const initials = n => (n||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const MEDAL = ["🥇","🥈","🥉"];
const LEVEL_COLORS = ["#9496b0","#00c8ff","#00ff9d","#ff8c00","#b000ff","#ff003c"];

// ── Shared CSS ─────────────────────────────────────────────────────────────
const SHARED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

:root {
  --bg-primary:#020408; --bg-secondary:#060d1a;
  --bg-card:rgba(6,18,40,0.75); --bg-glass:rgba(0,200,255,0.04);
  --neon-blue:#00c8ff; --neon-purple:#b000ff; --neon-green:#00ff9d;
  --neon-red:#ff003c; --neon-orange:#ff8c00; --neon-yellow:#ffe000;
  --text-primary:#e8f4ff; --text-secondary:#7090b0; --text-muted:#3a5070;
  --border-dim:rgba(0,200,255,0.1); --border-glow:rgba(0,200,255,0.4);
  --shadow-neon:0 0 20px rgba(0,200,255,0.15),0 0 60px rgba(0,200,255,0.05);
  --shadow-card:0 8px 32px rgba(0,0,0,0.6),0 0 0 1px rgba(0,200,255,0.06);
  --font-display:'Orbitron',monospace; --font-body:'Rajdhani',sans-serif; --font-mono:'DM Mono',monospace;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--font-body);background:var(--bg-primary);color:var(--text-primary);min-height:100vh;overflow-x:hidden;user-select:none}

/* BG */
.bg-grid{position:fixed;inset:0;z-index:0;background-image:linear-gradient(rgba(0,200,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.02) 1px,transparent 1px);background-size:60px 60px;animation:bgscroll 25s linear infinite;pointer-events:none}
.bg-orb{position:fixed;border-radius:50%;pointer-events:none;z-index:0;filter:blur(100px);animation:orbpulse 8s ease-in-out infinite alternate}
.bg-orb-1{width:600px;height:600px;background:radial-gradient(circle,rgba(0,200,255,0.07),transparent 70%);top:-200px;right:-100px}
.bg-orb-2{width:500px;height:500px;background:radial-gradient(circle,rgba(176,0,255,0.05),transparent 70%);bottom:-100px;left:-100px;animation-delay:-4s}
.scanlines{position:fixed;inset:0;z-index:1;pointer-events:none;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px)}
@keyframes bgscroll{from{background-position:0 0}to{background-position:60px 60px}}
@keyframes orbpulse{from{opacity:.5;transform:scale(1)}to{opacity:1;transform:scale(1.1)}}

/* NAVBAR */
.navbar{position:sticky;top:0;z-index:100;background:rgba(2,4,8,0.85);backdrop-filter:blur(20px);border-bottom:1px solid var(--border-dim);padding:0 24px}
.navbar-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:16px;height:64px}
.nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0}
.nav-logo-box{width:36px;height:36px;background:linear-gradient(135deg,var(--neon-blue),var(--neon-purple));border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:.8rem;font-weight:900;color:#fff;box-shadow:0 0 15px rgba(0,200,255,0.35);flex-shrink:0}
.nav-logo-text{font-family:var(--font-display);font-size:.75rem;font-weight:800;letter-spacing:2px;color:var(--text-primary);line-height:1}
.nav-logo-sub{font-size:.5rem;color:var(--neon-blue);letter-spacing:2px;font-weight:600}
.nav-links{display:flex;align-items:center;gap:4px;margin-left:16px}
.nav-link{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;text-decoration:none;font-family:var(--font-display);font-size:.6rem;font-weight:700;letter-spacing:1px;color:var(--text-muted);transition:.2s;white-space:nowrap}
.nav-link:hover{color:var(--neon-blue);background:rgba(0,200,255,0.07)}
.nav-link.active{color:var(--neon-blue);background:rgba(0,200,255,0.1);border:1px solid rgba(0,200,255,0.2)}
.nav-sp{flex:1}
.nav-xp{display:flex;align-items:center;gap:8px;padding:6px 14px;background:rgba(0,200,255,0.06);border:1px solid rgba(0,200,255,0.15);border-radius:999px;font-family:var(--font-display);font-size:.62rem;letter-spacing:1px;cursor:pointer;transition:.2s}
.nav-xp:hover{border-color:rgba(0,200,255,0.35);background:rgba(0,200,255,0.1)}
.nav-xp-val{font-weight:800;color:var(--neon-blue)}
.nav-avatar{width:34px;height:34px;background:linear-gradient(135deg,var(--neon-blue),var(--neon-purple));border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:.7rem;font-weight:900;color:#fff;cursor:pointer;box-shadow:0 0 10px rgba(0,200,255,0.3)}

/* LAYOUT */
.page-wrap{max-width:1100px;margin:0 auto;padding:40px 24px 80px;position:relative;z-index:2}
.page-wrap-sm{max-width:860px;margin:0 auto;padding:40px 20px 80px;position:relative;z-index:2}

/* CARDS */
.card{background:var(--bg-card);backdrop-filter:blur(20px);border:1px solid var(--border-dim);border-radius:16px;padding:24px;margin-bottom:16px;position:relative;overflow:hidden;box-shadow:var(--shadow-card);transition:border-color .3s,box-shadow .3s}
.card:hover{border-color:rgba(0,200,255,0.2);box-shadow:var(--shadow-neon),var(--shadow-card)}
.card-glow{border-color:rgba(0,200,255,0.2);box-shadow:var(--shadow-neon),var(--shadow-card)}
.card::before{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(0,200,255,0.025) 0%,transparent 60%);pointer-events:none}

/* GRID */
.grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.grid-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}

/* COURSE CARD */
.course-card{background:var(--bg-card);backdrop-filter:blur(20px);border:1px solid var(--border-dim);border-radius:16px;overflow:hidden;transition:all .3s;cursor:pointer;text-decoration:none;display:block;position:relative}
.course-card:hover{border-color:rgba(0,200,255,0.3);transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,0.5),var(--shadow-neon)}
.course-thumb{height:140px;background:linear-gradient(135deg,rgba(0,200,255,0.15),rgba(176,0,255,0.15));display:flex;align-items:center;justify-content:center;font-size:3rem;position:relative;overflow:hidden}
.course-thumb::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,200,255,0.08),rgba(176,0,255,0.08));animation:shimmer 3s ease-in-out infinite alternate}
@keyframes shimmer{from{opacity:.5}to{opacity:1}}
.course-thumb img{width:100%;height:100%;object-fit:cover}
.course-body{padding:18px}
.course-cat{font-family:var(--font-display);font-size:.55rem;letter-spacing:2px;text-transform:uppercase;color:var(--neon-blue);margin-bottom:7px}
.course-title{font-family:var(--font-display);font-size:.82rem;font-weight:700;letter-spacing:.5px;color:var(--text-primary);margin-bottom:8px;line-height:1.4}
.course-meta{display:flex;align-items:center;gap:10px;font-size:.73rem;color:var(--text-muted);flex-wrap:wrap}
.course-level{padding:2px 9px;border-radius:999px;font-family:var(--font-display);font-size:.55rem;font-weight:700;letter-spacing:1px}
.level-beginner{background:rgba(0,255,157,0.1);color:var(--neon-green);border:1px solid rgba(0,255,157,0.2)}
.level-intermediate{background:rgba(255,140,0,0.1);color:var(--neon-orange);border:1px solid rgba(255,140,0,0.2)}
.level-advanced{background:rgba(255,0,60,0.1);color:var(--neon-red);border:1px solid rgba(255,0,60,0.2)}
.course-progress-bar{height:3px;background:rgba(0,200,255,0.1);border-radius:999px;margin-top:12px;overflow:hidden}
.course-progress-fill{height:100%;background:linear-gradient(90deg,var(--neon-blue),var(--neon-purple));border-radius:999px;box-shadow:0 0 6px rgba(0,200,255,0.5);transition:width .4s ease}
.xp-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:rgba(255,224,0,0.08);border:1px solid rgba(255,224,0,0.2);border-radius:999px;font-family:var(--font-display);font-size:.55rem;font-weight:700;color:var(--neon-yellow);letter-spacing:1px}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 22px;border-radius:10px;font-family:var(--font-display);font-size:.68rem;font-weight:700;letter-spacing:1px;cursor:pointer;border:1px solid transparent;transition:all .2s;text-transform:uppercase;text-decoration:none}
.btn:disabled{opacity:.4;cursor:not-allowed}
.btn-primary{background:rgba(0,200,255,0.1);border-color:rgba(0,200,255,0.4);color:var(--neon-blue);box-shadow:0 0 15px rgba(0,200,255,0.1)}
.btn-primary:hover{background:rgba(0,200,255,0.2);box-shadow:0 0 25px rgba(0,200,255,0.25);transform:translateY(-1px)}
.btn-ghost{background:rgba(255,255,255,0.03);border-color:var(--border-dim);color:var(--text-secondary)}
.btn-ghost:hover{border-color:rgba(0,200,255,0.3);color:var(--neon-blue);background:rgba(0,200,255,0.05)}
.btn-success{background:rgba(0,255,157,0.08);border-color:rgba(0,255,157,0.3);color:var(--neon-green)}
.btn-success:hover{box-shadow:0 0 20px rgba(0,255,157,0.2)}
.btn-danger{background:rgba(255,0,60,0.08);border-color:rgba(255,0,60,0.3);color:var(--neon-red)}
.btn-purple{background:rgba(176,0,255,0.08);border-color:rgba(176,0,255,0.3);color:#c060ff}
.btn-yellow{background:rgba(255,224,0,0.08);border-color:rgba(255,224,0,0.25);color:var(--neon-yellow)}
.btn-full{width:100%}
.btn-xl{padding:15px 32px;font-size:.75rem;border-radius:14px}
.btn-sm{padding:6px 13px;font-size:.58rem;border-radius:8px}
.btn-xs{padding:4px 10px;font-size:.55rem;border-radius:6px}

/* FORMS */
.flabel{display:block;font-family:var(--font-display);font-size:.58rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--text-muted);margin-bottom:7px}
.finput,.fselect,.ftextarea{width:100%;padding:11px 14px;background:rgba(0,200,255,0.04);border:1px solid var(--border-dim);border-radius:10px;font-family:var(--font-body);font-size:.92rem;font-weight:500;color:var(--text-primary);outline:none;transition:.2s}
.finput:focus,.fselect:focus,.ftextarea:focus{border-color:rgba(0,200,255,0.45);background:rgba(0,200,255,0.07);box-shadow:0 0 0 3px rgba(0,200,255,0.07)}
.finput.err{border-color:rgba(255,0,60,0.5)}
.ftextarea{resize:vertical;min-height:80px}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fgroup{margin-bottom:16px}
.fselect option{background:#0a1628}

/* PROGRESS */
.prog{height:4px;background:rgba(0,200,255,0.08);border-radius:999px;overflow:hidden}
.progf{height:100%;background:linear-gradient(90deg,var(--neon-blue),var(--neon-purple));border-radius:999px;box-shadow:0 0 6px rgba(0,200,255,0.5);transition:width .5s ease}

/* XP BAR */
.xp-bar-wrap{margin-bottom:4px}
.xp-bar-bg{height:6px;background:rgba(0,200,255,0.08);border-radius:999px;overflow:hidden}
.xp-bar-fill{height:100%;border-radius:999px;transition:width .6s ease}

/* BADGES */
.badge-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 11px;border-radius:999px;font-family:var(--font-display);font-size:.58rem;font-weight:700;letter-spacing:1px}
.bc-blue{background:rgba(0,200,255,0.1);color:var(--neon-blue);border:1px solid rgba(0,200,255,0.2)}
.bc-green{background:rgba(0,255,157,0.1);color:var(--neon-green);border:1px solid rgba(0,255,157,0.2)}
.bc-red{background:rgba(255,0,60,0.1);color:var(--neon-red);border:1px solid rgba(255,0,60,0.2)}
.bc-purple{background:rgba(176,0,255,0.1);color:#c060ff;border:1px solid rgba(176,0,255,0.2)}
.bc-yellow{background:rgba(255,224,0,0.1);color:var(--neon-yellow);border:1px solid rgba(255,224,0,0.2)}
.bc-orange{background:rgba(255,140,0,0.1);color:var(--neon-orange);border:1px solid rgba(255,140,0,0.2)}

/* TABS */
.tabs{display:flex;gap:4px;background:rgba(0,200,255,0.03);border-radius:12px;padding:4px;margin-bottom:24px;border:1px solid var(--border-dim)}
.tab{flex:1;padding:8px;border:none;background:transparent;border-radius:8px;font-family:var(--font-display);font-size:.58rem;font-weight:700;cursor:pointer;color:var(--text-muted);transition:.2s;letter-spacing:1px;text-transform:uppercase}
.tab.on{background:rgba(0,200,255,0.1);color:var(--neon-blue);border:1px solid rgba(0,200,255,0.2);box-shadow:0 0 12px rgba(0,200,255,0.08)}

/* OVERLAY / MODAL */
.ov{position:fixed;inset:0;background:rgba(0,4,14,0.85);backdrop-filter:blur(12px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:linear-gradient(135deg,rgba(6,18,40,0.97),rgba(2,4,18,0.99));border:1px solid rgba(0,200,255,0.2);border-radius:20px;padding:36px 32px;max-width:460px;width:100%;text-align:center;box-shadow:0 0 60px rgba(0,200,255,0.1),0 40px 80px rgba(0,0,0,.8);position:relative;overflow:hidden;animation:modal-in .25s ease}
.modal::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--neon-blue),var(--neon-purple))}
@keyframes modal-in{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:none}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
.shake{animation:shake .4s ease}

/* SECTION HEADINGS */
.section-title{font-family:var(--font-display);font-size:1.1rem;font-weight:800;letter-spacing:1px;color:var(--text-primary);margin-bottom:6px}
.section-sub{font-size:.9rem;color:var(--text-secondary);margin-bottom:28px;line-height:1.7}
.section-tag{display:inline-flex;align-items:center;gap:6px;background:rgba(0,200,255,0.06);border:1px solid rgba(0,200,255,0.15);border-radius:999px;padding:5px 14px;font-family:var(--font-display);font-size:.58rem;letter-spacing:2px;color:var(--neon-blue);margin-bottom:14px}

/* MISC */
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.sp{flex:1}
.tc{text-align:center}
.divider{height:1px;background:linear-gradient(90deg,transparent,var(--border-dim),transparent);margin:20px 0}
.muted{color:var(--text-muted);font-size:.85rem}
.mono{font-family:var(--font-mono)}
.neon{color:var(--neon-blue);text-shadow:0 0 10px rgba(0,200,255,0.4)}
.neon-green{color:var(--neon-green)}
.neon-red{color:var(--neon-red)}
.neon-orange{color:var(--neon-orange)}
.neon-yellow{color:var(--neon-yellow)}
.neon-purple{color:#c060ff}
.h1{font-family:var(--font-display);font-size:1.5rem;font-weight:800;letter-spacing:-0.5px}
.h2{font-family:var(--font-display);font-size:1rem;font-weight:700;letter-spacing:1px;color:var(--text-primary)}
.h3{font-family:var(--font-display);font-size:.82rem;font-weight:700;letter-spacing:.5px}
.sub{font-size:.88rem;color:var(--text-secondary);line-height:1.7}

/* ANIMATIONS */
@keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes fadeup{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
@keyframes glow-pulse{0%,100%{box-shadow:0 0 15px rgba(0,200,255,0.2)}50%{box-shadow:0 0 35px rgba(0,200,255,0.5)}}
.fadein{animation:fadein .4s ease both}
.fadein-d1{animation-delay:.06s}
.fadein-d2{animation-delay:.12s}
.fadein-d3{animation-delay:.18s}
.fadein-d4{animation-delay:.24s}
.loading-bar{display:flex;gap:4px;align-items:center;justify-content:center;padding:32px 0}
.loading-bar span{width:4px;height:20px;background:var(--neon-blue);border-radius:999px;animation:loadbar .8s ease-in-out infinite}
.loading-bar span:nth-child(2){animation-delay:.15s}
.loading-bar span:nth-child(3){animation-delay:.3s}
.loading-bar span:nth-child(4){animation-delay:.45s}
@keyframes loadbar{0%,100%{transform:scaleY(.3);opacity:.3}50%{transform:scaleY(1);opacity:1}}

/* RESPONSIVE */
@media(max-width:768px){
  .grid-3,.grid-4{grid-template-columns:repeat(2,1fr)}
  .grid-2{grid-template-columns:1fr}
  .nav-links{display:none}
  .page-wrap{padding:24px 16px 60px}
  .frow{grid-template-columns:1fr}
}
@media(max-width:480px){
  .grid-3,.grid-4,.grid-2{grid-template-columns:1fr}
  .grid-auto{grid-template-columns:1fr}
}
`;

// ── Render Navbar ──────────────────────────────────────────────────────────
function renderNavbar(activePage) {
  const theme = Theme.get();
  const user = UserData.get();
  const level = getLevel(user.xp||0);
  const logoText = theme.academyName || "KAIZO ACADEMIC";
  const logoChar = logoText.charAt(0);

  const navLinks = (theme.navItems || DEFAULT_THEME.navItems).map(item => {
    const isActive = item.href === activePage;
    return `<a href="${item.href}" class="nav-link${isActive?' active':''}">${item.icon} ${item.label}</a>`;
  }).join('');

  const userInitials = user.name ? initials(user.name) : '?';

  return `
  <nav class="navbar">
    <div class="navbar-inner">
      <a href="index.html" class="nav-logo">
        ${theme.logoUrl
          ? `<img src="${theme.logoUrl}" style="width:36px;height:36px;border-radius:9px;object-fit:contain">`
          : `<div class="nav-logo-box">${logoChar}</div>`}
        <div>
          <div class="nav-logo-text">${logoText}</div>
          <div class="nav-logo-sub">${theme.academyTagline||'Learn · Grow · Excel'}</div>
        </div>
      </a>
      <div class="nav-links">${navLinks}</div>
      <div class="nav-sp"></div>
      <div class="nav-xp" onclick="window.location='leaderboard.html'">
        <span style="font-size:.9rem">${level.title==='Novice'?'⭐':level.title==='Learner'?'💫':level.title==='Scholar'?'🎓':level.title==='Expert'?'🔥':level.title==='Master'?'💜':'👑'}</span>
        <span class="nav-xp-val">${(user.xp||0).toLocaleString()} XP</span>
        <span style="color:var(--text-muted);font-size:.58rem">LV.${level.level}</span>
      </div>
      <div class="nav-avatar" onclick="window.location='leaderboard.html'">${userInitials}</div>
      <a href="developer.html" style="margin-left:6px" class="btn btn-ghost btn-sm">⚙</a>
    </div>
  </nav>`;
}

// Init on load
document.addEventListener('DOMContentLoaded', () => { Theme.init(); });
