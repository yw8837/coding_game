import type {GameState} from './engine.ts';
import {STUDIO_ROOT} from './studio.ts';

/** Old versions allowed ordinary player work at this path. Archive that tree intact before reserving it. */
export function migrateLegacyStudioWorkspace(state:GameState):string|null{
 const local=state.machines.local;
 const inside=(path:string)=>path===STUDIO_ROOT||path.startsWith(STUDIO_ROOT+'/');
 const referencePaths=[local.cwd,...local.dependencies,...local.pythonDeps,...[local.frontendRoot,local.backendRoot,state.repo?.root].filter((path):path is string=>typeof path==='string'),...state.history.filter(row=>row.machine==='local').map(row=>row.cwd)];
 const paths=[...Object.keys(local.files),...local.dirs,...referencePaths];
 if(!paths.some(inside))return null;
 // This prefix is shorter than workbench, so even existing 300-character paths remain bounded.
 let archive='';
 const occupiedRoots=new Set(paths.map(path=>path.split('/').slice(0,4).join('/')));
 for(let id=1;id<=1_000_000;id++){
  const candidate='/home/dev/old-studio-'+id;
  if(!occupiedRoots.has(candidate)){archive=candidate;break;}
 }
 if(!archive||archive.length>STUDIO_ROOT.length)throw Error('No safe archive path is available for the old studio workspace');
 const relocate=(path:string)=>inside(path)?archive+path.slice(STUDIO_ROOT.length):path;
 local.files=Object.fromEntries(Object.entries(local.files).map(([path,source])=>[relocate(path),source]));
 local.dirs=local.dirs.map(relocate);
 local.cwd=relocate(local.cwd);
 local.dependencies=local.dependencies.map(relocate);local.pythonDeps=local.pythonDeps.map(relocate);
 if(local.frontendRoot!==null)local.frontendRoot=relocate(local.frontendRoot);
 if(local.backendRoot!==null)local.backendRoot=relocate(local.backendRoot);
 if(state.repo)state.repo.root=relocate(state.repo.root);
 for(const row of state.history)if(row.machine==='local')row.cwd=relocate(row.cwd);
 // Make the migration visible. Sources, logs, command text and server filesystem are retained byte for byte.
 state.notice+=(state.notice?'\n':'')+`Legacy workspace preserved: ${STUDIO_ROOT} → ${archive}`;
 state.logs.push(`[studio migration] ${STUDIO_ROOT} → ${archive}`);
 return archive;
}
