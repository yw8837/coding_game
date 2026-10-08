import type {GameState,Action} from '@/lib/game/engine';
import type {AssistAction} from '@/lib/game/assisted';
export type AppId='desktop'|'repair'|'messages'|'workbench'|'browser'|'editor'|'terminal'|'missions'|'api'|'server'|'achievements';
export type GameProps={state:GameState;onAssist:(action:AssistAction)=>void;onAction:(action:Action)=>void;onCommand:(command:string)=>void;onOpen:(app:AppId)=>void;onNavigate:(url:string)=>void;onTest:()=>void;testing:boolean;queueCommand:(command:string)=>void;onRequest:(method:string,url:string,body:string)=>{status:number;data:unknown};};
