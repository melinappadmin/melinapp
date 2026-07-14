const enc=new TextEncoder();
async function signature(value:string){const key=await crypto.subtle.importKey("raw",enc.encode(`${process.env.ADMIN_PASSWORD}:${process.env.PASSWORD}`),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("HMAC",key,enc.encode(value));return Array.from(new Uint8Array(sig)).map(x=>x.toString(16).padStart(2,"0")).join("")}
export type Session={email:string;role:"admin"|"estoque"|"repositor"|"comercial"};
export async function makeSession(email:string,role:Session["role"]){const payload=`${email}|${role}|${Date.now()+1000*60*60*12}`;return `${btoa(payload)}.${await signature(payload)}`}
export async function getSession(request:Request):Promise<Session|null>{const token=request.headers.get("cookie")?.match(/melin_session=([^;]+)/)?.[1];if(!token)return null;try{const [raw,sig]=token.split("."),payload=atob(raw),[email,role,expires]=payload.split("|");if(Number(expires)<=Date.now()||sig!==await signature(payload))return null;return {email,role:role as Session["role"]}}catch{return null}}
export async function validSession(request:Request){return Boolean(await getSession(request))}
export function cookie(value:string){return `melin_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`}
