import {readFile,stat,lstat,readdir,realpath,open,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {createRequire} from 'node:module';
import {extractFile,statFile,listPackage} from '@electron/asar';

const require=createRequire(import.meta.url);
const {validAppId}=require('../steam.cjs');
const keys=new Set(['appId','depotId','packagePath','buildOutput','description']);
const native='node_modules/steamworks.js/dist/win64/steamworksjs.win32-x64-msvc.node';
const sdk='node_modules/steamworks.js/dist/win64/steam_api64.dll';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=message=>{throw new Error(message);};

export function vdfValue(value){
 if(typeof value!=='string'||/["{}\x00-\x1f\x7f]/.test(value))fail('VDF values cannot contain quotes, braces or control characters.');
 return '"'+value.replaceAll('\\','/')+'"';
}
export function validateConfig(config){
 if(!config||typeof config!=='object'||Array.isArray(config)||Object.keys(config).some(key=>!keys.has(key)))fail('Config must contain only appId, depotId, packagePath, buildOutput and optional description; credentials are not accepted.');
 if(!validAppId(config.appId))fail('Supply the real numeric Steam AppID; missing, invalid and example AppID 480 are rejected.');
 if(!Number.isSafeInteger(config.depotId)||config.depotId<1||config.depotId>0xffffffff||config.depotId===480||config.depotId===config.appId)fail('Supply the real Windows depot ID, distinct from the AppID.');
 for(const name of ['packagePath','buildOutput'])validatePath(config[name],name);
 if(config.description!==undefined&&(typeof config.description!=='string'||!config.description.trim()||config.description.length>160))fail('description must be a nonempty string of at most 160 characters.');
 vdfValue(config.description??'CODE:SHIFT Windows candidate');
 return {...config};
}
export function validatePath(value,label){
 if(typeof value!=='string'||!path.isAbsolute(value)||/^(?:\\\\|\/\/)/.test(value)||/["{}\x00-\x1f\x7f]/.test(value)||value.includes('*')||value.includes('?'))fail(`${label} must be an absolute local path without quotes, braces, wildcards or control characters.`);
 // Reject Windows device/ADS paths, including drive-relative and extended paths.
 if(process.platform==='win32'&&(!/^[A-Za-z]:[\\/]/.test(value)||value.slice(2).includes(':')))fail(`${label} must be a regular drive-qualified local Windows path.`);
 return path.resolve(value);
}
export async function loadConfig(file){
 validatePath(file,'config path');
 let raw;try{const info=await stat(file);if(!info.isFile()||info.size>4096)fail('Config must be a JSON file no larger than 4096 bytes.');raw=await readFile(file,'utf8');}catch(error){if(error.message.startsWith('Config must'))throw error;fail('Cannot read the supplied config file.');}
 let config;try{config=JSON.parse(raw);}catch{fail('Config must be valid JSON.');}
 return validateConfig(config);
}
async function physicalPath(value){
 let existing=path.resolve(value),tail=[];
 for(;;){try{return path.join(await realpath(existing),...tail);}catch(error){if(error.code!=='ENOENT')fail('Cannot resolve a supplied directory.');const parent=path.dirname(existing);if(parent===existing)fail('Path has no existing local ancestor.');tail.unshift(path.basename(existing));existing=parent;}}
}
const inside=(root,candidate)=>{const relative=path.relative(root,candidate);return relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative));};
async function regularFile(file,label){
 try{const info=await lstat(file);if(!info.isFile()||info.size===0)fail(`${label} must be a nonempty regular file.`);return info;}catch(error){if(error.message.startsWith(label))throw error;fail(`Missing ${label}. Rebuild a Steam package before preflight.`);}
}
async function scan(root){
 let count=0;const walk=async directory=>{for(const entry of await readdir(directory,{withFileTypes:true})){
  if(++count>20000)fail('Package contains too many entries to inspect.');
  if(entry.isSymbolicLink())fail('Package contains a symbolic link; only regular depot files are accepted.');
  if(/^(?:steam_appid\.txt|QA-NOT-FOR-DISTRIBUTION\.txt|\.env(?:\..*)?|ssfn\d+|config\.vdf|loginusers\.vdf|.*\.(?:sentry|pem|pfx|key))$/i.test(entry.name))fail('Package contains development, QA or credential files; remove them from the depot content.');
  if(entry.isDirectory())await walk(path.join(directory,entry.name));else if(!entry.isFile())fail('Package contains a non-regular filesystem entry.');
 }};await walk(root);return count;
}
async function checkPE(file,label,dll){
 await regularFile(file,label);const handle=await open(file,'r');
 try{const dos=Buffer.alloc(64);if((await handle.read(dos,0,64,0)).bytesRead!==64||dos.toString('ascii',0,2)!=='MZ')fail(`${label} is not a Windows PE binary.`);
  const offset=dos.readUInt32LE(60);if(offset<64||offset>262144)fail(`${label} has an invalid PE header.`);
  const pe=Buffer.alloc(26);if((await handle.read(pe,0,26,offset)).bytesRead!==26||pe.readUInt32LE(0)!==0x4550||pe.readUInt16LE(4)!==0x8664||pe.readUInt16LE(24)!==0x20b||!!(pe.readUInt16LE(22)&0x2000)!==dll)fail(`${label} must be a Windows x64 ${dll?'DLL':'executable'} (PE32+).`);
 }finally{await handle.close();}
}
function archivedFile(archive,name){
 try{const normalized=path.normalize(name),info=statFile(archive,normalized,false);if('files'in info||'link'in info||!info.size)fail('invalid');return {info,bytes:extractFile(archive,normalized,false)};}catch{fail(`Missing or invalid packaged ${name}. Rebuild with package.mjs --steam.`);}
}
function archivedJSON(archive,name){try{return JSON.parse(archivedFile(archive,name).bytes.toString('utf8'));}catch(error){if(error.message.startsWith('Missing'))throw error;fail(`Packaged ${name} is not valid JSON.`);}}

/** Reads files only; never loads the native Steam binding or invokes SteamCMD. */
export async function preflight(config,{outputDirectory}={}){
 config=validateConfig(config);
 const packagePath=await physicalPath(config.packagePath),buildOutput=await physicalPath(config.buildOutput),out=outputDirectory?await physicalPath(validatePath(outputDirectory,'output directory')):null;
 let info;try{info=await lstat(config.packagePath);}catch{fail('Packaged content directory is missing. Run package.mjs --steam with the real AppID.');}
 if(!info.isDirectory()||info.isSymbolicLink())fail('packagePath must be a regular directory.');
 if(inside(packagePath,buildOutput)||inside(buildOutput,packagePath))fail('Build logs and depot content must be separate, non-overlapping directories.');
 if(out&&(inside(packagePath,out)||inside(out,packagePath)))fail('Generated VDFs must be outside, and not contain, depot content.');
 const configFile=path.join(packagePath,'steam-config.json');await regularFile(configFile,'packaged steam-config.json');
 let packagedConfig;try{const raw=await readFile(configFile,'utf8');if(raw.length>4096)fail('invalid');packagedConfig=JSON.parse(raw);}catch{fail('Packaged Steam config is invalid.');}
 if(!packagedConfig||packagedConfig.appId!==config.appId||Object.keys(packagedConfig).some(key=>key!=='appId'))fail('Packaged Steam AppID does not match the supplied real AppID. Offline packages with appId:null are not Steam-ready. Rebuild with --steam.');
 for(const file of ['LICENSE','LICENSES.chromium.html','THIRD-PARTY-NOTICES.txt','resources/app.asar'])await regularFile(path.join(packagePath,file),file);
 await checkPE(path.join(packagePath,'CODE-SHIFT.exe'),'CODE-SHIFT.exe',false);
 await checkPE(path.join(packagePath,'steam_api64.dll'),'root Steam SDK DLL',true);
 const files=await scan(packagePath);
 const archive=path.join(packagePath,'resources/app.asar');
 const entries=listPackage(archive);for(const entry of entries){
  if(/(?:^|[/\\])(?:steam_appid\.txt|QA-NOT-FOR-DISTRIBUTION\.txt|\.env(?:\.[^/\\]*)?|ssfn\d+|config\.vdf|loginusers\.vdf|[^/\\]*\.(?:sentry|pem|pfx|key))$/i.test(entry))fail('App archive contains development, QA or credential files.');
  const stat=statFile(archive,entry.replace(/^[/\\]+/,''),false);if('link'in stat)fail('App archive contains a symbolic link.');
 }
 const qa=archivedFile(archive,'qa-build.cjs').bytes.toString('utf8');if(!/^\s*['"]use strict['"];\s*module\.exports\s*=\s*false;\s*$/.test(qa))fail('QA or unrecognized QA flag in app archive; rebuild the production Steam package.');
 const manifest=archivedJSON(archive,'package.json');if(manifest.name!=='codeshift-desktop'||manifest.main!=='main.cjs'||typeof manifest.version!=='string')fail('App archive does not contain the expected CODE:SHIFT desktop application.');
 archivedFile(archive,'main.cjs');archivedFile(archive,'preload.cjs');archivedFile(archive,'steam.cjs');archivedFile(archive,'renderer/index.html');
 const notices=archivedFile(archive,'renderer/THIRD-PARTY-NOTICES.txt').bytes;if(!(await readFile(path.join(packagePath,'THIRD-PARTY-NOTICES.txt'))).equals(notices))fail('External and renderer third-party notices differ. Rebuild the package.');
 const thirdParty=archivedJSON(archive,'renderer/third-party-manifest.json');if(!Array.isArray(thirdParty.packages)||!thirdParty.packages.length)fail('Renderer third-party package manifest is missing or empty.');
 const wrapper=archivedJSON(archive,'node_modules/steamworks.js/package.json');if(wrapper.name!=='steamworks.js'||wrapper.version!==manifest.optionalDependencies?.['steamworks.js'])fail('Packaged Steam wrapper version differs from the desktop pinned version.');
 archivedFile(archive,'node_modules/steamworks.js/index.js');archivedFile(archive,'node_modules/steamworks.js/LICENSE');
 for(const [name,label] of [[native,'Windows Steam native binding'],[sdk,'unpacked Steam SDK DLL']]){
  const {info,bytes}=archivedFile(archive,name);if(!info.unpacked)fail(`${label} must be outside ASAR.`);
  if(info.integrity?.algorithm!=='SHA256'||digest(bytes)!==info.integrity.hash)fail(`${label} does not match the ASAR integrity record. Rebuild the package.`);
  await checkPE(path.join(archive+'.unpacked',...name.split('/')),label,true);
 }
 return {config:{...config,packagePath,buildOutput},outputDirectory:out,report:{status:'local-artifacts-validated',appId:config.appId,depotId:config.depotId,version:manifest.version,platform:'win32-x64',files,preview:true,steamRuntimeTested:false,dashboardOwnershipVerified:false,uploaded:false,cloudConfigured:false,sha256:{archive:digest(await readFile(archive)),native:digest(await readFile(path.join(archive+'.unpacked',...native.split('/')))),rootSteamSDK:digest(await readFile(path.join(packagePath,'steam_api64.dll')))}}};
}

export function steamPipeVDF(config){
 validateConfig(config);const id=String(config.appId),depot=String(config.depotId),content=vdfValue(config.packagePath),logs=vdfValue(config.buildOutput),description=vdfValue(config.description??'CODE:SHIFT Windows candidate');
 return {
  app:`"AppBuild"\n{\n  "AppID" "${id}"\n  "Desc" ${description}\n  "BuildOutput" ${logs}\n  "ContentRoot" ${content}\n  "Preview" "1"\n  "Depots"\n  {\n    "${depot}" "depot_${depot}.vdf"\n  }\n}\n`,
  depot:`"DepotBuildConfig"\n{\n  "DepotID" "${depot}"\n  "ContentRoot" ${content}\n  "FileMapping"\n  {\n    "LocalPath" "*"\n    "DepotPath" "."\n    "recursive" "1"\n  }\n  "FileExclusion" "steam_appid.txt"\n  "FileExclusion" "*.pdb"\n}\n`,
 };
}
export async function generateSteamPipe(result){
 if(!result.outputDirectory)fail('Supply an explicit --out directory to generate SteamPipe files.');
 const {config}=result,output=result.outputDirectory,files=[`app_${config.appId}.vdf`,`depot_${config.depotId}.vdf`,'preflight.json'];
 for(const name of files){try{await lstat(path.join(output,name));fail('Generated files already exist; choose a new output directory to preserve the reviewed configuration.');}catch(error){if(error.code!=='ENOENT')throw error;}}
 const vdf=steamPipeVDF(config);await mkdir(output,{recursive:true});await mkdir(config.buildOutput,{recursive:true});
 await writeFile(path.join(output,files[0]),vdf.app,{flag:'wx'});await writeFile(path.join(output,files[1]),vdf.depot,{flag:'wx'});await writeFile(path.join(output,files[2]),JSON.stringify(result.report,null,2)+'\n',{flag:'wx'});
 return files;
}
