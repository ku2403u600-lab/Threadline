import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bundlePath = path.join(__dirname, 'dist', 'server.js');

let appInstance: any;

if (process.env.NODE_ENV === 'production' && fs.existsSync(bundlePath)) {
  // Production / Cloud Run: run pre-bundled production server
  const mod = await import(pathToFileURL(bundlePath).href);
  appInstance = mod.app || mod.default;
} else {
  // Development / fallback: run source app
  const mod = await import('./src/server/app.js');
  appInstance = mod.app || mod.default;
}

export default appInstance;
export const app = appInstance;
