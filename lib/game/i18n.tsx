'use client';
import {Children,cloneElement,isValidElement,useSyncExternalStore,type ReactNode,type ReactElement} from 'react';
import {translate,type Language} from './translations';
import {createLocaleStore,LANGUAGE_PREFERENCE_KEY,type LanguagePlatformInfo,type LanguagePreference} from './locale.ts';
import {fetchRegionLanguage} from './region-locale.ts';
export type {Language};
export type {LanguagePreference};
const listeners=new Set<()=>void>();
const locale=createLocaleStore({
 readPreference:()=>typeof localStorage==='undefined'?null:localStorage.getItem(LANGUAGE_PREFERENCE_KEY),
 writePreference:preference=>{if(typeof localStorage!=='undefined')localStorage.setItem(LANGUAGE_PREFERENCE_KEY,preference);},
 browserLanguages:()=>typeof navigator==='undefined'?[]:navigator.languages?.length?navigator.languages:navigator.language?[navigator.language]:[],
 clientContext:()=>{
  if(typeof window==='undefined')return {};
  let timeZone:string|undefined;
  try{timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone;}catch{}
  return {timeZone,hostname:window.location?.hostname};
 },
 isDesktop:()=>typeof window!=='undefined'&&!!(window as Window&{desktopBridge?:unknown}).desktopBridge,
 regionLanguage:signal=>typeof window==='undefined'?Promise.resolve(null):fetchRegionLanguage((url,init)=>fetch(url,init),signal),
 platformInfo:async()=>{
  if(typeof window==='undefined')return null;
  const bridge=(window as Window&{desktopBridge?:{getPlatformInfo:()=>Promise<LanguagePlatformInfo>}}).desktopBridge;
  return bridge?.getPlatformInfo?await bridge.getPlatformInfo():null;
 },
 onChange:language=>{if(typeof document!=='undefined')document.documentElement.lang=language;listeners.forEach(fn=>fn());},
});
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export const getLanguage=locale.getLanguage;
export const getLanguagePreference=locale.getPreference;
export const t=(text:string)=>translate(text,getLanguage());
export function setLanguagePreference(next:LanguagePreference){void locale.setPreference(next);}
/** Compatibility: selecting a concrete language always records a manual choice. */
export function setLanguage(next:Language){setLanguagePreference(next);}
export const restoreLanguage=locale.restore;
export function useLanguage(){return useSyncExternalStore(subscribe,getLanguage,()=>getLanguage());}
export function useLanguagePreference(){return useSyncExternalStore(subscribe,getLanguagePreference,()=> 'auto' as LanguagePreference);}

/** Translate display text only. State, commands, code and form values stay untouched.
 * Component boundaries opt in explicitly; no DOM mutation or HTML substitution.
 */
export function localizeUI(node:ReactNode):ReactNode{
 if(typeof node==='string')return t(node);
 if(Array.isArray(node))return Children.map(node,localizeUI);
 if(!isValidElement(node))return node;
 const el=node as ReactElement<Record<string,unknown>>;
 if(el.props['data-no-translate'])return el;
 const opaque=['pre','code','textarea','script','style','svg'].includes(String(el.type));
 const props:Record<string,unknown>={};
 for(const key of ['title','aria-label','placeholder','alt'])if(typeof el.props[key]==='string')props[key]=t(el.props[key] as string);
 if(!opaque&&el.props.children!==undefined)props.children=localizeUI(el.props.children as ReactNode);
 return cloneElement(el,props);
}
