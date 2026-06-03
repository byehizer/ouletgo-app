/**
 * Pre-genera el CSS de NativeWind para android/ios.
 * Evita timeout de 60s en el primer bundle (común en OneDrive o discos lentos).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cacheDir = path.join(__dirname, '..', 'node_modules', '.cache', 'nativewind');
const cli = path.join(__dirname, '..', 'node_modules', 'tailwindcss', 'lib', 'cli.js');
const input = path.join(__dirname, '..', 'global.css');

if (!fs.existsSync(cli)) {
  process.exit(0);
}

fs.mkdirSync(cacheDir, { recursive: true });

for (const platform of ['android', 'ios']) {
  const output = path.join(cacheDir, `global.css.${platform}.css`);
  execSync(
    `node "${cli}" --input "${input}" --output "${output}"`,
    {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, NATIVEWIND_NATIVE: platform },
    },
  );
}

console.log('NativeWind CSS prebuilt for android + ios');
