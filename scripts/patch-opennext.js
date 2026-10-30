const fs = require('fs');
const path = require('path');

// Safe recursive copy function that handles Windows drives and Unicode directory names
const safeCopyFunc = `
function __safeCopyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      __safeCopyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
`;

// 1. Patch helper.js
const helperPath = path.join(__dirname, '..', 'node_modules', '@opennextjs', 'aws', 'dist', 'build', 'helper.js');
if (fs.existsSync(helperPath)) {
  let content = fs.readFileSync(helperPath, 'utf8');
  const target = 'fs.cpSync(options.tempBuildDir, buildDir, { recursive: true });';
  const replacement = `
  if (fs.existsSync(options.tempBuildDir)) {
    for (const f of fs.readdirSync(options.tempBuildDir)) {
      const s = path.join(options.tempBuildDir, f);
      const d = path.join(buildDir, f);
      if (fs.statSync(s).isDirectory()) {
        fs.cpSync(s, d, { recursive: true });
      } else {
        fs.copyFileSync(s, d);
      }
    }
  }
  `;
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(helperPath, content);
    console.log('[postinstall] Patched helper.js for Windows drive support');
  }
}

// 2. Patch createAssets.js
const createAssetsPath = path.join(__dirname, '..', 'node_modules', '@opennextjs', 'aws', 'dist', 'build', 'createAssets.js');
if (fs.existsSync(createAssetsPath)) {
  let content = fs.readFileSync(createAssetsPath, 'utf8');
  if (!content.includes('__safeCopyDirRecursive')) {
    content = safeCopyFunc + '\n' + content;
  }
  const target1 = 'fs.cpSync(path.join(appBuildOutputPath, ".next/static"), path.join(outputPath, "_next", "static"), { recursive: true });';
  const replacement1 = '__safeCopyDirRecursive(path.join(appBuildOutputPath, ".next/static"), path.join(outputPath, "_next", "static"));';
  
  const target2 = `if (fs.existsSync(appPublicPath)) {
        fs.cpSync(appPublicPath, outputPath, {
            recursive: true,
            dereference: true,
        });
    }`;
  const replacement2 = `if (fs.existsSync(appPublicPath)) {
        __safeCopyDirRecursive(appPublicPath, outputPath);
    }`;

  if (content.includes(target1)) {
    content = content.replace(target1, replacement1);
  }
  if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
  }
  fs.writeFileSync(createAssetsPath, content);
  console.log('[postinstall] Patched createAssets.js for Windows Unicode path support');
}

// 3. Patch copy-package-cli-files.js
const copyCliFilesPath = path.join(__dirname, '..', 'node_modules', '@opennextjs', 'cloudflare', 'dist', 'cli', 'build', 'utils', 'copy-package-cli-files.js');
if (fs.existsSync(copyCliFilesPath)) {
  let content = fs.readFileSync(copyCliFilesPath, 'utf8');
  if (!content.includes('__safeCopyDirRecursive')) {
    content = safeCopyFunc + '\n' + content;
  }
  const target = 'fs.cpSync(sourceDir, destinationDir, { recursive: true });';
  const replacement = '__safeCopyDirRecursive(sourceDir, destinationDir);';
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(copyCliFilesPath, content);
    console.log('[postinstall] Patched copy-package-cli-files.js for Windows Unicode path support');
  }
}
