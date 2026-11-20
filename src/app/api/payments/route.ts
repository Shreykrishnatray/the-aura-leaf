import { NextResponse } from "next/server";
import { BillError, parsePayBillInput, recordPayment } from "@/lib/billing";
import { errorResponse } from "@/lib/api-error";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 try { const body=await request.json().catch(()=>null); if(!body||typeof body.billId!=="string"||!body.billId.trim()) throw new BillError(400,"billId is required."); const input=parsePayBillInput(body); return NextResponse.json(await recordPayment(body.billId,input),{status:201}); } catch(e){return errorResponse(e,"POST /api/payments");}
}