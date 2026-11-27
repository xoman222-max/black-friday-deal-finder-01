// DealDrop — a Black Friday deal finder, entered in make.fun's
// black-friday-deal-finder-01 bounty (Node 22, standard library only).
//
// The site itself is plain static files under app/: index.html opens in a
// desktop browser and on a phone, needs no build step and makes no network
// request at run time. Its deals live in its own files (app/deals.js), each
// one checked by the agent that built this entry on 2026-11-27 and linked
// out to the store that sells it.
//
// This program hands the site in: it copies app/ and screenshots/ from
// beside this file into /output and writes /output/dossier.json, the
// summary the judge reads (the screenshots, the first load's files and
// bytes, and the site's source), using the vendored make.fun library.
// vendor/makefun-frontend.ts is the kit's copy, unchanged: the scorer
// requires dossier.json to be byte for byte what its own copy writes.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Serve the site locally while working on it with `node serve.ts`, then
// open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
// Clear any earlier run's copies first: without this, a file removed from
// app/ or screenshots/ since the last run would silently survive in /output.
rmSync(join(out, 'app'), { recursive: true, force: true });
rmSync(join(out, 'screenshots'), { recursive: true, force: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files and directories in app/ or 16 MiB of
// app files: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
