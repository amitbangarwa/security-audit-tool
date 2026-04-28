import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const DIST = path.resolve(__dirname, '../dist');
const OUT = path.resolve(__dirname, '../releases');

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const pkg = require('../package.json');
const version = pkg.version;
const outFile = path.join(OUT, `browser-security-audit-v${version}.zip`);

execSync(`cd "${DIST}" && zip -r "${outFile}" .`);
// biome-ignore lint/suspicious/noConsole: CLI script output
console.log(`Packaged: ${outFile}`);
