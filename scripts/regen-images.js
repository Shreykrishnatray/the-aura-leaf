const https = require("https");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "public", "images");
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

function saveStream(stream, dest) {
  return new Promise((resolve, reject) => {
    const f = fs.createWriteStream(dest);
    stream.pipe(f);
    f.on("finish", () => f.close(() => resolve())).on("error", reject);
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          resolve(get(res.headers.location));
          return;
        }
        if (res.statusCode !== 200) resolve(null);
        else resolve(res);
      })
      .on("error", () => resolve(null));
  });
}

const EMOJI = {
  "paneer-tikka": "🧀",
  "chicken-tikka-masala": "🐔",
  "corn-herb-arancini": "🌽",
  "tandoori-salmon": "🐟",
  "dal-makhani": "🍛",
  "butter-chicken": "🍗",
  "mushroom-risotto": "🍄",
  "lamb-rogan-josh": "🐑",
  "tandoori-roti": "🫓",
  "garlic-naan": "🧄",
  "stuffed-kulcha": "🥟",
  "jowar-roti": "🌾",
  "chicken-biryani": "🍚",
  "vegetable-pulao": "🌱",
  "dal-chawal": "🍚",
  "jeera-rice": "🍚",
  "lemon-rice": "🍋",
  "hakka-noodles": "🍜",
  "chicken-manchurian": "🐔",
  "veg-momos": "🥟",
  "mapo-tofu": "🌶️",
  "mango-lassi": "🥭",
  "mint-jaljeera": "🌿",
  "masala-cola": "🥤",
  "cold-brew-coffee": "☕",
  "sweet-lassi": "🥤",
  "gulab-jamun": "🍯",
  "tiramisu": "☕",
  "molten-chocolate-lava-cake": "🍫",
  "paan-kulfi": "🍦",
};

const CATEGORIES = {
  "cat-starters": "🍢",
  "cat-mains": "🍛",
  "cat-breads": "🫓",
  "cat-rice": "🍚",
  "cat-chinese": "🥢",
  "cat-beverages": "🥤",
  "cat-desserts": "🍰",
};

const BAD = [
  "chicken-tikka-masala",
  "corn-herb-arancini",
  "dal-makhani",
  "butter-chicken",
  "mushroom-risotto",
  "lamb-rogan-josh",
  "chicken-biryani",
];

const BASE = "https://placehold.co/800x800";
const REAL = "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&w=1200";

async function brandedPlaceholder(slug, emoji, isCategory = false) {
  const name = slug.replace(/-/g, " ");
  const text = `${emoji} ${name}`;
  const url = `${BASE}/2a5d44/f9f6f0/jpg?font=lato&font_size=40&text=${encodeURIComponent(text)}`;
  const res = await get(url);
  if (res) await saveStream(res, path.join(DIR, `${slug}.jpg`));
  console.log(`  ◘ brand ${slug}.jpg`);
}

(async () => {
  console.log("Saving hero image (real biryani photo)...");
  const hero = await get(REAL);
  if (hero) await saveStream(hero, path.join(DIR, "hero.jpg"));
  console.log("  ✓ hero.jpg");

  console.log("Regenerating mislabeled dish images as branded placeholders...");
  for (const slug of BAD) {
    await brandedPlaceholder(slug, EMOJI[slug]);
  }

  console.log("Generating category placeholders...");
  for (const [slug, emoji] of Object.entries(CATEGORIES)) {
    await brandedPlaceholder(slug, emoji, true);
  }

  console.log("Generating remaining dish placeholders...");
  const done = new Set([...BAD, "hero.jpg"]);
  for (const [slug, emoji] of Object.entries(EMOJI)) {
    if (done.has(slug) || fs.existsSync(path.join(DIR, slug + ".jpg"))) continue;
    // skip if a real-validated file already exists and is distinct from hero-size
    const existing = path.join(DIR, slug + ".jpg");
    if (fs.existsSync(existing) && fs.statSync(existing).size < 20000) {
      await brandedPlaceholder(slug, emoji);
    } else if (!fs.existsSync(existing)) {
      await brandedPlaceholder(slug, emoji);
    }
  }
  console.log("Done.");
})().catch((e) => { console.error(e); process.exit(1); });
