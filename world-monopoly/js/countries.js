// ─── COUNTRIES DATA ─────────────────────────────────────────────────────────
// 20 negara dengan landmark, harga, dan statistik

const COUNTRIES_DATA = [
  { id:'usa',         name:'USA',          icon:'🇺🇸', landmark:'Statue of Liberty',    price:800, rent:60,  houseCost:200, color:'#ef4444' },
  { id:'france',      name:'France',       icon:'🇫🇷', landmark:'Eiffel Tower',         price:760, rent:55,  houseCost:180, color:'#8b5cf6' },
  { id:'japan',       name:'Japan',        icon:'🇯🇵', landmark:'Torii Gate',           price:740, rent:52,  houseCost:170, color:'#8b5cf6' },
  { id:'uk',          name:'UK',           icon:'🇬🇧', landmark:'Big Ben',             price:720, rent:50,  houseCost:165, color:'#10b981' },
  { id:'china',       name:'China',        icon:'🇨🇳', landmark:'Great Wall',           price:700, rent:48,  houseCost:160, color:'#10b981' },
  { id:'india',       name:'India',        icon:'🇮🇳', landmark:'Taj Mahal',            price:680, rent:46,  houseCost:155, color:'#10b981' },
  { id:'brazil',      name:'Brazil',       icon:'🇧🇷', landmark:'Christ the Redeemer',  price:660, rent:45,  houseCost:150, color:'#3b82f6' },
  { id:'indonesia',   name:'Indonesia',    icon:'🇮🇩', landmark:'Borobudur',            price:640, rent:44,  houseCost:145, color:'#10b981' },
  { id:'germany',     name:'Germany',      icon:'🇩🇪', landmark:'Brandenburg Gate',     price:620, rent:43,  houseCost:140, color:'#3b82f6' },
  { id:'italy',       name:'Italy',        icon:'🇮🇹', landmark:'Colosseum',            price:600, rent:42,  houseCost:135, color:'#3b82f6' },
  { id:'spain',       name:'Spain',        icon:'🇪🇸', landmark:'Sagrada Familia',      price:580, rent:40,  houseCost:130, color:'#ef4444' },
  { id:'turkey',      name:'Turkey',       icon:'🇹🇷', landmark:'Hagia Sophia',         price:560, rent:38,  houseCost:125, color:'#ef4444' },
  { id:'russia',      name:'Russia',       icon:'🇷🇺', landmark:'Kremlin',              price:540, rent:36,  houseCost:120, color:'#ef4444' },
  { id:'mexico',      name:'Mexico',       icon:'🇲🇽', landmark:'Chichen Itza',         price:520, rent:34,  houseCost:115, color:'#06b6d4' },
  { id:'egypt',       name:'Egypt',        icon:'🇪🇬', landmark:'Pyramids',             price:500, rent:33,  houseCost:110, color:'#06b6d4' },
  { id:'australia',   name:'Australia',    icon:'🇦🇺', landmark:'Sydney Opera House',   price:480, rent:32,  houseCost:105, color:'#06b6d4' },
  { id:'southkorea',  name:'South Korea',  icon:'🇰🇷', landmark:'Gyeongbokgung',        price:460, rent:30,  houseCost:100, color:'#8b5cf6' },
  { id:'thailand',    name:'Thailand',     icon:'🇹🇭', landmark:'Wat Phra Kaew',        price:440, rent:28,  houseCost:95,  color:'#8b5cf6' },
  { id:'canada',      name:'Canada',       icon:'🇨🇦', landmark:'CN Tower',             price:420, rent:27,  houseCost:90,  color:'#8b5cf6' },
  { id:'saudi',       name:'Saudi Arabia', icon:'🇸🇦', landmark:'Kaaba',                price:400, rent:25,  houseCost:85,  color:'#f59e0b' },
];

// Get rent amount based on houses owned
function getCountryRent(country, houses) {
  if (!country) return 0;
  const base = country.rent;
  if (houses === 0) return base;
  if (houses === 1) return base * 2;
  if (houses === 2) return base * 3;
  if (houses === 3) return base * 5;
  if (houses === 4) return base * 7;
  if (houses === 5) return base * 10;
  return base;
}

// Get country by id
function getCountryById(id) {
  return COUNTRIES_DATA.find(c => c.id === id);
}

// Get country by name
function getCountryByName(name) {
  return COUNTRIES_DATA.find(c => c.name === name);
}
