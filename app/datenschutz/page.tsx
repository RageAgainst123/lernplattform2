import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';

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
      <h3 className="text-lg font-medium">Beim Besuch der öffentlichen Seiten</h3>
      <p>
        Beim Aufruf jeder Seite werden technisch notwendige Daten verarbeitet: IP-Adresse,
        Datum/Uhrzeit, abgerufene URL, User-Agent. Diese Server-Logs werden ausschließlich zur
        Sicherstellung des Betriebs und zur Abwehr von Angriffen verarbeitet, getrennt von allen
        anderen Daten gespeichert und nach <strong>30 Tagen automatisch gelöscht</strong>.
        Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am stabilen Betrieb).
      </p>
      <h3 className="text-lg font-medium">Bei der Lehrer:innen-Anmeldung</h3>
      <p>
        Lehrkräfte melden sich per Magic-Link an (E-Mail-Adresse, kein Passwort). Erhoben und
        gespeichert wird die E-Mail-Adresse und optional ein selbstgewählter Anzeigename. Die
        Authentifizierung übernimmt Supabase Auth. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO
        (Vertragserfüllung — Nutzung des Lehrer:innen-Bereichs).
      </p>
      <h3 className="text-lg font-medium">Bei Schüler:innen-Zugängen</h3>
      <p>
        Schüler:innen melden sich mit einem <strong>pseudonymen Klassencode</strong> (z. B.
        &bdquo;5A-01&ldquo;) und einer 4-stelligen PIN an. Es werden{' '}
        <strong>keine Klarnamen</strong>, keine E-Mail-Adressen und keine sonstigen
        personenbezogenen Daten erhoben. Die PIN wird ausschließlich als bcrypt-Hash gespeichert.
        Zusätzlich werden Modul-Fortschritte (Score, Zeitstempel, abgegebene Antworten in
        pseudonymer Form) gespeichert. Diese Daten sind nur für die jeweilige Lehrkraft und das
        pseudonyme Konto einsehbar. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO i. V. m. dem
        schulischen Auftrag der Lehrkraft.
      </p>
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
      </ul>
      <p>Es findet kein Daten-Transfer in Drittstaaten außerhalb der EU statt.</p>
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
          Schüler:innen-Codes + Fortschritte: bis die Lehrkraft die zugehörige Klasse löscht,
          spätestens am Ende des Schuljahres.
        </li>
        <li>Hochgeladene Materialien (PDFs): bis zur Löschung durch die Lehrkraft.</li>
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
        Stand: Mai 2026. Diese Erklärung beschreibt, welche Daten beim Besuch und bei der Nutzung
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
        JWT-Session (Schüler:innen-Session, bis zu 1 Jahr Gültigkeit). Keine Tracker, keine
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
