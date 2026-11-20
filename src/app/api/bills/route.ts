import { NextResponse } from "next/server";
import { BillError, generateBill, getBillBySession } from "@/lib/billing";
import { errorResponse } from "@/lib/api-error";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
 try { const sessionId=new URL(request.url).searchParams.get("sessionId"); if(!sessionId) return NextResponse.json({error:"sessionId is required."},{status:400}); const bill=await getBillBySession(sessionId); if(!bill) return NextResponse.json({error:"Bill not found."},{status:404}); return NextResponse.json(bill); } catch(e){return errorResponse(e,"GET /api/bills");}
}
export async function POST(request: Request) {
 try { const body=await request.json().catch(()=>null); if(!body||typeof body.sessionId!=="string"||body.sessionId.length<4) throw new BillError(400,"A valid sessionId is required."); return NextResponse.json(await generateBill(body.sessionId),{status:201}); } catch(e){return errorResponse(e,"POST /api/bills");}
}