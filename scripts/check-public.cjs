const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const ignored = new Set(['.git', 'node_modules', '.next', 'coverage']);
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (ignored.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) return [];
    return entry.isDirectory() ? walk(full) : [path.relative(root, full).replaceAll('\\', '/')];
  });
}
let files;
try { files = cp.execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean); }
catch { files = []; }
if (!files.length) files = walk(root);
const failures = [];
for (const file of files) {
  const base = path.basename(file);
  if ((base.startsWith('.env') && base !== '.env.example') ||
      (file.startsWith('uploads/') && file !== 'uploads/.gitkeep') ||
      /(?:\.ejson|\.bson|\.dump|\.pem|\.key|\.p12|\.pfx|\.log|\.bak|\.backup|\.zip|\.tar|\.gz)$/i.test(file) ||
      ['ADMIN-LOCAL.txt', 'deployment-notes.txt'].includes(base)) failures.push(`${file}: private/runtime file`);
  if (/\.(?:jpg|jpeg|png|webp|ico|gif|woff2?)$/i.test(file)) continue;
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text) ||
      /gh[pousr]_[A-Za-z0-9]{30,}/.test(text) ||
      /mongodb(?:\+srv)?:\/\/[^\s"']+:[^\s"']+@/.test(text)) failures.push(`${file}: possible embedded credential`);
  if (base === '.env.example') {
    for (const line of text.split(/\r?\n/)) {
      if (/^(?:JWT_SECRET|DEFAULT_ADMIN_PASSWORD|SMTP_PASS|TELEGRAM_BOT_TOKEN|PEXELS_API_KEY)=.+/.test(line.trim())) failures.push(`${file}: secret example must be blank`);
    }
  }
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Publication check passed: ${files.length} files; no forbidden files or recognized embedded credentials.`);
