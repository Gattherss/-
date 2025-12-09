-- 检查"小南湖2025资助专项"的具体数据
SELECT 
    id,
    name,
    start_date,
    deadline,
    created_at,
    CURRENT_DATE as today,
    (CURRENT_DATE - start_date) as days_since_start,
    (deadline - start_date) as total_days,
    CASE 
        WHEN (deadline - start_date) = 0 THEN 0
        ELSE ROUND((CURRENT_DATE - start_date)::numeric / (deadline - start_date)::numeric * 100)
    END as calculated_progress_pct
FROM projects
WHERE name = '小南湖2025资助专项';
