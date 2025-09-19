#!/usr/bin/env node

const { execSync } = require('child_process');
const { build } = require('esbuild');
const fs = require('fs');

console.log('🚀 Starting build process...');

// 1. Build Tailwind CSS
try {
    console.log('   - Building Tailwind CSS...');
    execSync('npx tailwindcss -i ./src/styles.css -o ./public/styles.css --minify', { stdio: 'inherit' });
    console.log('   ✅ CSS build successful!');
} catch (error) {
    console.error('   ❌ CSS build failed:', error.message);
    process.exit(1);
}

// 2. Build JavaScript (React/JSX) with esbuild
console.log('\n   - Building JavaScript (JSX)...');
build({
    entryPoints: ['frontend/App.jsx'], // Titik masuk utama aplikasi Anda
    bundle: true,
    outfile: 'public/bundle.js',       // File hasil output
    minify: true,
    sourcemap: true,
    target: ['chrome58', 'firefox57', 'safari11', 'edge16'],
    loader: { '.jsx': 'jsx' },
}).then(() => {
    console.log('   ✅ JavaScript build successful!');
    
    // Check file size
    const stats = fs.statSync('public/bundle.js');
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`\n📁 Output: public/bundle.js (${fileSizeInKB} KB)`);
    console.log('✅ Build process completed successfully!');
}).catch((error) => {
    console.error('   ❌ JavaScript build failed:', error.message);
    process.exit(1);
});