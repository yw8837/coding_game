export type PlatformInfo={runtime:'desktop';version:string;steamAvailable:boolean;steamLanguage?:string;osLanguages:string[]};
export type DesktopBridge={
 getPlatformInfo:()=>Promise<PlatformInfo>;
 getFullscreen?:()=>Promise<boolean>;
 setFullscreen?:(enabled:boolean)=>Promise<{ok:boolean}>;
 onFullscreenChange?:(callback:(enabled:boolean)=>void)=>()=>void;
 setLanguage:(language:'ko'|'en'|'ja')=>Promise<{ok:boolean}>;
 loadSave:()=>Promise<{raw:string|null;recovered:boolean;error?:string}>;
 loadBackup:()=>Promise<{raw:string|null;recovered:boolean;error?:string}>;
 saveGame:(raw:string)=>Promise<{ok:boolean;error?:string}>;
 exportBackup:(raw:string)=>Promise<{ok:boolean;canceled?:boolean;error?:string}>;
 exportApp:(html:string,name?:string)=>Promise<{ok:boolean;canceled?:boolean;error?:string}>;
 /** Absent in desktop shells built before ZIP export. */
 exportArchive?:(data:Uint8Array,name?:string)=>Promise<{ok:boolean;canceled?:boolean;error?:string}>;
 unlockAchievements:(ids:string[])=>Promise<{ok:boolean}>;
 onBeforeClose:(callback:()=>void)=>()=>void;
 confirmClose:()=>Promise<{ok:boolean}>;
};
declare global{interface Window{desktopBridge?:DesktopBridge}}
export function desktopBridge(){return typeof window!=='undefined'?window.desktopBridge:undefined;}
export async function toggleFullscreen(){
 const bridge=desktopBridge();
 if(bridge?.getFullscreen&&bridge.setFullscreen){await bridge.setFullscreen(!await bridge.getFullscreen());return;}
 if(document.fullscreenElement)await document.exitFullscreen();
 else await document.documentElement.requestFullscreen?.();
}
