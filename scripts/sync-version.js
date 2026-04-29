import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
const manifestPath = path.join(root, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

manifest.version = pkg.version;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

// biome-ignore lint/suspicious/noConsole: CLI script output
console.log(`manifest.json version synced to ${pkg.version}`);
