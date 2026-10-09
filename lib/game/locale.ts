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
 onChange?:(language:Language,preference:LanguagePreference)=>void;
};

/** Separate the persisted choice from detection. Revision checks prevent a slow
 * Steam response from replacing a manual choice or a newer detection request.
 */
export function createLocaleStore(environment:LocaleEnvironment){
 let preference:LanguagePreference='auto',language:Language='en',revision=0;
 const browserLanguages=()=>{try{return environment.browserLanguages();}catch{return [];}};
 const publish=(nextPreference:LanguagePreference,nextLanguage:Language)=>{
  preference=nextPreference;language=nextLanguage;
  // Publish even an unchanged fallback so the host document's initial lang
  // attribute can be synchronized after hydration.
  environment.onChange?.(language,preference);
 };
 const detect=async(token:number,browser:readonly string[])=>{
  if(!environment.platformInfo)return;
  let platform:LanguagePlatformInfo|null|undefined;
  try{platform=await environment.platformInfo();}catch{return;}
  if(token!==revision||preference!=='auto')return;
  publish('auto',resolveLanguage('auto',{...platform,browserLanguages:browser}));
 };
 const setPreference=async(next:LanguagePreference)=>{
  const choice=parseLanguagePreference(next),token=++revision,browser=browserLanguages();
  publish(choice,resolveLanguage(choice,{browserLanguages:browser}));
  try{environment.writePreference(choice);}catch{/* The session choice still works without writable storage. */}
  if(choice==='auto')await detect(token,browser);
 };
 const restore=async()=>{
  const token=++revision;let stored:unknown;
  try{stored=environment.readPreference();}catch{/* Missing or blocked storage means automatic detection. */}
  const choice=parseLanguagePreference(stored),browser=browserLanguages();
  publish(choice,resolveLanguage(choice,{browserLanguages:browser}));
  if(choice==='auto')await detect(token,browser);
 };
 return {getLanguage:()=>language,getPreference:()=>preference,setPreference,restore};
}
