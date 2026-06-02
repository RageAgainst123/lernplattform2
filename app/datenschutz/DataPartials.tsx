// Sub-Komponenten der "Welche Daten werden verarbeitet?"-Sektion der
// Datenschutz-Seite. Eigene Datei damit page.tsx unter dem 200-Zeilen-Limit
// bleibt. Jede dieser Komponenten ist ein Fragment mit <h3> + <p>(s).

export function PublicBrowsingPart() {
  return (
    <>
      <h3 className="text-lg font-medium">Beim Besuch der öffentlichen Seiten</h3>
      <p>
        Beim Aufruf jeder Seite werden technisch notwendige Daten verarbeitet: IP-Adresse,
        Datum/Uhrzeit, abgerufene URL, User-Agent. Diese Server-Logs werden ausschließlich zur
        Sicherstellung des Betriebs und zur Abwehr von Angriffen verarbeitet, getrennt von allen
        anderen Daten gespeichert und nach <strong>30 Tagen automatisch gelöscht</strong>.
        Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am stabilen Betrieb).
      </p>
    </>
  );
}

export function TeacherLoginPart() {
  return (
    <>
      <h3 className="text-lg font-medium">Bei der Lehrer:innen-Anmeldung</h3>
      <p>
        Lehrkräfte melden sich per Magic-Link an (E-Mail-Adresse, kein Passwort). Erhoben und
        gespeichert wird die E-Mail-Adresse und optional ein selbstgewählter Anzeigename. Die
        Authentifizierung übernimmt Supabase Auth. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO
        (Vertragserfüllung — Nutzung des Lehrer:innen-Bereichs).
      </p>
    </>
  );
}

export function StudentCodePinPart() {
  return (
    <>
      <h3 className="text-lg font-medium">Bei Schüler:innen-Zugängen (Code + PIN, pseudonym)</h3>
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
    </>
  );
}

export function StudentSsoPart() {
  return (
    <>
      <h3 className="text-lg font-medium">Bei Schüler:innen-Zugängen (Microsoft 365, optional)</h3>
      <p>
        Alternativ können Schüler:innen sich mit ihrem <strong>Schul-Microsoft-365-Konto</strong>{' '}
        anmelden (in Niederösterreich für alle Schul­stufen verfügbar). In diesem Fall werden{' '}
        <strong>Vorname, Nachname und Schul-E-Mail-Adresse</strong> gespeichert — sowie die stabile
        Microsoft Object-ID, damit Folge-Anmeldungen ohne erneuten Klassen-Code-Eintrag
        funktionieren. Die Authentifizierung läuft über Supabase Auth mit Microsoft Entra ID (Azure
        AD) als Identitäts-Provider. Es wird <strong>kein Passwort</strong> gespeichert — die
        Passwort­prüfung bleibt bei Microsoft. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO i. V. m.
        dem schulischen Auftrag, ergänzend Art. 6 Abs. 1 lit. a (Einwilligung in die
        Microsoft-Verarbeitung über die Schul-IT-Vereinbarung der Eltern).
      </p>
      <p>
        Schüler:innen können jederzeit auf den pseudonymen Code+PIN-Pfad wechseln — und sich aus der
        Klasse austragen (Menü oben rechts → &bdquo;Klasse verlassen&ldquo;). Dabei werden ihre
        Daten in der Lernplattform gelöscht; das Microsoft-Konto selbst bleibt unberührt.
      </p>
    </>
  );
}
