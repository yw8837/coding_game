export type TerminalInput={command:string;redirect:null|{append:boolean;target:string}};

/** Recognize only stdout file redirection. Quoted/escaped operators stay data.
 * Reject the entire input before any simulated command can mutate state. */
export function parseTerminalInput(input:string,tokenize:(input:string)=>string[]):TerminalInput{
 let quote='',escape=false,redirect=-1,width=0;
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(escape){escape=false;continue;}
  if(c==='\\'&&quote!=="'"){escape=true;continue;}
  if(quote){if(c===quote)quote='';else if(quote==='"'&&(c==='`'||c==='$'&&input[i+1]==='('))throw Error('shell: command substitution is not supported. Pass literal text in single quotes.');continue;}
  if(c==='"'||c==="'"){quote=c;continue;}
  if(c==='`'||c==='$'&&input[i+1]==='(')throw Error('shell: command substitution is not supported. Pass literal text in single quotes.');
  if(c==='&'||c==='|'||c===';'||c==='<'||c==='\n'||c==='\r')throw Error('shell: command chains, pipes, background jobs and input redirection are not supported. Run each command separately.');
  if(c==='>'){
   if(redirect>=0||/(?:^|\s)\d+$/.test(input.slice(0,i)))throw Error('shell: only echo/cat > file and >> file are supported.');
   redirect=i;width=input[i+1]==='>'?2:1;i+=width-1;
  }
 }
 // Delegate quote/escape validation to the existing tokenizer.
 tokenize(input);
 if(redirect<0)return {command:input,redirect:null};
 const command=input.slice(0,redirect).trim(),args=tokenize(command),targets=tokenize(input.slice(redirect+width));
 if(!['echo','cat'].includes(args[0]))throw Error('shell: stdout redirection is supported for echo and cat.');
 if(targets.length!==1||!targets[0])throw Error('shell: redirection requires exactly one destination file.');
 return {command,redirect:{append:width===2,target:targets[0]}};
}

export function terminalArgumentError(cmd:string,args:string[]):string|null{
 const option=(allowed:string[])=>{const end=cmd==='cat'?args.indexOf('--'):-1,invalid=args.slice(0,end<0?args.length:end).find(a=>a.startsWith('-')&&a!=='-'&&!allowed.includes(a));return invalid?`${cmd}: unsupported option '${invalid}'. Supported: ${allowed.join(', ')||'no options'}.`:null;};
 const count=(max:number,usage:string)=>args.length>max?`${cmd}: too many arguments. Usage: ${usage}`:null;
 if(['clear','pwd','whoami','ps','exit','help'].includes(cmd))return option([])||count(0,cmd);
 if(cmd==='cd')return option([])||count(1,'cd [directory|-]');
 if(cmd==='ls'){
  const end=args.indexOf('--'),flags=args.slice(0,end<0?args.length:end).filter(a=>a.startsWith('-'));
  const bad=flags.find(a=>!/^-[alh1]+$/.test(a));
  return bad?`ls: unsupported option '${bad}'. Supported: -a, -l, -h, -1 (combined forms such as -la).`:args.filter(a=>!a.startsWith('-')||end>=0&&args.indexOf(a)>end).length>1?'ls: list one path at a time. Usage: ls [-alh1] [path]':null;
 }
 if(cmd==='echo')return args[0]?.startsWith('-')&&args[0]!=='-n'?`echo: unsupported option '${args[0]}'. Supported: -n.`:null;
 if(['cat','touch','cp','mv','rm'].includes(cmd))return option([])||(['touch','rm'].includes(cmd)?count(1,`${cmd} <file>`):null);
 if(cmd==='mkdir')return option(['-p']);
 if(cmd==='uname')return option(['-a'])||count(1,'uname [-a]');
 if(cmd==='git'){
  const [sub,...rest]=args;
  if(['status','diff','log','pull'].includes(sub))return rest.length?`git ${sub}: unsupported argument '${rest[0]}'. Usage: git ${sub}`:null;
  if(sub==='clone'&&rest.length>2)return 'git clone: usage: git clone <URL> [directory]';
  if(sub==='commit'&&(rest.length!==2||rest[0]!=='-m'))return 'git commit: usage: git commit -m "message"';
  if(sub==='push'&&rest.length>2)return 'git push: usage: git push [origin main]';
  if(sub==='add'&&rest.some(a=>a.startsWith('-')))return 'git add: supported operands: file paths or .; no options.';
 }
 if(cmd==='apt'||cmd==='sudo'){
  const offset=cmd==='sudo'?1:0,sub=args[offset],rest=args.slice(offset+1);
  if(cmd==='sudo'&&args[0]!=='apt')return 'sudo: supported commands: apt update, apt install <packages>, apt list.';
  if(['update','list'].includes(sub)&&rest.length)return `${cmd} ${sub}: no extra arguments are supported.`;
  if(sub==='install'){const bad=rest.find(a=>a.startsWith('-')&&!['-y','--yes'].includes(a));if(bad)return `${cmd} install: unsupported option '${bad}'. Supported: -y, --yes.`;}
 }
 if(cmd==='npm'&&args.length>(args[0]==='run'?2:1))return 'npm: supported commands: install, i, --version, -v, run dev, test, run build; no extra options.';
 if(cmd==='node')return args[0]==='--test'?count(2,'node --test <job>.test.cjs'):['--version','-v'].includes(args[0])?count(1,'node --version'):option([])||count(3,'node run.cjs <function.js> <input.json>');
 if(['code','python3','ssh','pkill'].includes(cmd))return count(1,`${cmd} <argument>`);
 if(cmd==='curl')return option([])||count(1,'curl <URL>');
 return null;
}
