"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase-server";
import type {
  Database,
  ProjectStatsResponse,
  TransactionStatus,
  ProjectStatus,
} from "@/types";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export async function createTransaction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("请先登录");
  }

  const supabase = await createSupabaseServerClient();

  let projectId = formData.get("projectId")?.toString();
  const rawAmount = formData.get("amount")?.toString() ?? "";
  const vendor = formData.get("vendor")?.toString() || null;
  const notes = formData.get("notes")?.toString() || null;
  const occurredAt =
    formData.get("occurredAt")?.toString() ?? new Date().toISOString();
  const status =
    (formData.get("status")?.toString() as TransactionStatus | null) ??
    "spent";
  const receiptFile = formData.get("receipt") as File | null;

  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("金额必须大于 0");
  }

  // 若未选择项目，自动创建/复用默认项目「通用账本」
  if (!projectId) {
    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("name", "通用账本")
      .limit(1)
      .maybeSingle();

    const existingId = (existing as Database["public"]["Tables"]["projects"]["Row"] | null)?.id;

    if (existingId) {
      projectId = existingId;
    } else {
      const defaultProjectPayload: Database["public"]["Tables"]["projects"]["Insert"] =
      {
        name: "通用账本",
        total_budget: 0,
        start_date: new Date().toISOString().slice(0, 10),
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        user_id: user.id,
      };

      const { data: created, error: createErr } = await (supabase as any)
        .from("projects")
        .insert(defaultProjectPayload)
        .select("id")
        .single();
      const createdId = (created as Database["public"]["Tables"]["projects"]["Row"] | null)?.id;
      if (createErr || !createdId) {
        throw new Error("缺少项目 ID，且默认账本创建失败，请先创建项目");
      }
      projectId = createdId;
    }
  }

  // Fetch existing if needed... (lines 33-67 unchanged, ommitted in thought but included in replace logic? No, only replacing the file handling part)

  // NOTE: Logic above line 69 is unchanged, I will target the receipt handling block.

  const receiptFiles = formData.getAll("receipt") as File[];
  const receiptUrls: string[] = [];

  // Parallel upload for better performance
  if (receiptFiles.length > 0) {
    await Promise.all(receiptFiles.map(async (file) => {
      if (file.size > 0) {
        const ext = file.name.split(".").pop();
        const objectPath = `${projectId}/${crypto.randomUUID()}.${ext || "bin"}`;

        await withRetry(async () => {
          const { error: uploadError } = await supabase.storage
            .from("receipts")
            .upload(objectPath, file, {
              cacheControl: "3600",
              contentType: file.type || "application/octet-stream",
              upsert: false,
            });
          if (uploadError) throw new Error(uploadError.message);
        });
        receiptUrls.push(objectPath);
      }
    }));
  }

  const category = formData.get("category")?.toString() || null;

  const payload: Database["public"]["Tables"]["transactions"]["Insert"] = {
    project_id: projectId,
    amount,
    vendor,
    notes,
    category,
    occurred_at: occurredAt,
    receipt_urls: receiptUrls.length > 0 ? receiptUrls : null,
    status,
    user_id: user.id,
  };

  const { data, error } = await (supabase as any)
    .from("transactions")
    .insert(payload)
    .select("id, receipt_urls")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/p/${projectId}`);
  revalidatePath("/");

  return {
    id: data.id,
    receipt_urls: data.receipt_urls,
  };
}

export async function deleteTransaction(transactionId: string, projectId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/p/${projectId}`);
  return { success: true };
}

export async function getReceiptUrl(path: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(path, 60 * 60);

  if (error) return { error: error.message };
  return { url: data?.signedUrl };
}

export async function deleteReceiptImage(transactionId: string, projectId: string, imagePath: string) {
  const supabase = await createSupabaseServerClient();

  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("receipts")
      .remove([imagePath]);

    if (storageError) {
      console.warn("Storage delete warning:", storageError.message);
      // Continue even if storage delete fails (file might already be deleted)
    }

    // Update transaction to remove the image path from receipt_urls
    const { data: tx, error: fetchError } = await supabase
      .from("transactions")
      .select("receipt_urls, receipt_url")
      .eq("id", transactionId)
      .single();

    if (fetchError || !tx) {
      return { error: "找不到交易记录" };
    }

    const currentTx = tx as any;
    const existingUrls = currentTx.receipt_urls ?? (currentTx.receipt_url ? [currentTx.receipt_url] : []);
    const updatedUrls = existingUrls.filter((url: string) => url !== imagePath);

    const { error: updateError } = await (supabase as any)
      .from("transactions")
      .update({ receipt_urls: updatedUrls.length > 0 ? updatedUrls : null })
      .eq("id", transactionId);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath(`/p/${projectId}`);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "删除失败" };
  }
}

export async function updateProject(
  id: string,
  payload: Partial<{
    name: string;
    total_budget: number;
    start_date: string;
    deadline: string;
    status: ProjectStatus;
  }>
) {
  const supabase = await createSupabaseServerClient();

  // Explicitly construct update object to avoid type inference issues
  const updateData: Record<string, any> = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.total_budget !== undefined) updateData.total_budget = payload.total_budget;
  if (payload.start_date !== undefined) updateData.start_date = payload.start_date;
  if (payload.deadline !== undefined) updateData.deadline = payload.deadline;
  if (payload.status !== undefined) updateData.status = payload.status;

  const { error } = await (supabase as any)
    .from("projects")
    .update(updateData)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/p/${id}`);
  return { success: true };
}

export async function deleteProject(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function getProjectStats(
  projectId: string
): Promise<ProjectStatsResponse> {
  const supabase = await createSupabaseServerClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, total_budget, start_date, deadline")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    // Return empty stats instead of throwing to prevent page crash
    console.warn("getProjectStats: Project not found", projectId, projectError);
    return {
      budget_consumed_pct: 0,
      time_elapsed_pct: 0,
      total_spent: 0,
      total_budget: 0,
    };
  }

  const projectRow =
    project as Database["public"]["Tables"]["projects"]["Row"];

  const totalBudget = Number(projectRow.total_budget);
  if (!Number.isFinite(totalBudget)) {
    throw new Error("项目预算无效");
  }

  // Fix: PostgREST doesn't support sum(amount) directly in select without a view/function.
  // Fetch amounts and sum locally.
  const { data: transactions, error: spendError } = await supabase
    .from("transactions")
    .select("amount")
    .eq("project_id", projectId);

  if (spendError) {
    console.error("GET PROJECT STATS ERROR:", spendError);
    throw new Error(spendError.message);
  }

  const totalSpent = transactions?.reduce((acc, curr) => acc + Number((curr as any).amount), 0) ?? 0;


  const budgetConsumedPct =
    totalBudget > 0 ? clamp(totalSpent / totalBudget) : 0;

  const now = new Date();
  const start = new Date(projectRow.start_date);
  const end = new Date(projectRow.deadline);

  const totalTimeMs = Math.max(end.getTime() - start.getTime(), 0);
  const elapsedMs = now.getTime() - start.getTime();
  const timeElapsedPct =
    totalTimeMs === 0 ? 1 : clamp(elapsedMs / totalTimeMs);

  return {
    budget_consumed_pct: budgetConsumedPct,
    time_elapsed_pct: timeElapsedPct,
    total_spent: totalSpent,
    total_budget: totalBudget,
  };
}

type CopilotState = {
  answer?: string;
  error?: string;
};

export async function askAssistant(
  _prevState: CopilotState,
  formData: FormData
): Promise<CopilotState> {
  const question = formData.get("question")?.toString().trim();
  if (!question) {
    return { error: "请输入问题" };
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { error: "缺少 DEEPSEEK_API_KEY 环境变量" };
  }

  const supabase = await createSupabaseServerClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id,name,total_budget,start_date,deadline")
    .limit(5);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount,vendor,occurred_at,status")
    .order("occurred_at", { ascending: false })
    .limit(8);

  const transactionRows =
    (transactions as Database["public"]["Tables"]["transactions"]["Row"][]) ??
    [];

  const projectRows =
    (projects as Database["public"]["Tables"]["projects"]["Row"][]) ?? [];

  const summaries =
    projectRows.length > 0
      ? await Promise.all(
        projectRows.map(async (p) => {
          try {
            const stats = await getProjectStats(p.id);
            return `• ${p.name} | 预算 ${p.total_budget} | 已烧 ${stats.total_spent} | 预算占比 ${(stats.budget_consumed_pct * 100).toFixed(
              1
            )}% | 时间 ${(stats.time_elapsed_pct * 100).toFixed(1)}%`;
          } catch {
            return `• ${p.name} | 预算 ${p.total_budget}`;
          }
        })
      )
      : [];

  const txLines =
    transactionRows.map(
      (tx) =>
        `- ${new Date(tx.occurred_at).toISOString().slice(0, 10)} ${tx.vendor || "Unknown"
        } ${tx.amount} (${tx.status})`
    ) ?? [];

  const system = `You are GrantBurner Copilot. 重点：读取提供的项目/交易摘要，用中文回答，保持简洁，给出计算或结论，不要幻想不存在的数据。`;
  const userContent = [
    `用户问题: ${question}`,
    summaries.length ? `项目概览:\n${summaries.join("\n")}` : "暂无项目数据",
    txLines.length ? `最近交易:\n${txLines.join("\n")}` : "暂无交易数据",
  ].join("\n\n");

  try {
    const resp = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3",
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!resp.ok) {
      return { error: `AI 调用失败: ${resp.status} ${resp.statusText}` };
    }

    const json = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return { error: "AI 未返回内容" };
    return { answer: content.trim() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "请求出错";
    return { error: message };
  }
}

// Helper for retrying flaky network operations
async function withRetry<T>(operation: () => Promise<T>, retries = 3, delayMs = 500): Promise<T> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      // If it's not a network error (like row violation), maybe don't retry? 
      // But fetch failed is retryable.
      console.warn(`Attempt ${i + 1} failed: ${err.message}. Retrying...`);
      if (i < retries - 1) await new Promise(res => setTimeout(res, delayMs * (i + 1)));
    }
  }
  throw lastError;
}

export async function updateTransaction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const id = formData.get("id")?.toString();
  const projectId = formData.get("projectId")?.toString();
  const rawAmount = formData.get("amount")?.toString();
  const vendor = formData.get("vendor")?.toString();
  const notes = formData.get("notes")?.toString();
  const occurredAt = formData.get("occurredAt")?.toString();
  const receiptFile = formData.get("receipt") as File | null;

  if (!id || !projectId) {
    return { error: "Missing transaction ID or Project ID" };
  }

  const updates: any = {};
  if (rawAmount) {
    const amount = Number(rawAmount);
    if (Number.isFinite(amount) && amount > 0) updates.amount = amount;
  }
  if (vendor !== undefined) updates.vendor = vendor || null;
  if (notes !== undefined) updates.notes = notes || null;
  if (occurredAt) updates.occurred_at = occurredAt;

  try {
    const receiptFiles = formData.getAll("receipt") as File[];
    const newReceiptUrls: string[] = [];

    console.log(`[Upload] Starting upload of ${receiptFiles.length} files`);

    // Sequential upload for better stability on mobile networks
    if (receiptFiles.length > 0) {
      for (let index = 0; index < receiptFiles.length; index++) {
        const file = receiptFiles[index];
        if (file.size > 0) {
          console.log(`[Upload] File ${index + 1}: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
          const ext = file.name.split(".").pop();
          const objectPath = `${projectId}/${crypto.randomUUID()}.${ext || "bin"}`;

          try {
            await withRetry(async () => {
              console.log(`[Upload] Uploading file ${index + 1} to path: ${objectPath}`);
              const { error: uploadError } = await supabase.storage
                .from("receipts")
                .upload(objectPath, file, {
                  cacheControl: "3600",
                  contentType: file.type || "application/octet-stream",
                  upsert: false,
                });
              if (uploadError) {
                console.error(`[Upload] Error uploading file ${index + 1}:`, uploadError);
                throw new Error(uploadError.message);
              }
              console.log(`[Upload] File ${index + 1} uploaded successfully`);
            });
            newReceiptUrls.push(objectPath);
          } catch (err: any) {
            console.error(`[Upload] Failed to upload file ${index + 1} after retries:`, err.message);
            throw err;
          }
        }
      }
    }
    console.log(`[Upload] All uploads complete. Total uploaded: ${newReceiptUrls.length}`);

    if (newReceiptUrls.length > 0) {
      // Fetch current to append
      const { data: currentTx, error: fetchErr } = await supabase
        .from("transactions")
        .select("receipt_urls, receipt_url")
        .eq("id", id)
        .single();

      if (!fetchErr && currentTx) {
        const tx = currentTx as any; // Cast to bypass strict type check during migration
        const existing = tx.receipt_urls ?? (tx.receipt_url ? [tx.receipt_url] : []);
        updates.receipt_urls = [...existing, ...newReceiptUrls];
      } else {
        updates.receipt_urls = newReceiptUrls;
      }
    }

    // Retry database update
    await withRetry(async () => {
      const { error } = await (supabase as any)
        .from("transactions")
        .update(updates)
        .eq("id", id);
      if (error) throw new Error(error.message);
    });

    revalidatePath(`/p/${projectId}`);
    revalidatePath("/");
    return { success: true };

  } catch (error: any) {
    console.error("Update Transaction Failed:", error);
    return { error: "连接不稳定，请重试 (" + error.message + ")" };
  }
}

export async function searchTransactions(query: string) {
  const supabase = await createSupabaseServerClient();

  const searchTerm = `%${query}%`;

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .or(`vendor.ilike.${searchTerm},notes.ilike.${searchTerm}`)
    .order("occurred_at", { ascending: false })
    .limit(50);

  if (error) {
    return { error: error.message };
  }

  return { data: data ?? [] };
}

export async function getDashboardData() {
  const supabase = await createSupabaseServerClient();

  // Fetch all transactions
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("amount, category, occurred_at")
    .order("occurred_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  const txList = transactions ?? [];

  // Calculate total spent
  const totalSpent = txList.reduce((sum, tx) => sum + Number((tx as any).amount), 0);

  // Group by category
  const categoryMap = new Map<string, number>();
  txList.forEach((tx: any) => {
    const cat = tx.category || "uncategorized";
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(tx.amount));
  });
  const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));

  // Group by month (last 6 months)
  const monthMap = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, 0);
  }

  txList.forEach((tx: any) => {
    const d = new Date(tx.occurred_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap.has(key)) {
      monthMap.set(key, (monthMap.get(key) || 0) + Number(tx.amount));
    }
  });

  const monthlyData = Array.from(monthMap.entries()).map(([month, amount]) => ({
    month: month.slice(5), // Just show MM
    amount,
  }));

  return {
    data: {
      categoryData,
      monthlyData,
      totalSpent,
    },
  };
}
