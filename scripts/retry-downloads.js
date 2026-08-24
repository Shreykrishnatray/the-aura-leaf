const https = require('https');
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'public', 'images');

const RETRIES = [
  ['chicken-tikka-masala.jpg', [
    'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1610057099395-de5ff5a0c63e?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=600&fit=crop&crop=center',
  ], 'chicken tikka'],
  ['corn-herb-arancini.jpg', [
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&h=600&fit=crop',
  ], 'arancini fried balls'],
  ['mapo-tofu.jpg', [
    'https://images.unsplash.com/photo-1541370976299-4d24ebbc9077?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&h=600&fit=crop',
  ], 'tofu chinese'],
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
  for (const [filename, urls, label] of RETRIES) {
    const filepath = path.join(dir, filename);
    let success = false;
    for (const url of urls) {
      try {
        const buf = await download(url);
        if (buf[0] === 0xFF && buf[1] === 0xD8) {
          fs.writeFileSync(filepath, buf);
          console.log('OK ' + filename + ' (' + (buf.length/1024).toFixed(0) + 'KB) - ' + label);
          success = true;
          break;
        }
      } catch {}
    }
    if (!success) console.log('FAIL ' + filename + ' - all URLs failed');
  }
}

main().catch(console.error);
