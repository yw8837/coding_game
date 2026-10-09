import type {SVGProps} from 'react';

type BrowserIconProps=SVGProps<SVGSVGElement>&{size?:number|string};

/** Ghrom's own mark: three curved leaves around a blue lens. */
export function BrowserIcon({size=24,className='',...props}:BrowserIconProps){
 return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false" className={'grom-icon '+className} {...props}>
  <circle cx="32" cy="32" r="29" fill="#f1eee7"/>
  <path d="M31 5C45 4 56 13 59 27C48 24 38 26 32 31C27 24 26 13 31 5Z" fill="#db6b55"/>
  <path d="M31 5C45 4 56 13 59 27C48 24 38 26 32 31C27 24 26 13 31 5Z" fill="#e6b862" transform="rotate(120 32 32)"/>
  <path d="M31 5C45 4 56 13 59 27C48 24 38 26 32 31C27 24 26 13 31 5Z" fill="#62a990" transform="rotate(240 32 32)"/>
  <circle cx="32" cy="32" r="11" fill="#357ba7" stroke="#f1eee7" strokeWidth="3"/>
  <path d="M27 31a5 5 0 0 1 6-4" stroke="#a8d6e9" strokeWidth="2.5" strokeLinecap="round"/>
 </svg>;
}
