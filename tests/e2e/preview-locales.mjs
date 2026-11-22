import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Use the actual browser module, not a reimplementation of the layout checks.
const bundle=await build({stdin:{contents:"export * from './lib/game/preview.ts'; export {INITIAL_FILES} from './lib/game/content.ts'; export {starterFiles} from './lib/game/starter-files.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'iife',globalName:'PreviewQA'});
const result=spawnSync('python',[fileURLToPath(new URL('./preview-locales.py',import.meta.url))],{input:JSON.stringify({script:bundle.outputFiles[0].text}),encoding:'utf8',env:process.env});
process.stdout.write(result.stdout??'');
process.stderr.write(result.stderr??'');
if(result.error)throw result.error;
process.exitCode=result.status??1;
