// Minimal stored (uncompressed) ZIP writer for exported player work. No extraction, no compression.
const CRC_TABLE=(()=>{const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}return table;})();
export function crc32(data:Uint8Array):number{let c=0xffffffff;for(const byte of data)c=CRC_TABLE[(c^byte)&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}

export type ZipEntry={name:string;content:string};
const SAFE_NAME=/^(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+$/;

/** Fixed 1980-01-01 timestamps keep identical work byte-for-byte reproducible. */
export function buildZip(entries:ZipEntry[]):Uint8Array{
 const encoder=new TextEncoder(),names=new Set<string>();
 const files=entries.map(entry=>{
  if(!SAFE_NAME.test(entry.name)||entry.name.split('/').some(part=>part==='.'||part==='..')||names.has(entry.name))throw Error('Invalid archive entry name');
  names.add(entry.name);const name=encoder.encode(entry.name),data=encoder.encode(entry.content);return {name,data,crc:crc32(data)};
 });
 const local:Uint8Array[]=[],central:Uint8Array[]=[];let offset=0;
 for(const file of files){
  const header=new Uint8Array(30+file.name.length),view=new DataView(header.buffer);
  view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x0800,true);view.setUint16(8,0,true);view.setUint16(10,0,true);view.setUint16(12,0x21,true);
  view.setUint32(14,file.crc,true);view.setUint32(18,file.data.length,true);view.setUint32(22,file.data.length,true);view.setUint16(26,file.name.length,true);view.setUint16(28,0,true);header.set(file.name,30);
  const record=new Uint8Array(46+file.name.length),entry=new DataView(record.buffer);
  entry.setUint32(0,0x02014b50,true);entry.setUint16(4,20,true);entry.setUint16(6,20,true);entry.setUint16(8,0x0800,true);entry.setUint16(10,0,true);entry.setUint16(12,0,true);entry.setUint16(14,0x21,true);
  entry.setUint32(16,file.crc,true);entry.setUint32(20,file.data.length,true);entry.setUint32(24,file.data.length,true);entry.setUint16(28,file.name.length,true);entry.setUint32(42,offset,true);record.set(file.name,46);
  local.push(header,file.data);central.push(record);offset+=header.length+file.data.length;
 }
 const size=central.reduce((sum,part)=>sum+part.length,0),end=new Uint8Array(22),tail=new DataView(end.buffer);
 tail.setUint32(0,0x06054b50,true);tail.setUint16(8,files.length,true);tail.setUint16(10,files.length,true);tail.setUint32(12,size,true);tail.setUint32(16,offset,true);
 const out=new Uint8Array(offset+size+22);let at=0;for(const part of [...local,...central,end]){out.set(part,at);at+=part.length;}
 return out;
}
