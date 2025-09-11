#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel deployment setup...\n');

// 1. Check if vercel.json exists
const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
if (!fs.existsSync(vercelConfigPath)) {
  console.error('❌ vercel.json not found. Please run this script from project root.');
  process.exit(1);
}

// 2. Check if node_modules exists (skip install if already installed)
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies with pnpm...');
  console.log('⏳ This may take a moment...\n');
  try {
    execSync('pnpm install', { 
      stdio: ['inherit', 'inherit', 'inherit'],
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    console.log('\n✅ Dependencies installed successfully\n');
  } catch (error) {
    console.log('\n📝 Falling back to npm...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencies installed with npm\n');
    } catch (npmError) {
      console.error('❌ Failed to install dependencies:', npmError.message);
      process.exit(1);
    }
  }
} else {
  console.log('✅ Dependencies already installed\n');
}

// 3. Check Vercel CLI
console.log('🔧 Checking Vercel CLI...');
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI found\n');
} catch (error) {
  console.log('📥 Installing Vercel CLI...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI installed\n');
  } catch (installError) {
    console.error('❌ Failed to install Vercel CLI:', installError.message);
    console.log('💡 Please install manually: npm install -g vercel');
    process.exit(1);
  }
}

// 4. Create production build script
const buildScript = `#!/bin/bash
echo "🏗️ Building for production..."

# Install dependencies
echo "📦 Installing dependencies..."
if command -v pnpm &> /dev/null; then
    echo "Using pnpm..."
    pnpm install --prod --frozen-lockfile
else
    echo "Using npm..."
    npm ci --only=production
fi

# Set production environment
export NODE_ENV=production

echo "✅ Build completed!"
`;

fs.writeFileSync(path.join(process.cwd(), 'build.sh'), buildScript);
fs.chmodSync(path.join(process.cwd(), 'build.sh'), '755');

// 5. Update .gitignore for Vercel
const gitignorePath = path.join(process.cwd(), '.gitignore');
let gitignoreContent = '';

if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
}

const vercelIgnores = `
# Vercel
.vercel
.env*.local
build.sh
`;

if (!gitignoreContent.includes('.vercel')) {
  fs.writeFileSync(gitignorePath, gitignoreContent + vercelIgnores);
  console.log('✅ Updated .gitignore for Vercel\n');
}

// 6. Display deployment instructions
console.log('🎉 Setup completed! Next steps:\n');
console.log('1. 📊 Setup Database:');
console.log('   • Option A: vercel add postgres (Recommended)');
console.log('   • Option B: Use Supabase/Railway/PlanetScale\n');

console.log('2. 🔑 Set Environment Variables in Vercel Dashboard:');
console.log('   • NODE_ENV=production');
console.log('   • POSTGRES_URL=your_connection_string');
console.log('   • DATABASE_URL=your_connection_string\n');

console.log('3. 🚀 Deploy:');
console.log('   • vercel --prod (CLI deployment)');
console.log('   • Or connect GitHub repo in Vercel Dashboard\n');

console.log('4. 📖 Read DEPLOYMENT.md for detailed instructions\n');

console.log('💡 Quick deploy command:');
console.log('   vercel --prod\n');

console.log('✅ Ready for deployment!');
