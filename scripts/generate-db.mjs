import {realpathSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cli=path.join(root,'node_modules/drizzle-kit/bin.cjs');
// A pnpm virtual store may live outside the checkout. Keep the CLI's ESM
// resolution at the project while retaining its own CommonJS dependencies.
const dependencies=path.dirname(path.dirname(realpathSync(cli)));
const result=spawnSync(process.execPath,['--preserve-symlinks-main',cli,'generate'],{cwd:root,stdio:'inherit',env:{...process.env,NODE_PATH:[dependencies,path.join(root,'node_modules'),process.env.NODE_PATH].filter(Boolean).join(path.delimiter)}});
process.exit(result.status??1);
