-- ============================================================================
--   ⚠️  NUR FÜR LOKALE / DEV-SUPABASE-INSTANZ
--   NIEMALS in der Produktions-DB ausführen!
-- ============================================================================
--
-- Dieses Skript legt Test-Konten zum bequemen lokalen Smoke-Testen an:
--
--   1 Test-Klasse:        Name "Testklasse", join_code = TEST00
--   3 Test-Schüler:innen: 5T-01, 5T-02, 5T-03 — alle mit PIN 0000
--
-- Voraussetzung: in der zugewiesenen Lehrer:in-Zeile (`teachers`) muss ein
-- Eintrag mit einer beliebigen UUID existieren. Wenn du bereits einmal über
-- /login als Lehrer:in eingeloggt warst, ist das automatisch passiert.
--
-- Anwendung:
--   1. Lokales Supabase: `supabase start` (Docker)
--   2. SQL-Editor öffnen ODER `supabase db remote sql --file supabase/seed-test-accounts.sql`
--   3. Bei Bedarf den `LEHRER_EMAIL`-Wert unten anpassen (Standard: erster
--      bestehender Eintrag in `teachers`).
--
-- Aufräumen (vollständig zurücksetzen):
--   DELETE FROM classes WHERE join_code = 'TEST00';
--   (CASCADE löscht student_codes + class_modules + student_progress mit.)
-- ============================================================================

DO $$
DECLARE
  v_teacher_id uuid;
  v_class_id uuid;
  -- bcrypt-Hash für PIN '0000', SALT_ROUNDS=10. Klartext-PIN steht nirgends
  -- in der DB (siehe lib/auth/pin.ts). Hash gilt nur für diese Test-Konten.
  v_pin_hash text := '$2b$10$r17J3RqFgvHj4oO4eczy8ei0RnbFezg.KfUbA5u4OcYm9JsgW2EIi';
BEGIN
  -- Lehrer:in suchen (per E-Mail oder einfach den ersten Eintrag nehmen).
  SELECT id INTO v_teacher_id
  FROM teachers
  ORDER BY created_at
  LIMIT 1;

  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION
      'Keine Lehrer:in in der Tabelle `teachers` gefunden. Bitte zuerst per /login einloggen, damit ein Profil angelegt wird.';
  END IF;

  -- Test-Klasse anlegen (oder bestehende behalten).
  -- `join_code` hat eine UNIQUE-Constraint → ON CONFLICT macht das idempotent.
  -- Hinweis: 'TEST00' enthält Zeichen, die der generator NICHT erzeugen
  -- würde (0 ist verboten) — perfekt, um Test-Klassen von echten zu unter-
  -- scheiden.
  INSERT INTO classes (teacher_id, name, schulstufe, join_code)
  VALUES (v_teacher_id, 'Testklasse', 5, 'TEST00')
  ON CONFLICT (join_code) DO NOTHING;

  SELECT id INTO v_class_id
  FROM classes
  WHERE join_code = 'TEST00';

  -- Drei Codes anlegen — PIN ist immer 0000 (siehe Hash oben).
  -- UNIQUE-Constraint ist (class_id, codename), nicht codename allein.
  INSERT INTO student_codes (class_id, codename, pin_hash)
  VALUES
    (v_class_id, '5T-01', v_pin_hash),
    (v_class_id, '5T-02', v_pin_hash),
    (v_class_id, '5T-03', v_pin_hash)
  ON CONFLICT (class_id, codename) DO NOTHING;

  -- Demo-Modul „EVA-Prinzip" der Test-Klasse zuweisen, falls vorhanden.
  -- (Wenn das Modul noch nicht existiert, passiert hier einfach nichts.)
  -- UNIQUE-Constraint: (class_id, module_id).
  INSERT INTO class_modules (class_id, module_id)
  SELECT v_class_id, id
  FROM modules
  WHERE title ILIKE '%EVA%'
  ON CONFLICT (class_id, module_id) DO NOTHING;

  RAISE NOTICE 'Test-Konten angelegt: Klasse 5T (TEST00), Codes 5T-01..03, PIN 0000.';
END $$;
