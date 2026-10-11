import type {Language} from './translations.ts';

/** Official product identity. Internal ids and save keys keep their codeshift names. */
export const GAME_NAME:Record<Language,string>={ko:'로컬호스트 히어로',en:'Localhost Hero',ja:'ローカルホスト・ヒーロー'};
export const GAME_SUBTITLE:Record<Language,string>={ko:'우리 동네 코딩 시뮬레이터',en:'A neighborhood coding sim',ja:'ご近所プログラミングシミュレーター'};
export const GAME_BRAND='Localhost Hero';
export const GAME_VERSION_LABEL='0.14.0 RC';
