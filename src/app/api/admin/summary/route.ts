import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 try {const p=getPrisma(); const [orders,bills,payments,menuItems,tables,recentOrders]=await Promise.all([
 p.order.count(),p.bill.count(),p.payment.aggregate({where:{status:"succeeded"},_sum:{amount:true},_count:true}),p.menuItem.count(),p.restaurantTable.groupBy({by:["status"],_count:{_all:true}}),p.order.findMany({take:10,orderBy:{createdAt:"desc"},select:{id:true,status:true,total:true,createdAt:true,session:{select:{table:{select:{number:true}}}}}})]);
 return NextResponse.json({totals:{orders,bills,payments:payments._count,revenue:payments._sum.amount??0,menuItems},tables:tables.map(t=>({status:t.status,count:t._count._all})),recentOrders});}
 catch(e){console.error("Admin summary failed",e);return NextResponse.json({error:"Unable to load admin summary."},{status:500});}
}