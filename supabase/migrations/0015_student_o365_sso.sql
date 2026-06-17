-- Migration 0015: O365-SSO-Support für Schüler:innen (Phase O1).
--
-- Erweitert student_codes um optionale O365-Identitäts-Felder. Bestehende
-- Code+PIN-Schüler:innen sind nicht betroffen (alle neuen Spalten nullable).
-- Ein O365-Schüler:in hat o365_oid + o365_email + given_name + surname
-- gesetzt, einen automatisch erzeugten Codename (z.B. vorname.nachname mit
-- Kollisions-Suffix), und KEIN pin_hash.
--
-- Ein Kind kann in mehreren Klassen sein → pro (o365_oid, class_id) eine
-- eigene student_codes-Row mit gleicher o365_oid.

alter table public.student_codes
	add column if not exists o365_oid            text,
	add column if not exists o365_email          text,
	add column if not exists given_name          text,
	add column if not exists surname             text,
	add column if not exists sso_first_login_at  timestamptz;

-- Partial unique index: (o365_oid, class_id) muss eindeutig sein, NULL
-- wird ignoriert (Code+PIN-Schüler:innen kollidieren nicht).
create unique index if not exists student_codes_o365_oid_class_idx
	on public.student_codes (o365_oid, class_id)
	where o365_oid is not null;

-- Hilfsindex für schnellen Lookup beim Login: alle Rows eines O365-Users
-- über alle Klassen finden ("welche Klassen ist dieses Kind beigetreten?").
create index if not exists student_codes_o365_oid_idx
	on public.student_codes (o365_oid)
	where o365_oid is not null;

-- pin_hash darf jetzt NULL sein (SSO-Schüler:innen haben keine PIN).
alter table public.student_codes
	alter column pin_hash drop not null;

-- Check-Constraint: entweder pin_hash gesetzt (Code+PIN) ODER o365_oid
-- gesetzt (SSO). Beides darf nicht gleichzeitig NULL sein.
alter table public.student_codes
	drop constraint if exists student_codes_auth_check;

alter table public.student_codes
	add constraint student_codes_auth_check
	check (pin_hash is not null or o365_oid is not null);
