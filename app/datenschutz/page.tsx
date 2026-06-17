import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import {
  PublicBrowsingPart,
  TeacherLoginPart,
  StudentCodePinPart,
  StudentSsoPart,
  WordHeftPart,
} from './DataPartials';

export const metadata: Metadata = {
  title: 'Datenschutz',
  description: `Datenschutzerklärung der Plattform ${BRAND.name} nach DSGVO Art. 13.`,
};

// DSGVO Art. 13. Spiegelt die TATSÄCHLICHE Verarbeitung wider —
// kein juristisches Boilerplate. Aktualisieren, wenn neue Auftragsverarbeiter
// dazukommen oder das Schüler:innen-Datenmodell erweitert wird.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="space-y-3 text-base leading-relaxed">{children}</div>
    </section>
  );
}

function EmailLink() {
  return (
    <a className="text-primary hover:underline" href={`mailto:${BRAND.contactEmail}`}>
      {BRAND.contactEmail}
    </a>
  );
}

function DataSection() {
  return (
    <Section title="Welche Daten werden verarbeitet?">
      <PublicBrowsingPart />
      <TeacherLoginPart />
      <StudentCodePinPart />
      <StudentSsoPart />
      <WordHeftPart />
    </Section>
  );
}

function ProcessorsSection() {
  return (
    <Section title="Auftragsverarbeiter">
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>Supabase Inc.</strong> (Datenbank, Authentifizierung, Datei-Speicher) — die
          Verarbeitung erfolgt in der Region <strong>{BRAND.hostingRegion}</strong>. Vertragliche
          Grundlage: Standard-DPA mit Supabase.
        </li>
        <li>
          <strong>Resend</strong> (E-Mail-Versand der Magic-Links für Lehrer:innen) — Verarbeitung
          in der EU.
        </li>
        <li>
          <strong>Microsoft Ireland Operations Ltd.</strong> (Microsoft Entra ID / Azure AD,
          Identitäts-Prüfung beim O365-Login der Schüler:innen) — Verarbeitung primär in der EU
          (Rechenzentren Dublin / Amsterdam). Vertragliche Grundlage: Microsoft Online Services DPA
          mit Standardvertragsklauseln nach Art. 46 DSGVO. Datenfluss: beim Login leitet die
          Plattform den Browser zu Microsoft weiter, Microsoft prüft das Passwort und schickt
          Vorname/Nachname/E-Mail zurück. Bei der Microsoft-Verarbeitung selbst können vereinzelt
          Telemetrie-Daten in die USA fließen (Microsoft-eigene Datenschutzrichtlinie).
        </li>
        <li>
          <strong>Pexels (NV)</strong> (kuratierter Bild-Bestand für das Schulheft) — die App ruft
          beim Bild-Picker Suchergebnisse der Pexels-API ab. Bilder werden direkt vom Pexels-CDN
          eingebunden, nicht in unserer Datenbank gespeichert. Keine personenbezogenen Daten der
          Schüler:innen werden an Pexels übertragen.
        </li>
      </ul>
      <p>
        Es findet bei Supabase und Resend{' '}
        <strong>kein Daten-Transfer in Drittstaaten außerhalb der EU</strong> statt.
        Microsoft-Telemetrie kann in die USA fließen — abgesichert über Standardvertragsklauseln.
        Schüler:innen die das vermeiden möchten, nutzen den pseudonymen Code+PIN-Login.
      </p>
    </Section>
  );
}

function RetentionSection() {
  return (
    <Section title="Speicherdauer">
      <ul className="list-disc space-y-2 pl-6">
        <li>Server-Logs: 30 Tage, dann automatische Löschung.</li>
        <li>
          Lehrer:innen-Konten: bis zur eigenständigen Löschung durch die Lehrkraft (per E-Mail an
          die oben genannte Adresse).
        </li>
        <li>
          Schüler:innen-Codes + Fortschritte (egal ob Code+PIN oder O365-SSO): bis die Lehrkraft die
          zugehörige Klasse löscht, die Schüler:in selbst die Klasse verlässt, oder spätestens am
          Ende des Schuljahres.
        </li>
        <li>Hochgeladene Materialien (PDFs): bis zur Löschung durch die Lehrkraft.</li>
        <li>
          Word-Schulübungsheft-Links (Phase Q): bis zur Löschung durch die Schüler:in oder beim
          Klassen-Verlassen. Die Word-Datei selbst bleibt im OneDrive der Schüler:in.
        </li>
      </ul>
    </Section>
  );
}

function RightsSection() {
  return (
    <Section title="Ihre Rechte">
      <p>Sie haben jederzeit das Recht auf:</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO),</li>
        <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO),</li>
        <li>Löschung (&bdquo;Recht auf Vergessenwerden&ldquo;, Art. 17 DSGVO),</li>
        <li>Einschränkung der Verarbeitung (Art. 18 DSGVO),</li>
        <li>Datenübertragbarkeit (Art. 20 DSGVO),</li>
        <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO).</li>
      </ul>
      <p>
        Anfragen bitte formlos per E-Mail an <EmailLink />.
      </p>
    </Section>
  );
}

function HeaderBlock() {
  return (
    <header>
      <h1 className="text-3xl font-semibold tracking-tight">Datenschutzerklärung</h1>
      <p className="text-muted-foreground mt-2">
        Stand: Juni 2026. Diese Erklärung beschreibt, welche Daten beim Besuch und bei der Nutzung
        von {BRAND.name} verarbeitet werden, auf welcher Rechtsgrundlage, wie lange und mit welchen
        Auftragsverarbeitern.
      </p>
    </header>
  );
}

function ControllerSection() {
  return (
    <Section title="Verantwortlicher">
      <p>
        Geo Schlegel, Österreich. Kontakt: <EmailLink />. Anschrift siehe{' '}
        <a className="text-primary hover:underline" href="/impressum">
          Impressum
        </a>
        .
      </p>
    </Section>
  );
}

function CookiesSection() {
  return (
    <Section title="Cookies">
      <p>
        {BRAND.name} verwendet ausschließlich <strong>technisch notwendige</strong> Cookies: ein
        Auth-Cookie von Supabase (Lehrer:innen-Session) bzw. ein HTTP-Only-Cookie mit signierter
        JWT-Session (Schüler:innen-Session, bis zu 1 Jahr Gültigkeit). Beim Microsoft-Login der
        Schüler:innen wird kurzzeitig (10 Minuten) ein zweiter HTTP-Only-Cookie gesetzt, der die
        Microsoft-Identität bis zur Klassen-Code-Eingabe trägt. Keine Tracker, keine
        Marketing-Cookies, keine externen Analyse-Dienste. Daher kein Cookie-Banner notwendig.
      </p>
    </Section>
  );
}

function ComplaintSection() {
  return (
    <Section title="Beschwerderecht">
      <p>
        Wenn Sie der Auffassung sind, dass die Verarbeitung Ihrer Daten gegen die DSGVO verstößt,
        können Sie sich bei der österreichischen Datenschutzbehörde beschweren:{' '}
        <a
          className="text-primary hover:underline"
          href="https://www.dsb.gv.at/"
          target="_blank"
          rel="noreferrer"
        >
          dsb.gv.at
        </a>
        .
      </p>
    </Section>
  );
}

export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <HeaderBlock />
      <ControllerSection />
      <DataSection />
      <CookiesSection />
      <ProcessorsSection />
      <RetentionSection />
      <RightsSection />
      <ComplaintSection />
    </div>
  );
}
