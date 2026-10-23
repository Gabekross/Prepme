import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/src/admin/verifyAdminRequest";

const statuses = new Set(["new", "reviewing", "planned", "resolved", "closed"]);
const priorities = new Set(["low", "normal", "high", "urgent"]);

export async function GET(req: NextRequest) {
  const verified = await verifyAdminRequest(req); if (!verified.ok) return verified.response;
  const status = req.nextUrl.searchParams.get("status"); const kind = req.nextUrl.searchParams.get("kind");
  let query = verified.admin.from("user_feedback").select("*").order("created_at", { ascending: false }).limit(200);
  if (status && statuses.has(status)) query = query.eq("status", status);
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Could not load feedback." }, { status: 500 });
  const contactIds = [...new Set((data ?? []).filter(row => row.allow_contact).map(row => row.user_id))];
  const emails = new Map<string,string>();
  await Promise.all(contactIds.map(async id => { const { data: user } = await verified.admin.auth.admin.getUserById(id); if (user.user?.email) emails.set(id,user.user.email); }));
  return NextResponse.json({ feedback: (data ?? []).map(row => ({ ...row, contact_email: row.allow_contact ? emails.get(row.user_id) ?? null : null })) });
}

export async function PATCH(req: NextRequest) {
  const verified = await verifyAdminRequest(req); if (!verified.ok) return verified.response;
  const body = await req.json().catch(() => null); const id = typeof body?.id === "string" ? body.id : "";
  if (!id || !statuses.has(body.status) || !priorities.has(body.priority) || (body.adminNotes != null && typeof body.adminNotes !== "string")) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }
  const now = new Date().toISOString();
  const { data, error } = await verified.admin.from("user_feedback").update({ status: body.status, priority: body.priority,
    admin_notes: body.adminNotes?.trim().slice(0,4000) || null, updated_at: now,
    resolved_at: ["resolved","closed"].includes(body.status) ? now : null }).eq("id",id).select().single();
  if (error) return NextResponse.json({ error: "Could not update feedback." }, { status: 500 });
  return NextResponse.json({ feedback: data });
}
