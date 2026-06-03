/**
 * Inicia Expo forzando la IP de Wi-Fi en la URL del QR.
 * En Windows, --lan a veces sigue mostrando 127.0.0.1 por adaptadores virtuales
 * (VirtualBox 192.168.56.x, Hyper-V 172.x.x.x).
 */
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

const VIRTUAL_PREFIXES = ['192.168.56.', '172.16.', '172.17.', '172.18.', '172.19.', '172.30.', '172.31.'];

function isVirtualIp(ip) {
  return VIRTUAL_PREFIXES.some((prefix) => ip.startsWith(prefix));
}

function getWifiIp() {
  const interfaces = os.networkInterfaces();

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    const lower = name.toLowerCase();
    if (!lower.includes('wi-fi') && !lower.includes('wifi') && !lower.includes('wlan')) {
      continue;
    }
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal && !addr.address.startsWith('169.254.')) {
        return addr.address;
      }
    }
  }

  for (const addrs of Object.values(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (
        addr.family === 'IPv4' &&
        !addr.internal &&
        !addr.address.startsWith('169.254.') &&
        !isVirtualIp(addr.address)
      ) {
        return addr.address;
      }
    }
  }

  return null;
}

const lanIp = getWifiIp();
if (!lanIp) {
  console.error('No se encontró IP de red local. Usá: npx expo start --tunnel');
  process.exit(1);
}

console.log(`\nOutletGo — LAN forzado: ${lanIp}`);
console.log(`En el teléfono (misma Wi-Fi) probá: http://${lanIp}:8081`);
console.log('Modo: development build (OutletGo instalado con run:android)\n');

const projectRoot = path.join(__dirname, '..');
const expoCli = path.join(projectRoot, 'node_modules', 'expo', 'bin', 'cli');
const userArgs = process.argv.slice(2);
const args = ['start', '--host', 'lan', '--dev-client', ...userArgs];

// Usar node + ruta al CLI (evita que Windows parta la ruta en espacios como "Outletgo Proyecto")
const child = spawn(process.execPath, [expoCli, ...args], {
  stdio: 'inherit',
  cwd: projectRoot,
  env: {
    ...process.env,
    REACT_NATIVE_PACKAGER_HOSTNAME: lanIp,
  },
});

child.on('exit', (code) => process.exit(code ?? 0));
