import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("name")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { error: projectError?.message ?? "项目不存在" },
      { status: 404 }
    );
  }

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("occurred_at,amount,vendor,status,receipt_url")
    .eq("project_id", id)
    .order("occurred_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = "日期,金额,商家,状态,收据\n";
  const rows =
    (transactions as { occurred_at: string; amount: number; vendor: string | null; status: string; receipt_url: string | null }[] | null)
      ?.map((tx) => {
        const date = new Date(tx.occurred_at).toISOString();
        return `${date},${tx.amount},${tx.vendor ?? ""},${tx.status},${tx.receipt_url ?? ""
          }`;
      }) ?? [];

  const csv = header + rows.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="project-${id}.csv"`,
    },
  });
}
