// Runs every browser test against a fresh build and prints one summary.
//   node tests/run.js            all tests
//   node tests/run.js places gui only the named ones
// Each test prints PASS / FAIL lines; any page error is also counted as a failure.
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const ORDER = ['shell', 'ledger', 'tiles', 'srd', 'saving', 'stability', 'share', 'hist', 'r24', 'phone', 'camp', 'merge', 'places', 'civic', 'gui', 'guilds', 'inter', 'move', 'persist', 'realmbug', 'e1', 'monkey', 'pan', 'a11y', 'flow', 'gjoin', 'scene', 'downtime', 'trade'];
const want = process.argv.slice(2);
const list = (want.length ? want : ORDER).filter((n) => fs.existsSync(path.join(__dirname, n + '.js')));

fs.mkdirSync('/tmp/claude-0/dl', { recursive: true });
console.log('Building…');
execFileSync('python3', ['build.py'], { cwd: root, stdio: 'ignore' });
execFileSync('node', ['--check', 'check.js'], { cwd: root });
execFileSync('python3', ['mkdbg.py'], { cwd: root });

let pass = 0, fail = 0;
const failures = [];
for (const name of list) {
  const t0 = Date.now();
  const r = spawnSync('node', [path.join(__dirname, name + '.js')], { cwd: root, encoding: 'utf8', timeout: 600000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const P = (out.match(/^PASS /gm) || []).length, F = out.match(/^FAIL .*/gm) || [];
  const errLine = /^(?:errors|ERR|ERROR at step)[ \t]+(?!none\b)(\S.*)$/m.exec(out);
  const pageErr = errLine ? 1 : 0;
  const crashed = r.status !== 0 && !F.length;   // a test that stops part-way is a failure even if earlier checks passed
  pass += P; fail += F.length + pageErr + (crashed ? 1 : 0);
  for (const f of F) failures.push(name + ': ' + f.slice(5));
  if (pageErr) failures.push(name + ': page error ' + errLine[1].slice(0, 200));
  if (crashed) failures.push(name + ': crashed ' + out.trim().split('\n').slice(-3).join(' / ').slice(0, 300));
  console.log((F.length || pageErr || crashed ? '✗ ' : '✓ ') + name.padEnd(10) + String(P).padStart(3) + ' passed' + (F.length ? ', ' + F.length + ' failed' : '') + '  (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
}
console.log('\n' + pass + ' checks passed, ' + fail + ' failed');
for (const f of failures) console.log('  - ' + f);
process.exit(fail ? 1 : 0);
