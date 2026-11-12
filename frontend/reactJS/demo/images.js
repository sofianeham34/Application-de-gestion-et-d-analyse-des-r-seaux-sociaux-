// Visuels des publications de démonstration (SVG générés, aucun fichier externe).
const svg = (from, to, emoji, title) =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
      <rect width="800" height="800" fill="url(#g)"/>
      <text x="400" y="380" font-size="220" text-anchor="middle">${emoji}</text>
      <text x="400" y="560" font-size="54" font-family="Georgia, serif" fill="#fff" text-anchor="middle">${title}</text>
    </svg>`
  );

export const IMAGES = {
  latte: svg("#6b3f2a", "#d9a066", "☕", "Latte de saison"),
  croissant: svg("#c47f2c", "#f4d58d", "🥐", "Sorti du four"),
  terrasse: svg("#2f6f5e", "#9fd3b8", "🌿", "La terrasse est ouverte"),
  concert: svg("#3b2a6b", "#c08fe0", "🎷", "Jazz du jeudi"),
  atelier: svg("#7a2f3b", "#f0a3a3", "🫘", "Atelier torréfaction"),
  brunch: svg("#a5512b", "#ffd0a1", "🍳", "Brunch du dimanche"),
  equipe: svg("#24425e", "#8cc1e8", "👋", "L'équipe vous attend"),
  avatar: svg("#1d7a68", "#7fd1bd", "☕", ""),
};
