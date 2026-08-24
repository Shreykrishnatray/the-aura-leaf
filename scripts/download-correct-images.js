const https = require('https');
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'public', 'images');

// [filename, unsplash-url, description]
const DOWNLOADS = [
  // Paneer dishes
  ['paneer-tikka.jpg', 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&h=600&fit=crop', 'paneer tikka grilled'],
  ['chicken-tikka-masala.jpg', 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=600&h=600&fit=crop', 'chicken tikka grilled'],
  
  // Arancini
  ['corn-herb-arancini.jpg', 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e4?w=600&h=600&fit=crop', 'arancini fried balls'],
  
  // Dal
  ['dal-makhani.jpg', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=600&fit=crop', 'dal makhani lentils'],
  ['dal-chawal.jpg', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=600&fit=crop', 'dal chawal lentils rice'],
  
  // Lamb
  ['lamb-rogan-josh.jpg', 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&h=600&fit=crop', 'lamb curry indian'],
  
  // Breads
  ['tandoori-roti.jpg', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=600&fit=crop', 'indian naan bread'],
  ['garlic-naan.jpg', 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&h=600&fit=crop', 'garlic naan'],
  ['stuffed-kulcha.jpg', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop', 'stuffed bread indian'],
  
  // Rice
  ['vegetable-pulao.jpg', 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600&h=600&fit=crop', 'vegetable pulao rice'],
  ['lemon-rice.jpg', 'https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=600&h=600&fit=crop', 'lemon rice yellow'],
  
  // Chinese
  ['hakka-noodles.jpg', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=600&fit=crop', 'hakka noodles stir fry'],
  ['chicken-manchurian.jpg', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&h=600&fit=crop', 'chicken manchurian'],
  ['veg-momos.jpg', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=600&fit=crop', 'momos dumplings'],
  ['mapo-tofu.jpg', 'https://images.unsplash.com/photo-1582452919408-aca4f82d0c9a?w=600&h=600&fit=crop', 'mapo tofu'],
  
  // Beverages
  ['masala-cola.jpg', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&h=600&fit=crop', 'cola drink glass'],
  ['cold-brew-coffee.jpg', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&h=600&fit=crop', 'cold brew coffee iced'],
  ['sweet-lassi.jpg', 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&h=600&fit=crop', 'sweet lassi yogurt'],
  
  // Desserts
  ['molten-chocolate-lava-cake.jpg', 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=600&fit=crop', 'chocolate lava cake'],
  ['paan-kulfi.jpg', 'https://images.unsplash.com/photo-1570197571499-166b36435e9f?w=600&h=600&fit=crop', 'kulfi indian ice cream'],
];

function download(url) {
  return new Promise((resolve, reject) => {
    const follow = (u) => {
      https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          follow(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); return; }
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
  for (const [filename, url, label] of DOWNLOADS) {
    const filepath = path.join(dir, filename);
    try {
      const buf = await download(url);
      if (buf[0] === 0xFF && buf[1] === 0xD8) {
        fs.writeFileSync(filepath, buf);
        console.log('OK ' + filename + ' (' + (buf.length/1024).toFixed(0) + 'KB) - ' + label);
        ok++;
      } else {
        console.log('SKIP ' + filename + ' - not JPEG');
        fail++;
      }
    } catch (err) {
      console.log('FAIL ' + filename + ' - ' + err.message + ' - ' + label);
      fail++;
    }
  }
  console.log('\nDone: ' + ok + ' succeeded, ' + fail + ' failed');
}

main().catch(console.error);
