INSERT INTO "study_subjects" ("id", "title")
SELECT gen_random_uuid()::text, subject.title
FROM (
  VALUES
    ('استاتيكا'),
    ('ديناميكا'),
    ('تفاضل وتكامل'),
    ('هندسة فراغية'),
    ('جبر'),
    ('تاريخ'),
    ('جغرافيا'),
    ('فلسفة'),
    ('علم نفس')
) AS subject(title)
WHERE NOT EXISTS (
  SELECT 1
  FROM "study_subjects" AS existing
  WHERE existing."title" = subject.title
);
