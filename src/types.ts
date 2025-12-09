export type TransactionStatus = "spent" | "invoiced";
export type ProjectStatus = "active" | "completed" | "archived";

export interface Project {
  id: string;
  name: string;
  total_budget: number;
  start_date: string; // ISO date
  deadline: string; // ISO date
  status: ProjectStatus;
  created_at: string;
  user_id?: string;
}

export interface Transaction {
  id: string;
  project_id: string;
  amount: number;
  vendor: string | null;
  occurred_at: string; // ISO datetime
  receipt_url?: string | null; // deprecated
  receipt_urls?: string[] | null; // new
  notes: string | null;
  category?: string | null; // expense category
  status: TransactionStatus;
  created_at?: string;
  user_id?: string;
}

export interface ProjectStats {
  budgetConsumedPct: number;
  timeElapsedPct: number;
  budgetRemaining: number;
  daysRemaining: number;
  totalBudget: number;
  totalSpent: number;
}

export interface ProjectStatsResponse {
  budget_consumed_pct: number;
  time_elapsed_pct: number;
  total_spent: number;
  total_budget: number;
}

export interface CreateTransactionInput {
  projectId: string;
  amount: string;
  vendor?: string;
  notes?: string;
  occurredAt?: string;
  receipt?: File | null;
  status?: TransactionStatus;
}

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Partial<Project>;
        Update: Partial<Project>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: Partial<Transaction>;
        Update: Partial<Transaction>;
        Relationships: [
          {
            foreignKeyName: "transactions_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      transaction_status: TransactionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
