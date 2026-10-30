import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
const patterns = [
  /sb_secret_[A-Za-z0-9_-]{20,}/,
  /gh[pousr]_[A-Za-z0-9]{36,}/,
  /github_pat_[A-Za-z0-9_]{60,}/,
  /sk-(?:ant-)?[A-Za-z0-9_-]{40,}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /xox[baprs]-[A-Za-z0-9-]{20,}/,
  /AIza[0-9A-Za-z_-]{35}/,
  /(?:postgres(?:ql)?|mongodb(?:\+srv)?|mysql):\/\/[^\s:]+:[^\s@]+@/,
];
const findings = [];
let scanned = 0;
function scan(buffer, label) {
  if (buffer.subarray(0, 512).includes(0)) return;
  scanned++;
  const text = buffer.toString('utf8');
  const privateJwt = [
    ...text.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{20,}/g),
  ].some(([token]) => {
    try {
      return ['service_role', 'authenticated'].includes(
        JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).role,
      );
    } catch {
      return false;
    }
  });
  if (privateJwt || patterns.some((p) => p.test(text))) findings.push(label);
}
function scanBundle(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) scanBundle(path);
    else scan(readFileSync(path), `bundle:${path}`);
  }
}
if (existsSync('dist')) scanBundle('dist');
for (const file of git(['ls-files', '--cached', '--others', '--exclude-standard'])
  .trim()
  .split('\n')
  .filter(Boolean))
  scan(readFileSync(file), file);
for (const line of git(['rev-list', '--objects', '--all']).trim().split('\n')) {
  const id = line.split(' ')[0];
  if (git(['cat-file', '-t', id]).trim() === 'blob')
    scan(
      execFileSync('git', ['cat-file', 'blob', id], { maxBuffer: 20 * 1024 * 1024 }),
      `history:${id}`,
    );
}
process.stdout.write(
  JSON.stringify(
    {
      scope: 'working files, public dist assets and all reachable Git blobs',
      textObjectsScanned: scanned,
      findings,
    },
    null,
    2,
  ) + '\n',
);
if (findings.length) process.exitCode = 1;
