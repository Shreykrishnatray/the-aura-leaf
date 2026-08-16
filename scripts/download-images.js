/**
 * One-time asset downloader.
 * Tries real Unsplash photo CDN URLs per dish (validated by content-type + size),
 * falls back to a branded placehold.co placeholder with a food emoji + dish name.
 * This keeps sample data decoupled: `/images/<slug>.jpg` can be swapped for real
 * photography later by changing only src/data/menu.ts.
 *
 * Run: node scripts/download-images.js
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "public", "images");
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

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

// Dish slug -> ordered candidate Unsplash CDN photo URLs.
const CANDIDATES = {
  "paneer-tikka": ["photo-1546069901-22d1ff4f1d56"],
  "chicken-tikka-masala": ["photo-1594813102-2e9e7e8b5e4a", "photo-1586190848861-99aa4a171e90"],
  "corn-herb-arancini": ["photo-1586190848861-99aa4a171e90"],
  "tandoori-salmon": ["photo-1600891901327-1b13d8b6f7b6"],
  "dal-makhani": ["photo-1598511723747-c2d2b6c5b05a", "photo-1586190848861-99aa4a171e90"],
  "butter-chicken": ["photo-1603457258005-f67d8b5c76f0", "photo-1586190848861-99aa4a171e90"],
  "mushroom-risotto": ["photo-1466970749494-7f7d5b8c5b1f", "photo-1586190848861-99aa4a171e90"],
  "lamb-rogan-josh": ["photo-1596570491484-4f1f7b5d7f4e", "photo-1586190848861-99aa4a171e90"],
  "tandoori-roti": ["photo-1594212793601-9c2b7b0f1c7f", "photo-1600891901327-1b13d8b6f7b6"],
  "garlic-naan": ["photo-1524494122133-5f8a6c7f9e4e", "photo-1594212793601-9c2b7b0f1c7f"],
  "stuffed-kulcha": ["photo-1528319507-8ae0c5f3a4d5", "photo-1466970749494-7f7d5b8c5b1f"],
  "jowar-roti": ["photo-1594212793601-9c2b7b0f1c7f"],
  "chicken-biryani": ["photo-1586190848861-99aa4a171e90"],
  "vegetable-pulao": ["photo-1603457258005-f67d8b5c76f0", "photo-1598511723747-c2d2b6c5b05a"],
  "dal-chawal": ["photo-1598511723747-c2d2b6c5b05a"],
  "jeera-rice": ["photo-1596570491484-4f1f7b5d7f4e"],
  "lemon-rice": ["photo-1603457258005-f67d8b5c76f0"],
  "hakka-noodles": ["photo-1554132346-c9d6f4f7f7f7", "photo-1528319507-8ae0c5f3a4d5"],
  "chicken-manchurian": ["photo-1543352688-9d2a5c8f1b2a", "photo-1554132346-c9d6f4f7f7f7"],
  "veg-momos": ["photo-1571019657415-cfa7a2d2e8c5", "photo-1528319507-8ae0c5f3a4d5"],
  "mapo-tofu": ["photo-1577066475070-296f1f3d6a5b", "photo-1543352688-9d2a5c8f1b2a"],
  "mango-lassi": ["photo-1559328826-02f9a9a3e1c6", "photo-1528319507-8ae0c5f3a4d5"],
  "mint-jaljeera": ["photo-1600891901327-1b13d8b6f7b6"],
  "masala-cola": ["photo-1577066475070-296f1f3d6a5b"],
  "cold-brew-coffee": ["photo-1571019657415-cfa7a2d2e8c5", "photo-1559328826-02f9a9a3e1c6"],
  "sweet-lassi": ["photo-1559328826-02f9a9a3e1c6"],
  "gulab-jamun": ["photo-1503722553906-5c9b8a1f9d4a", "photo-1528319507-8ae0c5f3a4d5"],
  "tiramisu": ["photo-1563379926-4255f8a8b5d9", "photo-1503722553906-5c9b8a1f9d4a"],
  "molten-chocolate-lava-cake": ["photo-1578609281797-4f9e5f72b6f7", "photo-1563379926-4255f8a8b5d9"],
  "paan-kulfi": ["photo-1571019657415-cfa7a2d2e8c5", "photo-1503722553906-5c9b8a1f9d4a"],
};

const BASE = "https://images.unsplash.com/";

// Category images: pick the best-looking validated dish photo per category.
const CATEGORY_FALLBACK = {
  "cat-starters": "paneer-tikka",
  "cat-mains": "butter-chicken",
  "cat-breads": "garlic-naan",
  "cat-rice": "chicken-biryani",
  "cat-chinese": "hakka-noodles",
  "cat-beverages": "mango-lassi",
  "cat-desserts": "gulab-jamun",
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          fetch(res.headers.location).then(resolve).catch(reject);
          return;
        }
        const type = res.headers["content-type"] || "";
        const len = Number(res.headers["content-length"] || 0);
        if (res.statusCode !== 200 || !String(type).startsWith("image/")) {
          res.resume();
          resolve({ ok: false, status: res.statusCode, type, len });
          return;
        }
        resolve({ ok: true, stream: res, type, len });
      })
      .on("error", (e) => reject(e));
  });
}

function fallbackUrl(slug) {
  const emoji = EMOJI[slug] || "🍽️";
  const name = slug.replace(/-/g, " ");
  const text = `${emoji} ${name}`;
  return `https://placehold.co/800x800/2a5d44/f9f6f0/jpg?font=lato&text=${encodeURIComponent(text)}`;
}

async function download(slug, candidates) {
  const dest = path.join(DIR, `${slug}.jpg`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 15000) {
    console.log(`  ✓ cached  ${slug}.jpg`);
    return true;
  }
  for (const id of candidates) {
    const url = `${BASE}${id}?auto=format&w=800`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const file = fs.createWriteStream(dest);
        await new Promise((resolve, reject) => {
          res.stream.pipe(file);
          file.on("finish", resolve).on("error", reject);
        });
        file.close();
        const size = fs.statSync(dest).size;
        if (size > 15000) {
          console.log(`  ✓ real  ${slug}.jpg (${size} bytes)`);
          return true;
        }
      }
    } catch (e) {
      /* try next */
    }
  }
  // Fallback: branded placeholder
  try {
    const res = await fetch(fallbackUrl(slug));
    if (res.ok) {
      const file = fs.createWriteStream(dest);
      await new Promise((resolve, reject) => {
        res.stream.pipe(file);
        file.on("finish", resolve).on("error", reject);
      });
      const size = fs.statSync(dest).size;
      console.log(`  ◘ brand ${slug}.jpg (${size} bytes) [placeholder fallback]`);
      return true;
    }
  } catch (e) {
    console.log(`  ✗ fail  ${slug}.jpg`);
  }
  return false;
}

async function main() {
  console.log(`Downloading images to ${DIR}`);
  const slugs = Object.keys(CANDIDATES);
  for (const slug of slugs) {
    await download(slug, CANDIDATES[slug]);
  }
  // Category images
  for (const [cat, fallback] of Object.entries(CATEGORY_FALLBACK)) {
    const dest = path.join(DIR, `${cat}.jpg`);
    if (!fs.existsSync(dest)) {
      const src = path.join(DIR, `${fallback}.jpg`);
      if (fs.existsSync(src)) fs.copyFileSync(src, dest);
    }
    console.log(`  ✓ categ ${cat}.jpg`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
