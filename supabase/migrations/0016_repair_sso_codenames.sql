-- Migration 0016: Reparatur defekter SSO-Codenames (Phase O3-Bugfix).
--
-- Wenn ein O365-Token kein given_name/family_name liefert hatte der erste
-- Sub-Phase-O2-Entwurf von uniqueCodename() den Codename '.' (slug aus '.')
-- oder 'sso-user' erzeugt. Das hat sich im UI als „Angemeldet als ." gezeigt.
--
-- Phase O3-Fix:
--   1. Callback-Helper extrahiert Names jetzt robuster (Fallback auf
--      user_metadata.name + Email-Lokalteil)
--   2. studentDisplayName-Helper ignoriert defekte Codenames und nutzt
--      given_name/surname oder o365_email
--
-- Diese Migration repariert bestehende defekte Rows: setzt codename auf
-- den Email-Lokalteil (lowercase, slugifiziert), so dass nicht-SSO-Anzeigen
-- (z.B. Klassen-Fortschritts-Matrix-Header die nur codename rendern) auch
-- vernünftig aussehen.

update public.student_codes
   set codename = lower(regexp_replace(split_part(o365_email, '@', 1), '[^a-z0-9.-]', '-', 'g'))
 where o365_email is not null
   and (codename is null or codename = '' or codename = '.' or codename = 'sso-user');
