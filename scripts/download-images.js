const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

// Map of dish names to Unsplash photo IDs (known working, high-quality food photos)
const PHOTO_MAP = {
  // Hero - premium pizza
  'hero': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1400&h=800&fit=crop&q=85',
  
  // Starters
  'paneer-tikka': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&h=600&fit=crop&q=80',
  'chicken-tikka-masala': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&h=600&fit=crop&q=80',
  'corn-herb-arancini': 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e4?w=600&h=600&fit=crop&q=80',
  'tandoori-salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=600&fit=crop&q=80',
  
  // Main Course
  'dal-makhani': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=600&fit=crop&q=80',
  'butter-chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&h=600&fit=crop&q=80',
  'mushroom-risotto': 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&h=600&fit=crop&q=80',
  'lamb-rogan-josh': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=600&fit=crop&q=80',
  
  // Breads
  'tandoori-roti': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=600&fit=crop&q=80',
  'garlic-naan': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=600&fit=crop&q=80',
  'stuffed-kulcha': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=600&fit=crop&q=80',
  'jowar-roti': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=600&fit=crop&q=80',
  
  // Rice & Biryani
  'chicken-biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=600&fit=crop&q=80',
  'vegetable-pulao': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=600&fit=crop&q=80',
  'dal-chawal': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=600&fit=crop&q=80',
  'jeera-rice': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=600&fit=crop&q=80',
  'lemon-rice': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=600&fit=crop&q=80',
  
  // Chinese
  'hakka-noodles': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=600&fit=crop&q=80',
  'chicken-manchurian': 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&h=600&fit=crop&q=80',
  'veg-momos': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&h=600&fit=crop&q=80',
  'mapo-tofu': 'https://images.unsplash.com/photo-1582452919408-afa2e3e25f0e?w=600&h=600&fit=crop&q=80',
  
  // Beverages
  'mango-lassi': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&h=600&fit=crop&q=80',
  'mint-jaljeera': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&h=600&fit=crop&q=80',
  'masala-cola': 'https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=600&h=600&fit=crop&q=80',
  'cold-brew-coffee': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=600&fit=crop&q=80',
  'sweet-lassi': 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&h=600&fit=crop&q=80',
  
  // Desserts
  'gulab-jamun': 'https://images.unsplash.com/photo-1666190096882-111c720b9fb6?w=600&h=600&fit=crop&q=80',
  'tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=600&fit=crop&q=80',
  'molten-chocolate-lava-cake': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=600&fit=crop&q=80',
  'paan-kulfi': 'https://images.unsplash.com/photo-1580910365203-91ea91157f8b?w=600&h=600&fit=crop&q=80',
  
  // Category images
  'cat-starters': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&h=400&fit=crop&q=80',
  'cat-mains': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&h=400&fit=crop&q=80',
  'cat-breads': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop&q=80',
  'cat-rice': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop&q=80',
  'cat-chinese': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop&q=80',
  'cat-beverages': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=400&fit=crop&q=80',
  'cat-desserts': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop&q=80',
};

function download(url, filepath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const follow = (u) => {
      proto.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, u).href;
          follow(next);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          fs.writeFileSync(filepath, buf);
          resolve(buf.length);
        });
        res.on('error', reject);
      }).on('error', reject);
    };
    follow(url);
  });
}

async function main() {
  const entries = Object.entries(PHOTO_MAP);
  let success = 0, fail = 0;
  
  for (const [name, url] of entries) {
    const filepath = path.join(IMAGES_DIR, `${name}.jpg`);
    try {
      const size = await download(url, filepath);
      console.log(`✓ ${name}.jpg (${(size/1024).toFixed(0)}KB)`);
      success++;
    } catch (err) {
      console.log(`✗ ${name}.jpg — ${err.message}`);
      fail++;
    }
  }
  
  console.log(`\nDone: ${success} succeeded, ${fail} failed out of ${entries.length}`);
}

main().catch(console.error);
