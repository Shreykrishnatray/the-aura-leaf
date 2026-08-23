const https = require('https');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'images');

// Each entry: [filename, pexelsPhotoId, searchTerm]
// Using Pexels direct download URLs with known photo IDs
const REPLACEMENTS = [
  // Group 1: Currently all same as butter-chicken.jpg (hash c3339121)
  ['chicken-tikka-masala.jpg', '6888355', 'chicken tikka grilled'],
  ['dal-makhani.jpg', '5560763', 'indian dal lentils curry'],

  // Group 2: Currently all same as vegetable-pulao.jpg (hash 16b33c6b)
  ['dal-chawal.jpg', '6622338', 'indian dal rice'],
  ['jeera-rice.jpg', '7593253', 'jeera rice basmati'],
  ['lemon-rice.jpg', '7625055', 'lemon rice indian'],

  // Group 3: Currently all same as garlic-naan.jpg (hash b8df753d)
  ['jowar-roti.jpg', '5560782', 'indian roti bread'],
  ['lamb-rogan-josh.jpg', '6622353', 'indian curry lamb'],
  ['stuffed-kulcha.jpg', '5560770', 'indian naan bread'],
  ['tandoori-roti.jpg', '6249507', 'tandoori roti chapati'],

  // Group 4: Currently same as gulab-jamun.jpg (hash 5ab6f0fe)
  ['paan-kulfi.jpg', '6830149', 'indian kulfi ice cream'],

  // Group 5: Currently same as mango-lassi.jpg (hash 8a002129)
  ['sweet-lassi.jpg', '6830155', 'indian lassi yogurt'],

  // Wrong content (pizza instead of arancini)
  ['corn-herb-arancini.jpg', '6941008', 'fried arancini balls'],
];

function download(url) {
  return new Promise((resolve, reject) => {
    const follow = (u) => {
      https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          follow(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    };
    follow(url);
  });
}

async function main() {
  let ok = 0, fail = 0;
  for (const [filename, photoId, label] of REPLACEMENTS) {
    const url = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop`;
    const filepath = path.join(DIR, filename);
    try {
      const buf = await download(url);
      // Verify it's actually a JPEG (starts with FF D8)
      if (buf[0] !== 0xFF || buf[1] !== 0xD8) {
        console.log(`✗ ${filename} — Not a valid JPEG (${label})`);
        fail++;
        continue;
      }
      fs.writeFileSync(filepath, buf);
      console.log(`✓ ${filename} — ${label} (${(buf.length/1024).toFixed(0)}KB)`);
      ok++;
    } catch (err) {
      console.log(`✗ ${filename} — ${err.message} (${label})`);
      fail++;
    }
  }
  console.log(`\nDone: ${ok} succeeded, ${fail} failed`);
}

main().catch(console.error);
