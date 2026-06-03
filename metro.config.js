const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

/**
 * cliCommand con ruta RELATIVA — obligatorio en Windows si el proyecto
 * está en una carpeta con espacios (ej. "Outletgo Proyecto").
 * NativeWind hace .split(" ") sobre el comando y rompe rutas absolutas con espacios.
 */
module.exports = withNativeWind(config, {
  input: './global.css',
  cliCommand: 'node ./node_modules/tailwindcss/lib/cli.js',
});
