-- ============================================
-- 修复项目开始日期问题
-- ============================================
-- 此脚本将修复导致进度显示为0%的开始日期问题
-- 
-- 问题：
-- 1. 开始日期在未来
-- 2. 开始日期 = 截止日期
-- 3. 开始日期晚于创建日期太多
--
-- 运行方式：
-- 1. 打开 Supabase Dashboard → SQL Editor
-- 2. 粘贴此脚本全部内容
-- 3. 点击 "Run" 执行
-- ============================================

-- 步骤1: 查看当前有问题的项目
SELECT 
    id,
    name,
    start_date,
    deadline,
    created_at::date as created_date,
    CASE 
        WHEN start_date > CURRENT_DATE THEN '❌ 开始日期在未来'
        WHEN start_date >= deadline THEN '❌ 开始日期>=截止日期'
        WHEN start_date > created_at::date + INTERVAL '7 days' THEN '⚠️ 开始日期晚于创建日期'
        ELSE '✅ 正常'
    END as status,
    CASE 
        WHEN start_date > CURRENT_DATE THEN created_at::date
        WHEN start_date >= deadline THEN GREATEST(created_at::date, deadline - INTERVAL '90 days')
        ELSE start_date
    END as suggested_fix
FROM projects
ORDER BY created_at DESC;

-- 步骤2: 自动修复所有问题
-- 策略：
-- - 如果开始日期在未来 → 设为创建日期
-- - 如果开始日期>=截止日期 → 设为截止日期前90天（或创建日期，取较晚者）

UPDATE projects
SET start_date = CASE 
    -- 如果开始日期在未来，设为创建日期
    WHEN start_date > CURRENT_DATE THEN created_at::date
    
    -- 如果开始日期>=截止日期，设为deadline前90天和created_at中较晚的那个
    WHEN start_date >= deadline THEN 
        GREATEST(
            created_at::date,
            (deadline - INTERVAL '90 days')::date
        )
    
    -- 其他情况保持不变
    ELSE start_date
END
WHERE start_date > CURRENT_DATE 
   OR start_date >= deadline;

-- 步骤3: 验证修复结果
SELECT 
    id,
    name,
    start_date,
    deadline,
    (deadline - start_date) as days_duration,
    ROUND(
        (CURRENT_DATE - start_date)::numeric / 
        NULLIF((deadline - start_date)::numeric, 0) * 100
    ) as progress_pct
FROM projects
ORDER BY created_at DESC
LIMIT 10;

