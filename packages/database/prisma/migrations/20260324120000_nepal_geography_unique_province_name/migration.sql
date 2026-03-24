-- Fix duplicate top-level provinces (PostgreSQL allows repeated (nameEn, NULL) in UNIQUE).
-- Then enforce at most one PROVINCE row per nameEn when parentId IS NULL.

-- 1) Point all districts at the canonical province (smallest id per nameEn)
UPDATE "NepalGeography" AS d
SET "parentId" = m.keep_id
FROM (
  SELECT ng.id AS old_id, (
    SELECT MIN(ng2.id)
    FROM "NepalGeography" ng2
    WHERE ng2.type = 'PROVINCE'::"GeographyType"
      AND ng2."parentId" IS NULL
      AND ng2."nameEn" = ng."nameEn"
  ) AS keep_id
  FROM "NepalGeography" ng
  WHERE ng.type = 'PROVINCE'::"GeographyType"
    AND ng."parentId" IS NULL
) AS m
WHERE d.type = 'DISTRICT'::"GeographyType"
  AND d."parentId" = m.old_id
  AND m.keep_id IS NOT NULL
  AND m.old_id <> m.keep_id;

-- 2) Normalize district FKs on User / ClientProfile to the canonical district row per (parentId, nameEn)
UPDATE "User" u
SET "placeOfBirthDistrictId" = sub.canonical_id
FROM (
  SELECT nd.id AS any_id,
         (
           SELECT MIN(nd2.id)
           FROM "NepalGeography" nd2
           WHERE nd2.type = 'DISTRICT'::"GeographyType"
             AND nd2."parentId" = nd."parentId"
             AND nd2."nameEn" = nd."nameEn"
         ) AS canonical_id
  FROM "NepalGeography" nd
  WHERE nd.type = 'DISTRICT'::"GeographyType"
) AS sub
WHERE u."placeOfBirthDistrictId" = sub.any_id
  AND sub.canonical_id IS NOT NULL
  AND u."placeOfBirthDistrictId" <> sub.canonical_id;

UPDATE "ClientProfile" cp
SET "placeOfBirthDistrictId" = sub.canonical_id
FROM (
  SELECT nd.id AS any_id,
         (
           SELECT MIN(nd2.id)
           FROM "NepalGeography" nd2
           WHERE nd2.type = 'DISTRICT'::"GeographyType"
             AND nd2."parentId" = nd."parentId"
             AND nd2."nameEn" = nd."nameEn"
         ) AS canonical_id
  FROM "NepalGeography" nd
  WHERE nd.type = 'DISTRICT'::"GeographyType"
) AS sub
WHERE cp."placeOfBirthDistrictId" = sub.any_id
  AND sub.canonical_id IS NOT NULL
  AND cp."placeOfBirthDistrictId" <> sub.canonical_id;

-- 3) Remove duplicate district rows (same nameEn + parentId), keeping smallest id
DELETE FROM "NepalGeography" nd
WHERE nd.type = 'DISTRICT'::"GeographyType"
  AND EXISTS (
    SELECT 1
    FROM "NepalGeography" nd2
    WHERE nd2.type = 'DISTRICT'::"GeographyType"
      AND nd2."parentId" = nd."parentId"
      AND nd2."nameEn" = nd."nameEn"
      AND nd2.id < nd.id
  );

-- 4) Normalize province FKs to canonical province id per nameEn
UPDATE "User" u
SET "placeOfBirthPradeshId" = sub.canonical_id
FROM (
  SELECT ng.id AS any_id,
         (
           SELECT MIN(ng2.id)
           FROM "NepalGeography" ng2
           WHERE ng2.type = 'PROVINCE'::"GeographyType"
             AND ng2."parentId" IS NULL
             AND ng2."nameEn" = ng."nameEn"
         ) AS canonical_id
  FROM "NepalGeography" ng
  WHERE ng.type = 'PROVINCE'::"GeographyType"
    AND ng."parentId" IS NULL
) AS sub
WHERE u."placeOfBirthPradeshId" = sub.any_id
  AND sub.canonical_id IS NOT NULL
  AND u."placeOfBirthPradeshId" <> sub.canonical_id;

UPDATE "ClientProfile" cp
SET "placeOfBirthPradeshId" = sub.canonical_id
FROM (
  SELECT ng.id AS any_id,
         (
           SELECT MIN(ng2.id)
           FROM "NepalGeography" ng2
           WHERE ng2.type = 'PROVINCE'::"GeographyType"
             AND ng2."parentId" IS NULL
             AND ng2."nameEn" = ng."nameEn"
         ) AS canonical_id
  FROM "NepalGeography" ng
  WHERE ng.type = 'PROVINCE'::"GeographyType"
    AND ng."parentId" IS NULL
) AS sub
WHERE cp."placeOfBirthPradeshId" = sub.any_id
  AND sub.canonical_id IS NOT NULL
  AND cp."placeOfBirthPradeshId" <> sub.canonical_id;

-- 5) Remove duplicate province rows (same nameEn), keeping smallest id
DELETE FROM "NepalGeography" ng
WHERE ng.type = 'PROVINCE'::"GeographyType"
  AND ng."parentId" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "NepalGeography" ng2
    WHERE ng2.type = 'PROVINCE'::"GeographyType"
      AND ng2."parentId" IS NULL
      AND ng2."nameEn" = ng."nameEn"
      AND ng2.id < ng.id
  );

-- 6) Enforce uniqueness: one row per English province name at top level
CREATE UNIQUE INDEX IF NOT EXISTS "NepalGeography_province_nameEn_top_level_key"
  ON "NepalGeography" ("nameEn")
  WHERE type = 'PROVINCE'::"GeographyType" AND "parentId" IS NULL;
