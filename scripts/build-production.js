#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Set production environment variables
process.env.NODE_ENV = 'production';
process.env.VITE_APP_VERSION = '1.0.0';
process.env.VITE_CACHE_VERSION = '2.0.0';
process.env.VITE_BUILD_TIMESTAMP = new Date().toISOString();

console.log('🚀 Building for production...');
console.log('📦 Version:', process.env.VITE_APP_VERSION);
console.log('🗂️ Cache Version:', process.env.VITE_CACHE_VERSION);
console.log('⏰ Build Time:', process.env.VITE_BUILD_TIMESTAMP);

// Update service worker cache version
const swPath = path.join(__dirname, '../public/sw.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  const cacheVersion = process.env.VITE_CACHE_VERSION.replace(/\./g, '-');
  swContent = swContent.replace(
    /const CACHE_NAME = 'ud-leads-cache-v\d+';/,
    `const CACHE_NAME = 'ud-leads-cache-${cacheVersion}';`
  );
  fs.writeFileSync(swPath, swContent);
  console.log('✅ Service worker cache version updated');
}

// Update index.html with build timestamp
const indexPath = path.join(__dirname, '../index.html');
if (fs.existsSync(indexPath)) {
  let htmlContent = fs.readFileSync(indexPath, 'utf8');
  htmlContent = htmlContent.replace(
    /<meta name="build-timestamp" content="[^"]*">/,
    `<meta name="build-timestamp" content="${process.env.VITE_BUILD_TIMESTAMP}">`
  );
  fs.writeFileSync(indexPath, htmlContent);
  console.log('✅ HTML build timestamp updated');
}

console.log('🎉 Production build configuration complete!');
