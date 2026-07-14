import { getSession } from "../../../../lib/server-auth";
export async function GET(request:Request){const session=await getSession(request);return Response.json({authenticated:Boolean(session),session})}
export async function DELETE(){return Response.json({ok:true},{headers:{"Set-Cookie":"melin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"}})}
