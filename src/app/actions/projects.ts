"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase-server";
import type { Database } from "@/types";

const parseDate = (value: string | null) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : null;
};

export async function createProject(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "请先登录" };
  }

  const name = formData.get("name")?.toString().trim();
  const budgetRaw = formData.get("total_budget")?.toString();
  const startRaw = formData.get("start_date")?.toString();
  const endRaw = formData.get("deadline")?.toString();

  if (!name) {
    return { success: false, error: "请输入项目名称" };
  }
  const totalBudget = Number(budgetRaw);
  if (!Number.isFinite(totalBudget) || totalBudget < 0) {
    return { success: false, error: "预算必须是非负数字" };
  }
  const today = new Date();
  const defaultStart = today.toISOString().slice(0, 10);
  const defaultEnd = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const startDate = parseDate(startRaw ?? null) ?? defaultStart;
  const deadline = parseDate(endRaw ?? null) ?? defaultEnd;

  const supabase = await createSupabaseServerClient();
  const payload: Database["public"]["Tables"]["projects"]["Insert"] = {
    name,
    total_budget: totalBudget,
    start_date: startDate,
    deadline,
    user_id: user.id,
  };

  const { error } = await (supabase as any)
    .from("projects")
    .insert(payload);
  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

