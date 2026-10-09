import {loadConfig,preflight,generateSteamPipe} from './steam-preflight-lib.mjs';

function args(argv){
 const options={};for(let i=0;i<argv.length;i++){
  const flag=argv[i];if(flag==='--help')return {help:true};
  if(!['--config','--out'].includes(flag)||options[flag]||!argv[i+1]||argv[i+1].startsWith('--'))throw Error('Usage: node desktop/scripts/steam-preflight.mjs --config <absolute JSON path> [--out <absolute output directory>]');
  options[flag]=argv[++i];
 }if(!options['--config'])throw Error('Supply --config with real AppID, depot ID and absolute package/build-log paths. See desktop/steam/README.md.');return options;
}
try{
 const options=args(process.argv.slice(2));if(options.help){console.log('Read-only check: --config <absolute JSON path>\nGenerate preview VDFs: --config <absolute JSON path> --out <absolute output directory>\nNo Steam client, credentials, upload or publishing operation is used.');}
 else{const result=await preflight(await loadConfig(options['--config']),{outputDirectory:options['--out']});if(options['--out'])result.report.generatedFiles=await generateSteamPipe(result);console.log(JSON.stringify(result.report,null,2));}
}catch(error){console.error('Steam preflight failed: '+(error instanceof Error?error.message:'invalid configuration or artifacts'));process.exitCode=1;}
