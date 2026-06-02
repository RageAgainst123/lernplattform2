-- Migration 0017: Optionale E-Mail-Domain-Allowlist pro Klasse (Phase O4).
--
-- Damit kann eine Lehrer:in einschränken, welche O365-Konten ihrer Klasse
-- via Klassen-Code beitreten dürfen. Beispiel: nur @ms-musterschule.at-
-- Konten dürfen "Klasse 1A 2026" beitreten — schützt vor zufälligen
-- Beitritten durch andere Schüler:innen die den Code z.B. im Schulgang
-- mitgekriegt haben.
--
-- Semantik:
--   NULL  oder leeres Array  → alle Domains erlaubt (Standard)
--   ['ms-musterschule.at']    → nur diese eine Domain
--   ['a.at', 'b.at']          → beide erlaubt
--
-- Domain-Vergleich: lowercase, ohne `@`. joinClassWithO365 prüft das
-- vor dem Insert. Code+PIN-Schüler:innen sind nicht betroffen (keine
-- E-Mail vorhanden).

alter table public.classes
  add column if not exists allowed_email_domains text[];

comment on column public.classes.allowed_email_domains is
  'Optionale Whitelist von E-Mail-Domains für O365-SSO-Beitritt. NULL/leer = alle erlaubt.';
