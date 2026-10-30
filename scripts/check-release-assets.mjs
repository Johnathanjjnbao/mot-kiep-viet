import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
const target = new URL(process.argv[2] ?? 'https://johnathanjjnbao.github.io/mot-kiep-viet/');
const directory = process.env.MKV_ASSET_DIR ?? 'dist';
const local = readFileSync(join(directory, 'index.html'), 'utf8');
const response = await fetch(target, { cache: 'no-store' });
if (!response.ok) throw new Error('Live HTML unavailable');
const remote = await response.text();
const assets = (html) =>
  [...html.matchAll(/(?:src|href)="(\/mot-kiep-viet\/assets\/index-[^"]+\.(?:js|css))"/g)]
    .map((m) => m[1])
    .sort();
const expected = assets(local);
if (expected.length !== 2 || JSON.stringify(expected) !== JSON.stringify(assets(remote)))
  throw new Error('Live entry assets do not match release build');
expected.push('/mot-kiep-viet/sw.js');
const checks = [];
const sha = (b) => createHash('sha256').update(b).digest('hex');
for (const path of expected) {
  const r = await fetch(new URL(path, target.origin), { cache: 'no-store' });
  if (!r.ok) throw new Error('Live asset unavailable');
  const bytes = Buffer.from(await r.arrayBuffer()),
    localBytes = readFileSync(join(directory, path.replace('/mot-kiep-viet/', '')));
  if (sha(bytes) !== sha(localBytes)) throw new Error('Live asset content mismatch');
  checks.push({ path, sha256: sha(bytes), status: 'VERIFIED PASS' });
}
const report = {
  url: target.href,
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  status: 'VERIFIED PASS',
  checks,
};
writeFileSync(
  process.env.MKV_ASSET_REPORT ?? 'docs/evidence/v03-live-assets.json',
  JSON.stringify(report, null, 2) + '\n',
);
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
