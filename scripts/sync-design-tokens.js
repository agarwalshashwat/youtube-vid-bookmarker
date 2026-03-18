#!/usr/bin/env node

/**
 * Syncs design tokens from packages/design-system to both extension and webapp
 * Run this script whenever design tokens are updated:
 *
 *   node scripts/sync-design-tokens.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE = 'packages/design-system/tokens.css';
const TARGETS = [
  'extension/styles/design-tokens.css',
  'webapp/app/design-tokens.css'
];

console.log('🎨 Syncing design tokens...\n');

// Read source file
const sourcePath = path.join(__dirname, '..', SOURCE);
if (!fs.existsSync(sourcePath)) {
  console.error(`❌ Source file not found: ${SOURCE}`);
  process.exit(1);
}

const tokensContent = fs.readFileSync(sourcePath, 'utf8');

// Sync to each target
let successCount = 0;
TARGETS.forEach(target => {
  try {
    const targetPath = path.join(__dirname, '..', target);
    const targetDir = path.dirname(targetPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(targetPath, tokensContent, 'utf8');
    console.log(`✓ Synced to ${target}`);
    successCount++;
  } catch (err) {
    console.error(`✗ Failed to sync to ${target}:`, err.message);
  }
});

console.log(`\n✅ Design tokens synced successfully! (${successCount}/${TARGETS.length})`);
console.log('\n💡 Tip: Both extension and webapp use copied design-tokens.css files');
console.log('   Always edit packages/design-system/tokens.css and run this script to sync');
