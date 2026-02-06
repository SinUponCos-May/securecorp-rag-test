const fs = require('fs-extra');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

console.log('🚀 Building RAG Security Test Site...');

// Clear public directory
fs.emptyDirSync('public');

// Copy all files from src to public
fs.copySync('src', 'public');

// Update Firebase config in firebase-config.js
const firebaseConfigPath = path.join('public', 'js', 'firebase-config.js');
let firebaseConfigContent = fs.readFileSync(firebaseConfigPath, 'utf8');

// Replace with environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

firebaseConfigContent = firebaseConfigContent.replace(
  /const firebaseConfig = \{[\s\S]*?\};/,
  `const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};`
);

fs.writeFileSync(firebaseConfigPath, firebaseConfigContent);

// Update sitemap.xml with actual URL placeholder
const sitemapPath = path.join('public', 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  let sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  sitemapContent = sitemapContent.replace(/YOUR_VERCEL_URL/g, 'https://[YOUR-VERCEL-URL]');
  fs.writeFileSync(sitemapPath, sitemapContent);
}

console.log('✅ Build complete! Files copied to /public');
console.log('📁 Public directory structure:');
console.log(fs.readdirSync('public', { withFileTypes: true })
  .map(dirent => `${dirent.isDirectory() ? '📁' : '📄'} ${dirent.name}`)
  .join('\n'));