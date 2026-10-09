/** Show the changed source lines rather than implying a draft has been saved. */
export function changedSource(before:string,after:string):string {
 const oldLines=before.split('\n'),newLines=after.split('\n');let start=0,end=newLines.length,oldEnd=oldLines.length;
 while(start<oldLines.length&&start<newLines.length&&oldLines[start]===newLines[start])start++;
 while(end>start&&oldEnd>start&&oldLines[oldEnd-1]===newLines[end-1]){end--;oldEnd--;}
 const lines=newLines.slice(start,end);return ((lines.length?lines.slice(0,8).join('\n'):'')+(lines.length>8?'\n…':'')).slice(0,1600);
}
