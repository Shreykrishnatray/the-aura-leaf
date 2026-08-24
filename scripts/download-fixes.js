const https = require('https');
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'public', 'images');

// More targeted Unsplash IDs for specific dishes
const DOWNLOADS = [
  // Garlic Naan - try naan-specific IDs
  ['garlic-naan.jpg', [
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1574607383476-f517f260d30b?w=600&h=600&fit=crop',
  ], 'garlic naan'],
  
  // Lamb Rogan Josh - try lamb curry IDs
  ['lamb-rogan-josh.jpg', [
    'https://images.unsplash.com/photo-1545247181-516773cae754?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=600&fit=crop&crop=bottom',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=600&fit=crop',
  ], 'lamb curry'],
  
  // Tandoori Roti - try flatbread IDs
  ['tandoori-roti.jpg', [
    'https://images.unsplash.com/photo-1574607383476-f517f260d30b?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1586444248879-bc604cbd555a?w=600&h=600&fit=crop',
  ], 'indian flatbread roti'],
  
  // Stuffed Kulcha - try stuffed bread IDs
  ['stuffed-kulcha.jpg', [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1574607383476-f517f260d30b?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1586444248879-bc604cbd555a?w=600&h=600&fit=crop',
  ], 'stuffed kulcha bread'],
  
  // Corn Arancini - try fried balls IDs
  ['corn-herb-arancini.jpg', [
    'https://images.unsplash.com/photo-1541592106381-b31e9677c0e4?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&h=600&fit=crop',
  ], 'arancini fried risotto balls'],
  
  // Lemon Rice - try yellow rice IDs
  ['lemon-rice.jpg', [
    'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=600&fit=crop',
  ], 'lemon rice yellow'],
  
  // Hakka Noodles - try stir fry noodles IDs
  ['hakka-noodles.jpg', [
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&h=600&fit=crop',
  ], 'hakka noodles stir fry'],
  
  // Chicken Manchurian - try Indo-Chinese IDs
  ['chicken-manchurian.jpg', [
    'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&h=600&fit=crop',
  ], 'chicken manchurian'],
  
  // Mapo Tofu - try tofu IDs
  ['mapo-tofu.jpg', [
    'https://images.unsplash.com/photo-1541370976299-4d24ebbc9077?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&h=600&fit=crop',
  ], 'tofu chinese'],
  
  // Sweet Lassi - try lassi IDs
  ['sweet-lassi.jpg', [
    'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1546173159-31b7d4413e61?w=600&h=600&fit=crop',
  ], 'sweet lassi yogurt drink'],
  
  // Paan Kulfi - try kulfi IDs
  ['paan-kulfi.jpg', [
    'https://images.unsplash.com/photo-1570197571499-166b36435e9f?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=600&h=600&fit=crop',
  ], 'kulfi indian ice cream'],
  
  // Dal Makhani - try dal IDs
  ['dal-makhani.jpg', [
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&h=600&fit=crop',
  ], 'dal makhani lentils'],
  
  // Molten Chocolate Lava Cake - try chocolate cake IDs
  ['molten-chocolate-lava-cake.jpg', [
    'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=600&fit=crop',
  ], 'chocolate lava cake'],
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
  for (const [filename, urls, label] of DOWNLOADS) {
    const filepath = path.join(dir, filename);
    let success = false;
    for (const url of urls) {
      try {
        const buf = await download(url);
        if (buf[0] === 0xFF && buf[1] === 0xD8) {
          fs.writeFileSync(filepath, buf);
          console.log('OK ' + filename + ' (' + (buf.length/1024).toFixed(0) + 'KB) - ' + label);
          success = true;
          ok++;
          break;
        }
      } catch {}
    }
    if (!success) {
      console.log('FAIL ' + filename + ' - all URLs failed');
      fail++;
    }
  }
  console.log('\nDone: ' + ok + ' succeeded, ' + fail + ' failed');
}

main().catch(console.error);
