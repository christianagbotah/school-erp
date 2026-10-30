// Persistent dev-server launcher — spawns `next dev` fully detached
// (double-fork equivalent: detached + unref), so it survives the end of the
// shell command that started it. Usage: node scripts/daemon-dev.mjs
import { spawn } from 'node:child_process';
import { openSync } from 'node:fs';

const log = openSync('/home/z/my-project/dev.log', 'a');
const err = openSync('/home/z/my-project/dev.log', 'a');
const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '-p', '3000'],
  { cwd: '/home/z/my-project', detached: true, stdio: ['ignore', log, err] }
);
child.unref();
console.log('dev server daemonized, pid:', child.pid);
