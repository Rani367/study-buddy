// Simple Node.js script to generate placeholder icon files
// Run with: node generate-icons.js

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Create a simple SVG icon
function createSVGIcon(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.6}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">?</text>
</svg>`;
}

// Generate SVG files for each size
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(filename, svgContent);
  console.log(`Created ${filename}`);
});

console.log('\nSVG icons created successfully!');
console.log('Note: Chrome extensions work with PNG files. You have two options:');
console.log('1. Use create-icons.html to generate PNG files in your browser');
console.log('2. Convert SVG to PNG using an online tool or ImageMagick');
console.log('\nTo convert with ImageMagick (if installed):');
console.log('  cd icons');
console.log('  convert icon16.svg icon16.png');
console.log('  convert icon48.svg icon48.png');
console.log('  convert icon128.svg icon128.png');
