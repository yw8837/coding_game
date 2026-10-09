'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const lib=import('../scripts/steam-preflight-lib.mjs');

function pe(dll=true){const bytes=Buffer.alloc(160);bytes.write('MZ');bytes.writeUInt32LE(64,60);bytes.writeUInt32LE(0x4550,64);bytes.writeUInt16LE(0x8664,68);bytes.writeUInt16LE(dll?0x2000:0,86);bytes.writeUInt16LE(0x20b,88);return bytes;}
async function fixture(t,{appId=1001,qa=false,steam=true}={}){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'codeshift-steam-preflight-'));
 t.after(async()=>{assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));assert.ok(path.basename(root).startsWith('codeshift-steam-preflight-'));await fs.rm(root,{recursive:true,force:true});});
 const packagePath=path.join(root,'content'),source=path.join(root,'source');
 await fs.mkdir(path.join(packagePath,'resources'),{recursive:true});await fs.mkdir(source);
 const write=async(name,content)=>{const file=path.join(source,...name.split('/'));await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,content);};
 for(const [name,value] of Object.entries({
  'package.json':JSON.stringify({name:'codeshift-desktop',version:'0.10.0-rc.0',main:'main.cjs',optionalDependencies:{'steamworks.js':'0.4.0'}}),
  'qa-build.cjs':`'use strict';\nmodule.exports = ${qa};\n`,
  'main.cjs':'module.exports = {};','preload.cjs':'module.exports = {};','steam.cjs':'module.exports = {};',
  'renderer/index.html':'<html>Fixture</html>','renderer/THIRD-PARTY-NOTICES.txt':'Fixture MIT notice\n',
  'renderer/third-party-manifest.json':JSON.stringify({packages:[{name:'fixture',version:'1.0.0'}]}),
 }))await write(name,value);
 if(steam){await write('node_modules/steamworks.js/package.json',JSON.stringify({name:'steamworks.js',version:'0.4.0'}));await write('node_modules/steamworks.js/index.js','module.exports = {};');await write('node_modules/steamworks.js/LICENSE','Fixture MIT license');await write('node_modules/steamworks.js/dist/win64/steamworksjs.win32-x64-msvc.node',pe());await write('node_modules/steamworks.js/dist/win64/steam_api64.dll',pe());}
 const {createPackageWithOptions}=await import('@electron/asar');await createPackageWithOptions(source,path.join(packagePath,'resources/app.asar'),{unpack:'**/*.{node,dll}'});
 await fs.writeFile(path.join(packagePath,'steam-config.json'),JSON.stringify({appId}));await fs.writeFile(path.join(packagePath,'CODE-SHIFT.exe'),pe(false));await fs.writeFile(path.join(packagePath,'steam_api64.dll'),pe());
 for(const [name,value] of [['LICENSE','Fixture Electron license'],['LICENSES.chromium.html','Fixture Chromium notices'],['THIRD-PARTY-NOTICES.txt','Fixture MIT notice\n']])await fs.writeFile(path.join(packagePath,name),value);
 return {root,packagePath,config:{appId:1001,depotId:1002,packagePath,buildOutput:path.join(root,'logs'),description:'CODE:SHIFT reviewed fixture'},out:path.join(root,'steam-pipe')};
}

test('preflight reads synthetic packaged artifacts, generates preview-only VDF and never overwrites',async t=>{
 const {preflight,generateSteamPipe}=await lib,fixtureData=await fixture(t);const result=await preflight(fixtureData.config,{outputDirectory:fixtureData.out});
 assert.equal(result.report.status,'local-artifacts-validated');assert.equal(result.report.steamRuntimeTested,false);assert.equal(result.report.dashboardOwnershipVerified,false);assert.equal(result.report.uploaded,false);
 await assert.rejects(fs.access(fixtureData.out));await assert.rejects(fs.access(fixtureData.config.buildOutput));
 assert.match(result.report.sha256.archive,/^[a-f0-9]{64}$/);
 const files=await generateSteamPipe(result);assert.deepEqual(files,['app_1001.vdf','depot_1002.vdf','preflight.json']);
 const app=await fs.readFile(path.join(fixtureData.out,files[0]),'utf8'),depot=await fs.readFile(path.join(fixtureData.out,files[1]),'utf8');
 assert.match(app, /"AppID" "1001"/);assert.match(app,/"Preview" "1"/);assert.match(app,/"1002" "depot_1002.vdf"/);
 assert.ok(app.includes(fixtureData.packagePath.replaceAll('\\','/')));assert.match(depot,/"DepotID" "1002"/);assert.match(depot,/"recursive" "1"/);
 assert.doesNotMatch(app+depot,/SetLive|YOUR_|password|login/i);
 await assert.rejects(generateSteamPipe(result),/already exist/);
});

test('offline config cannot become Steam-ready through supplied ID or environment',async t=>{
 const data=await fixture(t,{appId:null});const {preflight}=await lib;
 const previous=process.env.CODESHIFT_STEAM_APP_ID;process.env.CODESHIFT_STEAM_APP_ID='1001';
 try{await assert.rejects(preflight(data.config),/Offline packages with appId:null are not Steam-ready/);}finally{if(previous===undefined)delete process.env.CODESHIFT_STEAM_APP_ID;else process.env.CODESHIFT_STEAM_APP_ID=previous;}
});

test('QA archive and missing native wrapper are not Steam release content',async t=>{
 const {preflight}=await lib;const qa=await fixture(t,{qa:true});await assert.rejects(preflight(qa.config),/QA or unrecognized QA flag/);
 const offline=await fixture(t,{steam:false});await assert.rejects(preflight(offline.config),/steamworks.js\/package.json/);
});

test('real IDs, strict credential-free config and VDF injection safety are mandatory',async t=>{
 const data=await fixture(t);const {validateConfig,vdfValue,loadConfig}=await lib;
 for(const appId of [null,480,'1001',0,-1,1.5,0x100000000])assert.throws(()=>validateConfig({...data.config,appId}),/AppID/);
 for(const depotId of [null,480,'1002',1001,0,1.5])assert.throws(()=>validateConfig({...data.config,depotId}),/depot ID/);
 assert.throws(()=>validateConfig({...data.config,password:'do-not-print-this'}),/credentials are not accepted/);
 for(const text of ['bad"\n"SetLive" "public','bad{value','bad\0value'])assert.throws(()=>vdfValue(text),/VDF values/);
 for(const packagePath of ['relative','../content',data.packagePath+'"',data.packagePath+'\n',data.packagePath+'*'])assert.throws(()=>validateConfig({...data.config,packagePath}),/absolute local path/);
 const file=path.join(data.root,'config.json');await fs.writeFile(file,JSON.stringify({...data.config,login:'private-login'}));await assert.rejects(loadConfig(file),/credentials are not accepted/);
 const cli=spawnSync(process.execPath,[path.resolve(__dirname,'../scripts/steam-preflight.mjs'),'--config',file],{encoding:'utf8'});assert.equal(cli.status,1);assert.doesNotMatch(cli.stdout+cli.stderr,/private-login/);
});

test('overlapping depot/log/output directories and development secrets fail before output writes',async t=>{
 const {preflight}=await lib;const data=await fixture(t);
 await assert.rejects(preflight({...data.config,buildOutput:path.join(data.packagePath,'logs')}),/non-overlapping/);
 await assert.rejects(preflight(data.config,{outputDirectory:path.join(data.packagePath,'vdf')}),/outside/);
 await fs.writeFile(path.join(data.packagePath,'steam_appid.txt'),'1001');await assert.rejects(preflight(data.config,{outputDirectory:data.out}),/development, QA or credential/);
 await fs.unlink(path.join(data.packagePath,'steam_appid.txt'));await fs.writeFile(path.join(data.packagePath,'.env'),'TOKEN=secret');await assert.rejects(preflight(data.config),/development, QA or credential/);
 await assert.rejects(fs.access(data.out));
});

test('wrong-architecture SDK, missing artifacts and stale notices fail clearly',async t=>{
 const {preflight}=await lib;const data=await fixture(t);
 const dll=pe();dll.writeUInt16LE(0x14c,68);await fs.writeFile(path.join(data.packagePath,'steam_api64.dll'),dll);await assert.rejects(preflight(data.config),/Windows x64 DLL/);
 await fs.writeFile(path.join(data.packagePath,'steam_api64.dll'),pe());await fs.writeFile(path.join(data.packagePath,'THIRD-PARTY-NOTICES.txt'),'stale');await assert.rejects(preflight(data.config),/notices differ/);
 await fs.writeFile(path.join(data.packagePath,'THIRD-PARTY-NOTICES.txt'),'Fixture MIT notice\n');await fs.unlink(path.join(data.packagePath,'LICENSE'));await assert.rejects(preflight(data.config),/Missing LICENSE/);
 await assert.rejects(preflight({...data.config,packagePath:path.join(data.root,'missing')}),/content directory is missing/);
});
