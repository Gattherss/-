-- ============================================
-- 多用户隔离：添加 user_id 字段
-- ============================================
-- 请在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- Step 1: 为 projects 表添加 user_id 列
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: 为 transactions 表添加 user_id 列
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================
-- Step 3: 处理现有数据（请选择以下方式之一执行）
-- ============================================

-- 方式 A: 将所有现有数据分配给指定用户
-- 取消下面三行的注释，并替换 'YOUR_USER_ID_HERE' 为您在 Supabase Auth 中的用户 ID
-- 您可以在 Supabase Dashboard > Authentication > Users 中找到您的 User ID

-- UPDATE public.projects SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;
-- UPDATE public.transactions SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;

-- 方式 B: 清空所有旧数据，重新开始
-- 取消下面两行的注释

-- TRUNCATE public.transactions CASCADE;
-- TRUNCATE public.projects CASCADE;

-- ============================================
-- Step 4: 设置 NOT NULL 约束（在处理完现有数据后执行）
-- ============================================

-- 注意：如果表中还有 user_id 为 NULL 的行，此步骤会失败
-- 请确保 Step 3 已执行完毕

ALTER TABLE public.projects 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.transactions 
ALTER COLUMN user_id SET NOT NULL;

-- ============================================
-- 完成！接下来请执行 enable_user_rls.sql
-- ============================================
