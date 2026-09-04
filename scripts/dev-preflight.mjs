import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env');

if (!fs.existsSync(envPath)) {
  console.warn(
    'No .env file found. Copy .env.example or add your environment variables before running the app.',
  );
}

console.log('Development preflight complete.');
