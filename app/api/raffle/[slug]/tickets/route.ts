import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getSupabaseAdminClient();

  const { data: raffle } = await supabase
    .from("raffles")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!raffle) {
    return NextResponse.json({ tickets: [] }, { status: 404 });
  }

  const { data: tickets } = await supabase
    .from("tickets")
    .select("number, status")
    .eq("raffle_id", raffle.id);

  return NextResponse.json({ tickets: tickets || [] });
}
