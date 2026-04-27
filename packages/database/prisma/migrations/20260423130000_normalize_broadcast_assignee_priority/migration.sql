-- Renumber priorities to 1..n by stable order (fixes historical duplicate `priority` values).
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY priority ASC, id ASC) AS rn
  FROM "BroadcastAssigneePriority"
)
UPDATE "BroadcastAssigneePriority" AS p
SET priority = o.rn
FROM ordered AS o
WHERE p.id = o.id;
