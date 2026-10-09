/** A proper name can be typed in any of the game's supported languages. */
export function isCafeName(text:string):boolean{return /모노\s*카페|\bmono\s+caf[eé]\b|モノ\s*カフェ/i.test(text);}
