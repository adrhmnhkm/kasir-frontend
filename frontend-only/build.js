#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Building Tailwind CSS...');

try {
    // Build Tailwind CSS
    execSync('npx tailwindcss -i src/styles.css -o public/styles.css --minify', { stdio: 'inherit' });
    
    console.log('✅ Tailwind CSS built successfully!');
    console.log('📁 Output: public/styles.css');
    
    // Check file size
    const stats = fs.statSync('public/styles.css');
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`📊 File size: ${fileSizeInKB} KB`);
    
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
