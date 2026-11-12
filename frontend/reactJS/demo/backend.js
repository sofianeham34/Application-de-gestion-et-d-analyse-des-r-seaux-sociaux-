// Faux backend de la démo : reproduit les réponses de la gateway (utilisateurs,
// connexions sociales, publications) avec des données de démonstration gardées
// dans le navigateur. La correction et la traduction utilisent de vraies API
// publiques et gratuites (LanguageTool, MyMemory) à la place du LLM.
import { AxiosError } from "axios";
import { IMAGES } from "./images.js";

const STORE_KEY = "ascendia-demo-v1";
const DAY = 86_400_000;
let memory = null; // repli si le stockage local est indisponible

// ----- État -------------------------------------------------------------------

function iso(offsetDays, hour = 18, minute = 30) {
  const d = new Date(Date.now() + offsetDays * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const fbPost = (id, days, message, img, likes, comments) => ({
  id: `fb_${id}`, message, created_time: iso(days, 9 + (id % 9)), full_picture: IMAGES[img],
  permalink_url: "#", likes: { summary: { total_count: likes } },
  reactions: { summary: { total_count: likes + Math.round(likes / 6) } }, comments: { summary: { total_count: comments } },
});
const igPost = (id, days, caption, img, likes, comments) => ({
  id: `ig_${id}`, caption, media_type: "IMAGE", media_url: IMAGES[img], permalink: "#",
  timestamp: iso(days, 8 + (id % 10)), like_count: likes, comments_count: comments,
});

const FB_COMMENTS = [
  ["Camille R.", "Le meilleur latte de Montpellier, sans hésiter !", 4],
  ["Yanis B.", "On passe samedi avec toute l'équipe 😍", 2],
  ["Léa M.", "Est-ce que vous faites des options sans lactose ?", 1],
  ["Thomas G.", "Super ambiance hier soir, merci !", 3],
];
const IG_COMMENTS = [
  ["camille.rd", "Trop beau 😍", 5],
  ["yanis_b", "J'arrive !", 2],
  ["lea.mtp", "Vous êtes ouverts le lundi ?", 1],
  ["thomas.g", "La terrasse au soleil, le rêve ☀️", 3],
];

function seed() {
  const fb = [
    fbPost(1, -2, "🥐 Les croissants sortent du four toutes les 30 minutes ce matin. Premier arrivé, premier servi !", "croissant", 84, 12),
    fbPost(2, -6, "🎷 Jeudi soir, jazz en live au Café Lumière. Entrée libre, réservation conseillée.", "concert", 132, 21),
    fbPost(3, -11, "☕ Notre latte de saison est arrivé : caramel, cannelle et une touche de fleur de sel.", "latte", 97, 15),
    fbPost(4, -24, "🌿 La terrasse rouvre enfin ! On vous attend au soleil dès 8 h.", "terrasse", 156, 28),
    fbPost(5, -38, "🫘 Atelier torréfaction samedi : apprenez à reconnaître vos cafés préférés.", "atelier", 61, 9),
    fbPost(6, -52, "🍳 Le brunch du dimanche revient avec trois nouvelles recettes.", "brunch", 118, 19),
    fbPost(7, -75, "👋 Bienvenue à Inès qui rejoint l'équipe derrière le comptoir !", "equipe", 73, 14),
  ];
  const ig = [
    igPost(1, -1, "Latte art du matin ☕✨ #cafe #montpellier #latteart", "latte", 211, 18),
    igPost(2, -5, "La terrasse au soleil, c'est maintenant 🌿 #terrasse #montpellier", "terrasse", 264, 24),
    igPost(3, -9, "Jazz du jeudi 🎷 Merci pour cette soirée incroyable ! #jazz #live", "concert", 189, 16),
    igPost(4, -19, "Croissants tout chauds 🥐 #boulangerie #petitdejeuner", "croissant", 147, 11),
    igPost(5, -33, "Brunch du dimanche 🍳 Réservez vite ! #brunch #weekend", "brunch", 238, 27),
    igPost(6, -61, "Les coulisses de la torréfaction 🫘 #cafe #artisan", "atelier", 102, 7),
  ];
  const comments = {};
  fb.forEach((p, i) => {
    comments[p.id] = FB_COMMENTS.slice(0, 2 + (i % 3)).map(([name, message, like], j) => ({
      id: `${p.id}_c${j}`, from: { name }, message, like_count: like, created_time: p.created_time,
    }));
  });
  ig.forEach((p, i) => {
    comments[p.id] = IG_COMMENTS.slice(0, 2 + (i % 3)).map(([username, text, like], j) => ({
      id: `${p.id}_c${j}`, username, text, like_count: like, timestamp: p.timestamp,
    }));
  });
  return {
    user: { _id: "demo-user", username: "Café Lumière", email: "contact@cafe-lumiere.fr", role: "user", createdAt: iso(-120) },
    socials: [social("facebook"), social("instagram")],
    fb, ig, comments,
    scheduled: [
      { _id: "s1", content: "🎷 Ce jeudi, soirée jazz avec le trio Les Grains de Sel. Venez tôt !", platform: ["facebook", "instagram"], scheduledFor: iso(2, 18, 0), status: "scheduled" },
      { _id: "s2", content: "☕ Nouveau : le cold brew maison est de retour pour l'été.", platform: ["instagram"], scheduledFor: iso(5, 11, 30), status: "scheduled" },
      { _id: "s3", content: "🍳 Brunch du dimanche : il reste quelques tables, réservez par message.", platform: ["facebook", "twitter"], scheduledFor: iso(9, 9, 0), status: "scheduled" },
    ],
    nextId: 100,
  };
}

function social(provider) {
  const names = { facebook: "Café Lumière", instagram: "cafe.lumiere", twitter: "cafelumiere" };
  return {
    _id: `soc_${provider}`, provider,
    profile: { id: `${provider}_1`, name: "Café Lumière", username: names[provider], photo: IMAGES.avatar },
    pages: provider === "facebook" ? [{ name: "Café Lumière", id: "page_1" }] : [],
    createdAt: new Date().toISOString(),
  };
}

function load() {
  if (memory) return memory;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return (memory = JSON.parse(raw));
  } catch { /* stockage indisponible */ }
  memory = seed();
  save();
  return memory;
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(memory)); } catch { /* quota ou navigation privée */ }
}

// ----- Installation -----------------------------------------------------------

export function installDemo() {
  const state = load();
  try {
    // Arrivée directe dans l'application, déjà connecté.
    if (!localStorage.getItem("token")) localStorage.setItem("token", "demo-token");
    localStorage.setItem("user_id", state.user._id);
  } catch { /* navigation privée */ }

  // La connexion OAuth ouvre normalement une fenêtre Facebook / Instagram / X :
  // ici, le réseau est relié directement avec un profil de démonstration.
  const realOpen = window.open.bind(window);
  window.open = (url, ...rest) => {
    const match = String(url).match(/\/api\/socialauth\/connect\/(facebook|instagram|twitter)/i);
    if (!match) return realOpen(url, ...rest);
    const s = load();
    const provider = match[1].toLowerCase();
    if (!s.socials.some((x) => x.provider === provider)) s.socials.push(social(provider));
    save();
    return { closed: true, close() {} };
  };
}

// ----- Adaptateur axios -------------------------------------------------------

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function adapter(config) {
  await wait(120 + Math.random() * 200);
  const url = new URL(config.url, "http://demo.local");
  const method = (config.method || "get").toLowerCase();
  let body = config.data;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { /* corps brut */ }
  }
  const [status, data] = await route(method, url.pathname.replace(/\/+$/, ""), body, url.searchParams);
  const response = { data, status, statusText: String(status), headers: {}, config, request: {} };
  if (status >= 400) {
    throw new AxiosError(data?.message || data?.error || "Erreur", String(status), config, {}, response);
  }
  return response;
}

const formValue = (body, key) => (body instanceof FormData ? body.get(key) : body?.[key]);
const formAll = (body, key) => (body instanceof FormData ? body.getAll(key) : body?.[key] || []);

function parseNetworks(body) {
  const list = formAll(body, "networks[]");
  if (list.length) return list;
  try { return JSON.parse(formValue(body, "networks") || "[]"); } catch { return []; }
}

async function fileToDataUrl(file) {
  if (!(file instanceof Blob) || file.size > 1_500_000 || !file.type.startsWith("image/")) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function route(method, path, body) {
  const s = load();
  let m;

  // Utilisateurs
  if (method === "post" && (path === "/api/users/login" || path === "/api/users/register")) {
    if (path.endsWith("register")) {
      const username = String(formValue(body, "username") || "").trim();
      if (username) s.user.username = username;
    }
    const email = String(formValue(body, "email") || "").trim();
    if (email) s.user.email = email;
    save();
    return [200, { token: "demo-token", user: s.user }];
  }
  if ((m = path.match(/^\/api\/users\/[^/]+$/))) {
    if (method === "get") return [200, s.user];
    if (method === "put") {
      const fields = body instanceof FormData ? Object.fromEntries(body.entries()) : body || {};
      for (const key of ["username", "email"]) if (fields[key]) s.user[key] = String(fields[key]);
      save();
      return [200, { message: "Profil mis à jour", user: s.user }];
    }
  }

  // Connexions sociales
  if (method === "get" && /^\/api\/socialauth\/[^/]+$/i.test(path)) return [200, s.socials];
  if (method === "delete" && (m = path.match(/^\/api\/socialauth\/[^/]+\/([a-z]+)$/i))) {
    s.socials = s.socials.filter((x) => x.provider !== m[1].toLowerCase());
    save();
    return [200, { message: "Connexion supprimée" }];
  }

  const connected = (p) => s.socials.some((x) => x.provider === p);

  // Publications des réseaux
  if (method === "get" && /^\/api\/posts\/facebook\/posts\/[^/]+$/.test(path)) return [200, connected("facebook") ? s.fb : []];
  if (method === "get" && /^\/api\/posts\/instagram\/posts\/[^/]+\/insights$/.test(path)) return [200, { video_views: 0 }];
  if (method === "get" && /^\/api\/posts\/instagram\/posts\/[^/]+$/.test(path)) return [200, connected("instagram") ? s.ig : []];
  if (method === "get" && (m = path.match(/^\/api\/posts\/(facebook|instagram)\/post\/([^/]+)\/comments$/))) {
    return [200, s.comments[m[2]] || []];
  }
  if (method === "get" && (m = path.match(/^\/api\/posts\/(facebook|instagram)\/post\/([^/]+)$/))) {
    const post = (m[1] === "facebook" ? s.fb : s.ig).find((p) => p.id === m[2]);
    return post ? [200, post] : [404, { message: "Publication introuvable" }];
  }

  // Publications de l'application
  if (method === "get" && /^\/api\/posts\/scheduled\/[^/]+$/.test(path)) {
    return [200, s.scheduled.filter((p) => new Date(p.scheduledFor) > new Date())];
  }
  if (method === "post" && path === "/api/posts/schedule") {
    const networks = parseNetworks(body);
    const message = String(formValue(body, "message") || "").trim();
    const date = new Date(formValue(body, "scheduleDate") || "");
    if (!networks.length) return [400, { error: "Aucun réseau sélectionné" }];
    if (!message) return [400, { error: "Le message est vide" }];
    if (isNaN(date) || date < new Date()) return [400, { error: "Date de planification invalide" }];
    const post = { _id: `s${s.nextId++}`, content: message, platform: networks, scheduledFor: date.toISOString(), status: "scheduled" };
    s.scheduled.push(post);
    save();
    return [201, post];
  }
  if (method === "post" && path === "/api/posts") {
    const networks = parseNetworks(body);
    const message = String(formValue(body, "message") || "").trim();
    if (!networks.length) return [400, { error: "Aucun réseau sélectionné" }];
    if (!message) return [400, { error: "Le message est vide" }];
    const image = (await fileToDataUrl(formValue(body, "file"))) || IMAGES.equipe;
    const id = s.nextId++;
    const results = networks.map((network) => {
      if (network === "facebook" && connected("facebook")) {
        s.fb.unshift({ ...fbPost(id, 0, message, "equipe", 0, 0), created_time: new Date().toISOString(), full_picture: image });
        s.comments[`fb_${id}`] = [];
      } else if (network === "instagram" && connected("instagram")) {
        s.ig.unshift({ ...igPost(id, 0, message, "equipe", 0, 0), timestamp: new Date().toISOString(), media_url: image });
        s.comments[`ig_${id}`] = [];
      }
      return { network, success: true };
    });
    save();
    return [201, { message: "Publication envoyée", results }];
  }
  if (method === "delete" && (m = path.match(/^\/api\/posts\/([^/]+)$/))) {
    s.scheduled = s.scheduled.filter((p) => p._id !== m[1]);
    save();
    return [200, { message: "Publication supprimée" }];
  }

  // Fonctions IA
  if (method === "get" && /^\/api\/posts\/sentiment\/[^/]+$/.test(path)) return [200, { sentimentScore: 8 }];
  if (method === "get" && /^\/api\/posts\/recommandation\/[^/]+$/.test(path)) {
    return [200, [{
      contenu:
        "Vos publications avec une photo de la terrasse ou du brunch génèrent le plus d'engagement.\n" +
        "Publiez-en une samedi vers 11 h sur Instagram, avec une question pour inviter aux commentaires.",
    }]];
  }
  if (method === "post" && path === "/api/posts/corriger") return [200, { message: await corriger(String(formValue(body, "message") || "")) }];
  if (method === "post" && path === "/api/posts/traduire") {
    return [200, { message: await traduire(String(formValue(body, "message") || ""), String(formValue(body, "langue") || "")) }];
  }

  return [404, { message: "Route inconnue dans la démo" }];
}

// ----- Correction et traduction (API publiques gratuites) ---------------------

async function corriger(text) {
  try {
    const res = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ text, language: "fr" }),
    });
    const { matches = [] } = await res.json();
    let out = text;
    [...matches]
      .filter((mt) => mt.replacements?.length)
      .sort((a, b) => b.offset - a.offset)
      .forEach((mt) => { out = out.slice(0, mt.offset) + mt.replacements[0].value + out.slice(mt.offset + mt.length); });
    return out;
  } catch {
    return text;
  }
}

const LANGS = { Arabe: "ar", Allemand: "de", Anglais: "en", Mandarin: "zh-CN", Espagnol: "es", Français: "fr", Italien: "it", Japonais: "ja", Portugais: "pt", Russe: "ru" };

async function traduire(text, langue) {
  const target = LANGS[langue];
  if (!target) return text;
  try {
    const pair = target === "fr" ? "en|fr" : `fr|${target}`;
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`);
    const data = await res.json();
    return data?.responseData?.translatedText || text;
  } catch {
    return text;
  }
}
