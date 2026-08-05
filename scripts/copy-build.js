const fs = require('fs');
const path = require('path');

const src = path.resolve(process.cwd(), 'build');
const dest = path.resolve(process.cwd(), '..', 'build');

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    throw new Error(`Source directory does not exist: ${source}`);
  }

  fs.mkdirSync(destination, { recursive: true });

  for (const item of fs.readdirSync(source)) {
    const srcPath = path.join(source, item);
    const destPath = path.join(destination, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  copyDirectory(src, dest);
  console.log(`✅ Copied frontend build from ${src} to ${dest}`);
} catch (err) {
  console.error('❌ Failed to copy build directory:', err);
  process.exit(1);
}
