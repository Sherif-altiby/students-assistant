CREATE TEMP TABLE "_flat_units" AS
WITH RECURSIVE ranked AS (
  SELECT
    chapter."id",
    chapter."subject_id",
    chapter."parent_id",
    chapter."title",
    ROW_NUMBER() OVER (
      PARTITION BY chapter."subject_id", chapter."parent_id"
      ORDER BY chapter."order", chapter."createdAt", chapter."id"
    )::INTEGER AS sibling_order
  FROM "study_chapters" AS chapter
),
chapter_tree AS (
  SELECT
    id,
    subject_id,
    title AS flattened_title,
    ARRAY[sibling_order] AS syllabus_order
  FROM ranked
  WHERE parent_id IS NULL

  UNION ALL

  SELECT
    child.id,
    child.subject_id,
    parent.flattened_title || ' › ' || child.title,
    parent.syllabus_order || child.sibling_order
  FROM chapter_tree AS parent
  JOIN ranked AS child ON child.parent_id = parent.id
)
SELECT
  id,
  subject_id,
  flattened_title,
  ROW_NUMBER() OVER (
    PARTITION BY subject_id
    ORDER BY syllabus_order, id
  )::INTEGER AS new_order
FROM chapter_tree;

CREATE TEMP TABLE "_flat_lessons" AS
WITH RECURSIVE ranked AS (
  SELECT
    lesson."id",
    lesson."chapter_id",
    lesson."parent_id",
    lesson."title",
    ROW_NUMBER() OVER (
      PARTITION BY lesson."chapter_id", lesson."parent_id"
      ORDER BY lesson."order", lesson."createdAt", lesson."id"
    )::INTEGER AS sibling_order
  FROM "study_lessons" AS lesson
),
lesson_tree AS (
  SELECT
    id,
    chapter_id,
    title AS flattened_title,
    ARRAY[sibling_order] AS syllabus_order
  FROM ranked
  WHERE parent_id IS NULL

  UNION ALL

  SELECT
    child.id,
    child.chapter_id,
    parent.flattened_title || ' › ' || child.title,
    parent.syllabus_order || child.sibling_order
  FROM lesson_tree AS parent
  JOIN ranked AS child ON child.parent_id = parent.id
),
leaf_lessons AS (
  SELECT tree.*
  FROM lesson_tree AS tree
  WHERE NOT EXISTS (
    SELECT 1
    FROM "study_lessons" AS child
    WHERE child."parent_id" = tree.id
  )
)
SELECT
  id,
  chapter_id,
  flattened_title,
  ROW_NUMBER() OVER (
    PARTITION BY chapter_id
    ORDER BY syllabus_order, id
  )::INTEGER AS new_order
FROM leaf_lessons;

DO $$
DECLARE
  deleted_sessions INTEGER;
  deleted_completions INTEGER;
BEGIN
  SELECT COUNT(*) INTO deleted_sessions
  FROM "study_sessions" AS session
  WHERE NOT EXISTS (
    SELECT 1 FROM "_flat_lessons" AS leaf WHERE leaf.id = session."lesson_id"
  );

  SELECT COUNT(*) INTO deleted_completions
  FROM "study_lesson_completions" AS completion
  WHERE NOT EXISTS (
    SELECT 1 FROM "_flat_lessons" AS leaf WHERE leaf.id = completion."lesson_id"
  );

  DELETE FROM "study_sessions" AS session
  WHERE NOT EXISTS (
    SELECT 1 FROM "_flat_lessons" AS leaf WHERE leaf.id = session."lesson_id"
  );

  DELETE FROM "study_lesson_completions" AS completion
  WHERE NOT EXISTS (
    SELECT 1 FROM "_flat_lessons" AS leaf WHERE leaf.id = completion."lesson_id"
  );

  RAISE NOTICE 'Flattening study catalog removed % study sessions and % lesson completions linked to non-leaf lessons.',
    deleted_sessions, deleted_completions;
END $$;

UPDATE "study_lessons" AS lesson
SET
  "title" = flat.flattened_title,
  "order" = flat.new_order,
  "parent_id" = NULL
FROM "_flat_lessons" AS flat
WHERE lesson."id" = flat.id;

DELETE FROM "study_lessons" AS lesson
WHERE NOT EXISTS (
  SELECT 1 FROM "_flat_lessons" AS flat WHERE flat.id = lesson."id"
);

UPDATE "study_chapters" AS chapter
SET
  "title" = flat.flattened_title,
  "order" = flat.new_order,
  "parent_id" = NULL
FROM "_flat_units" AS flat
WHERE chapter."id" = flat.id;

ALTER TABLE "study_lessons"
  DROP CONSTRAINT "study_lessons_parent_id_fkey",
  DROP CONSTRAINT "study_lessons_chapter_id_fkey",
  DROP COLUMN "parent_id";

ALTER TABLE "study_chapters"
  DROP CONSTRAINT "study_chapters_parent_id_fkey",
  DROP CONSTRAINT "study_chapters_subject_id_fkey",
  DROP COLUMN "parent_id";

ALTER TABLE "study_chapters" RENAME TO "study_units";
ALTER TABLE "study_lessons" RENAME COLUMN "chapter_id" TO "unit_id";

DROP INDEX IF EXISTS "study_chapters_parent_id_idx";
DROP INDEX IF EXISTS "study_chapters_subject_id_idx";
DROP INDEX IF EXISTS "study_lessons_parent_id_idx";
DROP INDEX IF EXISTS "study_lessons_chapter_id_idx";

ALTER TABLE "study_units"
  RENAME CONSTRAINT "study_chapters_pkey" TO "study_units_pkey";

ALTER TABLE "study_units"
  ADD CONSTRAINT "study_units_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "study_subjects"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "study_lessons"
  ADD CONSTRAINT "study_lessons_unit_id_fkey"
  FOREIGN KEY ("unit_id") REFERENCES "study_units"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "study_units_subject_id_order_key"
  ON "study_units"("subject_id", "order");
CREATE INDEX "study_units_subject_id_idx"
  ON "study_units"("subject_id");
CREATE UNIQUE INDEX "study_lessons_unit_id_order_key"
  ON "study_lessons"("unit_id", "order");
CREATE INDEX "study_lessons_unit_id_idx"
  ON "study_lessons"("unit_id");

DROP TABLE "_flat_lessons";
DROP TABLE "_flat_units";
