import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  // Search in user-visible strings for the abbreviation "AS" or "Atomic Skill"
  const regex = /(Atomic\s+Skill|[^A-Za-z]AS[^A-Za-z])/;
  if (regex.test(text)) {
    console.error(`Prohibited term found in ${path.relative(root, file)}`);
    return false;
  }
  return true;
}

function walk(dir) {
  let ok = true;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      ok &= walk(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts') || full.endsWith('.json')) {
      ok &= scanFile(full);
    }
  }
  return ok;
}

let ok = true;
ok &= walk(path.join(root, 'src'));
ok &= walk(path.join(root, 'i18n'));

if (!ok) {
  process.exit(1);
} else {
  console.log('UI terminology check passed');
}
