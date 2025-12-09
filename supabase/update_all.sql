-- GrantBurner 数据库更新脚本
-- 运行此脚本以启用所有新功能
-- 在 Supabase SQL Editor 中执行

-- ============================================
-- 1. 添加分类字段
-- ============================================
ALTER TABLE "public"."transactions"
ADD COLUMN IF NOT EXISTS "category" text;

COMMENT ON COLUMN "public"."transactions"."category" 
IS '消费分类: equipment(设备), travel(差旅), personnel(人员), supplies(耗材), services(服务), other(其他)';

-- ============================================
-- 2. 添加多图支持（如果尚未添加）
-- ============================================
ALTER TABLE "public"."transactions"
ADD COLUMN IF NOT EXISTS "receipt_urls" text[];

-- 迁移旧数据：把单图字段迁移到多图数组
UPDATE "public"."transactions"
SET "receipt_urls" = ARRAY["receipt_url"]
WHERE "receipt_url" IS NOT NULL 
  AND "receipt_urls" IS NULL;

-- ============================================
-- 3. 添加项目状态字段（如果尚未添加）
-- ============================================
ALTER TABLE "public"."projects"
ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active';

-- 确保旧项目有状态
UPDATE "public"."projects"
SET "status" = 'active'
WHERE "status" IS NULL;

-- ============================================
-- 4. RLS策略：启用删除权限
-- ============================================
DO $$
BEGIN
    -- 删除交易记录的权限
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'Enable delete for all users'
    ) THEN
        CREATE POLICY "Enable delete for all users"
        ON "public"."transactions"
        AS PERMISSIVE FOR DELETE TO public
        USING (true);
    END IF;

    -- 删除项目的权限
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projects' 
        AND policyname = 'Enable delete for all users'
    ) THEN
        CREATE POLICY "Enable delete for all users"
        ON "public"."projects"
        AS PERMISSIVE FOR DELETE TO public
        USING (true);
    END IF;
END $$;

-- ============================================
-- 5. RLS策略：启用更新权限
-- ============================================
DO $$
BEGIN
    -- 更新交易记录的权限
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'Enable update for all users'
    ) THEN
        CREATE POLICY "Enable update for all users"
        ON "public"."transactions"
        AS PERMISSIVE FOR UPDATE TO public
        USING (true);
    END IF;

    -- 更新项目的权限
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projects' 
        AND policyname = 'Enable update for all users'
    ) THEN
        CREATE POLICY "Enable update for all users"
        ON "public"."projects"
        AS PERMISSIVE FOR UPDATE TO public
        USING (true);
    END IF;
END $$;

-- ============================================
-- 完成！
-- ============================================
SELECT '✅ 数据库更新完成！' AS message;
