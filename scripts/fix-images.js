const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

const FIX_MAP = {
  // Arancini / risotto balls
  'corn-herb-arancini': 'https://images.unsplash.com/photo-1595231712325-9e23b8b3c826?w=600&h=600&fit=crop&q=80',
  // Mapo tofu / spicy tofu
  'mapo-tofu': 'https://images.unsplash.com/photo-1541379889336-70f26e4c4617?w=600&h=600&fit=crop&q=80',
  // Gulab jamun / Indian dessert
  'gulab-jamun': 'https://images.unsplash.com/photo-1601303516231-64c5c28e0af2?w=600&h=600&fit=crop&q=80',
  // Paan kulfi / Indian ice cream
  'paan-kulfi': 'https://images.unsplash.com/photo-1570197788417-0e82375c9571?w=600&h=600&fit=crop&q=80',
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
  for (const [name, url] of Object.entries(FIX_MAP)) {
    const filepath = path.join(IMAGES_DIR, `${name}.jpg`);
    try {
      const size = await download(url, filepath);
      console.log(`✓ ${name}.jpg (${(size/1024).toFixed(0)}KB)`);
    } catch (err) {
      console.log(`✗ ${name}.jpg — ${err.message}`);
    }
  }
}

main().catch(console.error);
