INSERT INTO "study_subjects" ("id", "title")
SELECT gen_random_uuid()::text, subject.title
FROM (
  VALUES
    ('الأحياء'),
    ('الكيمياء'),
    ('الفيزياء'),
    ('اللغة العربية'),
    ('اللغة الإنجليزية')
) AS subject(title)
WHERE NOT EXISTS (
  SELECT 1
  FROM "study_subjects" AS existing
  WHERE existing."title" = subject.title
);
