const https = require('https');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

const FIXES = {
  // Gulab jamun - Indian sweets in brass bowl
  'gulab-jamun': 'https://images.pexels.com/photos/8887054/pexels-photo-8887054.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
  // Veg momos - steamed dumplings
  'veg-momos': 'https://images.pexels.com/photos/5409015/pexels-photo-5409015.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
  // Dal makhani - rich black lentils
  'dal-makhani': 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
  // Paan kulfi - Indian ice cream
  'paan-kulfi': 'https://images.pexels.com/photos/5560755/pexels-photo-5560755.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
  // Chicken manchurian
  'chicken-manchurian': 'https://images.pexels.com/photos/2641886/pexels-photo-2641886.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
  // Hakka noodles
  'hakka-noodles': 'https://images.pexels.com/photos/1907228/pexels-photo-1907228.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
  // Cold brew coffee
  'cold-brew-coffee': 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
  // Masala cola
  'masala-cola': 'https://images.pexels.com/photos/1291178/pexels-photo-1291178.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop',
};

function download(url, filepath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : require('http');
    const follow = (u) => {
      proto.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          follow(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
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
  for (const [name, url] of Object.entries(FIXES)) {
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
