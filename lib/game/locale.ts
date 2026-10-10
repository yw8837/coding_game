import type {Language} from './translations.ts';

export type LanguagePreference='auto'|Language;
export type LanguagePlatformInfo={steamLanguage?:string;osLanguages?:readonly string[]};
export type LanguageContext=LanguagePlatformInfo&{browserLanguages?:readonly string[]};
export const LANGUAGE_PREFERENCE_KEY='codeshift-language';

export function parseLanguagePreference(value:unknown):LanguagePreference{
 return value==='ko'||value==='en'||value==='ja'?value:'auto';
}

export function normalizeLanguage(value:unknown):Language|null{
 if(typeof value!=='string')return null;
 const base=value.trim().toLowerCase().replaceAll('_','-').split('-')[0];
 return base==='ko'||base==='en'||base==='ja'?base:null;
}

export function steamLanguage(value:unknown):Language|null{
 if(typeof value!=='string')return null;
 const codes:Record<string,Language>={koreana:'ko',english:'en',japanese:'ja'};
 const code=value.trim().toLowerCase();return Object.hasOwn(codes,code)?codes[code]:null;
}

export function resolveLanguage(preference:LanguagePreference,context:LanguageContext={}):Language{
 if(preference!=='auto')return preference;
 const steam=steamLanguage(context.steamLanguage);if(steam)return steam;
 const os=Array.isArray(context.osLanguages)?context.osLanguages:[];
 const browser=Array.isArray(context.browserLanguages)?context.browserLanguages:[];
 const preferred=os.length?os:browser;
 for(const value of preferred){const supported=normalizeLanguage(value);if(supported)return supported;}
 return 'en';
}

type LocaleEnvironment={
 readPreference:()=>unknown;
 writePreference:(preference:LanguagePreference)=>void;
 browserLanguages:()=>readonly string[];
 platformInfo?:()=>Promise<LanguagePlatformInfo|null|undefined>;
 isDesktop?:()=>boolean;
 regionLanguage?:(signal:AbortSignal)=>Promise<Language|null>;
 onChange?:(language:Language,preference:LanguagePreference)=>void;
};

/** Separate the persisted choice from detection. Revision checks prevent a slow
 * automatic response from replacing a manual choice or a newer detection request.
 */
export function createLocaleStore(environment:LocaleEnvironment){
 let preference:LanguagePreference='auto',language:Language='en',revision=0,pending:AbortController|null=null;
 const browserLanguages=()=>{try{return environment.browserLanguages();}catch{return [];}};
 const publish=(nextPreference:LanguagePreference,nextLanguage:Language)=>{
  preference=nextPreference;language=nextLanguage;
  // Also synchronize the host document's lang when the fallback is unchanged.
  environment.onChange?.(language,preference);
 };
 const cancel=()=>{pending?.abort();pending=null;return ++revision;};
 const detect=async(token:number,browser:readonly string[])=>{
  const controller=new AbortController();pending=controller;
  let next:Language|null=null;
  try{
   const desktop=environment.isDesktop?environment.isDesktop():!!environment.platformInfo;
   if(desktop){
    let platform:LanguagePlatformInfo|null|undefined;
    try{platform=await environment.platformInfo?.();}catch{/* Keep browser fallback when the desktop bridge fails. */}
    next=resolveLanguage('auto',{...platform,browserLanguages:browser});
   }else if(environment.regionLanguage){
    next=await environment.regionLanguage(controller.signal);
   }
  }catch{/* Detection failure keeps the immediate browser fallback. */}
  finally{if(pending===controller)pending=null;}
  if(token!==revision||preference!=='auto'||controller.signal.aborted||!next)return;
  publish('auto',next);
 };
 const setPreference=async(next:LanguagePreference)=>{
  const choice=parseLanguagePreference(next),token=cancel(),browser=browserLanguages();
  publish(choice,resolveLanguage(choice,{browserLanguages:browser}));
  try{environment.writePreference(choice);}catch{/* The session choice still works without writable storage. */}
  if(choice==='auto')await detect(token,browser);
 };
 const restore=async()=>{
  const token=cancel();let stored:unknown;
  try{stored=environment.readPreference();}catch{/* Missing or blocked storage means automatic detection. */}
  const choice=parseLanguagePreference(stored),browser=browserLanguages();
  publish(choice,resolveLanguage(choice,{browserLanguages:browser}));
  if(choice==='auto')await detect(token,browser);
 };
 return {getLanguage:()=>language,getPreference:()=>preference,setPreference,restore};
}
