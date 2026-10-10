export type PlatformInfo={runtime:'desktop';version:string;steamAvailable:boolean;steamLanguage?:string;osLanguages:string[]};
export type DesktopBridge={
 getPlatformInfo:()=>Promise<PlatformInfo>;
 setLanguage:(language:'ko'|'en'|'ja')=>Promise<{ok:boolean}>;
 loadSave:()=>Promise<{raw:string|null;recovered:boolean;error?:string}>;
 loadBackup:()=>Promise<{raw:string|null;recovered:boolean;error?:string}>;
 saveGame:(raw:string)=>Promise<{ok:boolean;error?:string}>;
 exportBackup:(raw:string)=>Promise<{ok:boolean;canceled?:boolean;error?:string}>;
 exportApp:(html:string)=>Promise<{ok:boolean;canceled?:boolean;error?:string}>;
 unlockAchievements:(ids:string[])=>Promise<{ok:boolean}>;
 onBeforeClose:(callback:()=>void)=>()=>void;
 confirmClose:()=>Promise<{ok:boolean}>;
};
declare global{interface Window{desktopBridge?:DesktopBridge}}
export function desktopBridge(){return typeof window!=='undefined'?window.desktopBridge:undefined;}
