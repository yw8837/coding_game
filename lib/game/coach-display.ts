export function receiptGoal(stage:string,prepared:number,customer?:{price:number;quantity:number}){
 const price=stage==='serve'&&customer?customer.price:4500,requested=stage==='serve'&&customer?customer.quantity:3;
 return {price,requested,prepared:stage==='serve'||stage==='inspect'?prepared:3,total:price*requested};
}
export function menuFromResponse(data:unknown):{name:string;price:number}[]{
 if(!Array.isArray(data))return [];
 return data.filter((item):item is {name:string;price:number}=>!!item&&typeof item==='object'&&typeof item.name==='string'&&typeof item.price==='number'&&Number.isFinite(item.price)).map(item=>({name:item.name,price:item.price}));
}
