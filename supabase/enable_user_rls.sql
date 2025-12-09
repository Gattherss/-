-- ============================================
-- 多用户隔离：启用 RLS 并创建用户隔离策略
-- ============================================
-- 请在执行 add_user_id_columns.sql 之后执行此脚本
-- ============================================

-- Step 1: 删除旧的 allow-all 策略（如果存在）
DROP POLICY IF EXISTS "Authenticated can read projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public read projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public insert projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public update projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public delete projects" ON public.projects;

DROP POLICY IF EXISTS "Authenticated can read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated can delete transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public delete transactions" ON public.transactions;

-- Step 2: 确保 RLS 已启用
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 3: 创建用户隔离策略 - projects 表
-- ============================================

-- SELECT: 用户只能查看自己的项目
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: 用户只能创建属于自己的项目
CREATE POLICY "Users can create own projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: 用户只能更新自己的项目
CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 用户只能删除自己的项目
CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- Step 4: 创建用户隔离策略 - transactions 表
-- ============================================

-- SELECT: 用户只能查看自己的交易
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: 用户只能创建属于自己的交易
CREATE POLICY "Users can create own transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: 用户只能更新自己的交易
CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: 用户只能删除自己的交易
CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 完成！RLS 策略已设置
-- ============================================
