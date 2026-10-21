import type {Machine} from './engine.ts';

export function removalArguments(command:string,args:readonly string[]){
 let recursive=false,force=false,options=true;const operands:string[]=[];
 for(const arg of args){
  if(options&&arg==='--'){options=false;continue;}
  if(options&&arg.startsWith('-')&&arg!=='-'){
   if(command==='rm'&&(arg==='--recursive'||/^-[rRf]+$/.test(arg))){recursive ||= arg==='--recursive'||/[rR]/.test(arg);force ||= arg.includes('f');}
   else if(command==='rm'&&arg==='--force')force=true;
   else throw Error(`${command}: unsupported option '${arg}'. Usage: ${command==='rm'?'rm [-rRf] [--] <path...>':'rmdir [--] <directory...>'}`);
  }else operands.push(arg);
 }
 if(!operands.length&&!force)throw Error(`Usage: ${command==='rm'?'rm [-rRf] [--] <path...>':'rmdir [--] <directory...>'}`);
 return {recursive,force,operands};
}

/** Plan the complete removal before mutating the virtual filesystem. Never touches host files. */
export function removeVirtualEntries(machine:Machine,command:string,args:readonly string[],resolve:(name:string)=>string,protect:(path:string)=>void,workspaceRoots:readonly string[]):void{
 const {recursive,force,operands}=removalArguments(command,args);
 const files=new Set<string>(),dirs=new Set<string>();
 const within=(path:string,root:string)=>path===root||path.startsWith(root==='/'?'/':root+'/');
 for(const name of operands){
  const target=resolve(name),directory=machine.dirs.includes(target),file=Object.hasOwn(machine.files,target);
  if(!directory&&!file){if(force)continue;throw Error(`${command}: ${name}: No such file or directory`);}
  if(!directory){
   if(command==='rmdir'||name.endsWith('/'))throw Error(`${command}: ${name}: Not a directory`);
   protect(target);files.add(target);continue;
  }
  if(command==='rm'&&!recursive)throw Error(`rm: ${name}: Is a directory. Use rmdir for an empty folder or rm -r for its contents.`);
  const childFiles=Object.keys(machine.files).filter(p=>within(p,target));
  const childDirs=machine.dirs.filter(p=>within(p,target)&&p!==target);
  if(command==='rmdir'&&(childFiles.some(p=>!files.has(p))||childDirs.some(p=>!dirs.has(p))))throw Error(`rmdir: ${name}: Directory not empty`);
  if(within(machine.cwd,target)||workspaceRoots.some(p=>within(p,target)))throw Error(`${command}: ${name}: Protected workspace or current directory. Change directory or remove a child folder.`);
  for(const p of [target,...childDirs,...childFiles])protect(p);
  dirs.add(target);if(recursive){childDirs.forEach(p=>dirs.add(p));childFiles.forEach(p=>files.add(p));}
 }
 for(const file of files)delete machine.files[file];
 machine.dirs=machine.dirs.filter(p=>!dirs.has(p));
}
