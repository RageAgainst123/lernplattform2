// Zeigt der Lehrer:in den Beitrittscode + die Login-Adresse für Schüler:innen.
export function JoinCodeHint({ joinCode }: { joinCode: string }) {
  return (
    <div className="bg-muted/50 rounded-md border p-4 text-sm">
      <span className="text-muted-foreground">Anmeldung für Schüler:innen: </span>
      <span className="font-medium">/k/</span>
      <span className="font-mono text-base font-semibold tracking-wider">{joinCode}</span>
      <p className="text-muted-foreground mt-1">
        Die Schüler:innen öffnen diese Adresse, wählen ihren Code und geben ihre PIN ein.
      </p>
    </div>
  );
}
