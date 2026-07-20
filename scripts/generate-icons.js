/**
 * Renders the app's pig logo (mirroring src/components/Logo.tsx) into every
 * icon asset. Rerun after changing the logo:  node scripts/generate-icons.js
 */
const sharp = require('sharp');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets', 'images');

const FELT = '#1E4034';
const PINK = { body: '#F2A0B5', edge: '#A85874', dark: '#4A1626' };
const WHITE = { body: '#FFFFFF', edge: '#FFFFFF', dark: '#FFFFFF' };

// The pig from src/components/Logo.tsx, viewBox 0 0 128 96.
function pig({ body, edge, dark }) {
  return `
    <path d="M20 48 C8 42, 6 56, 16 56 C24 56, 22 46, 16 49"
      stroke="${edge}" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <rect x="34" y="70" width="9" height="16" rx="4" fill="${edge}"/>
    <rect x="52" y="72" width="9" height="16" rx="4" fill="${edge}"/>
    <rect x="70" y="72" width="9" height="16" rx="4" fill="${edge}"/>
    <rect x="88" y="70" width="9" height="16" rx="4" fill="${edge}"/>
    <ellipse cx="62" cy="52" rx="44" ry="30" fill="${body}" stroke="${edge}" stroke-width="4"/>
    <path d="M84 30 L90 12 L102 24 Z" fill="${edge}" stroke="${edge}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M92 26 L100 10 L110 24 Z" fill="${body}" stroke="${edge}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="100" cy="44" r="20" fill="${body}" stroke="${edge}" stroke-width="4"/>
    <ellipse cx="118" cy="47" rx="8" ry="7" fill="${body}" stroke="${edge}" stroke-width="3"/>
    <circle cx="115.5" cy="47" r="1.6" fill="${edge}"/>
    <circle cx="120.5" cy="47" r="1.6" fill="${edge}"/>
    <circle cx="98" cy="38" r="2.8" fill="${dark}"/>
    <circle cx="52" cy="52" r="6.5" fill="${dark}"/>`;
}

// Pig group centered in a 1024 square. The art box is 128x96 with ~8 units of
// visual margin; `scale` sizes it relative to the canvas.
function centeredPig(scale, palette) {
  const w = 128 * scale;
  const h = 96 * scale;
  const x = (1024 - w) / 2;
  const y = (1024 - h) / 2;
  return `<g transform="translate(${x} ${y}) scale(${scale})">${pig(palette)}</g>`;
}

function svg(content, background = null) {
  const bg = background
    ? `<rect width="1024" height="1024" fill="${background}"/>`
    : '';
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${bg}${content}</svg>`
  );
}

async function write(name, buffer, size = 1024) {
  await sharp(buffer).resize(size, size).png().toFile(path.join(OUT, name));
  console.log('wrote', name);
}

(async () => {
  // iOS / general app icon: felt background, pig filling most of the frame.
  await write('icon.png', svg(centeredPig(6.4, PINK), FELT));
  // Splash: pig alone on transparency (splash background color comes from app.json).
  await write('splash-icon.png', svg(centeredPig(6.4, PINK)), 512);
  // Android adaptive: foreground pig inside the safe zone, solid felt background,
  // white monochrome silhouette.
  await write('android-icon-foreground.png', svg(centeredPig(4.2, PINK)));
  await write('android-icon-background.png', svg('', FELT));
  await write('android-icon-monochrome.png', svg(centeredPig(4.2, WHITE)));
  // Web favicon.
  await write('favicon.png', svg(centeredPig(6.4, PINK), FELT), 48);
})();
