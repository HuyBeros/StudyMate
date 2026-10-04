const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, 'dist');
const targets = [
  path.resolve(__dirname, '../src/main/resources/static'),
  path.resolve(__dirname, '../target/classes/static')
];

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

for (const target of targets) {
  try {
    copyDir(srcDir, target);
    console.log(`[copy-build] Successfully synced build to: ${target}`);
  } catch (err) {
    console.warn(`[copy-build] Failed to sync to ${target}:`, err.message);
  }
}
