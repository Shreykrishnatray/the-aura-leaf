const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

const FIX_MAP = {
  // Fried balls / arancini style
  'corn-herb-arancini': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=600&fit=crop&q=80',
  // Gulab jamun - try different photo
  'gulab-jamun': 'https://images.unsplash.com/photo-1589647363585-f0a0c5f80f5d?w=600&h=600&fit=crop&q=80',
  // Kulfi - try different photo
  'paan-kulfi': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&h=600&fit=crop&q=80',
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
