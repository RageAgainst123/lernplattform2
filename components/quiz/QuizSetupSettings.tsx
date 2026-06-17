'use client';

// Settings-Form-Sub-Komponenten für die Quiz-Setup-Seite (S1.D).
// Ausgelagert aus QuizSetupForm.tsx wegen max-lines (200).

export type SettingsState = {
  timeLimit: number;
  teamMode: boolean;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showLeaderboardBetween: boolean;
};

export function defaultSettings(): SettingsState {
  return {
    timeLimit: 30,
    teamMode: false,
    shuffleQuestions: false,
    shuffleAnswers: true,
    showLeaderboardBetween: true,
  };
}

export function SettingsBlock({
  settings,
  setSettings,
}: {
  settings: SettingsState;
  setSettings: (s: SettingsState) => void;
}) {
  const patch = (p: Partial<SettingsState>) => setSettings({ ...settings, ...p });
  return (
    <div className="bg-card space-y-4 rounded-lg border p-4">
      <TimeLimitField value={settings.timeLimit} onChange={(timeLimit) => patch({ timeLimit })} />
      <Toggle
        label="Team-Modus (1 Gerät pro Team, Teamname)"
        checked={settings.teamMode}
        onChange={(teamMode) => patch({ teamMode })}
        hint="Schüler:innen teilen sich ein Gerät und wählen vor dem Quiz einen Teamnamen."
      />
      <Toggle
        label="Fragen-Reihenfolge mischen"
        checked={settings.shuffleQuestions}
        onChange={(shuffleQuestions) => patch({ shuffleQuestions })}
      />
      <Toggle
        label="Antwort-Optionen mischen"
        checked={settings.shuffleAnswers}
        onChange={(shuffleAnswers) => patch({ shuffleAnswers })}
      />
      <Toggle
        label="Leaderboard zwischen Fragen zeigen"
        checked={settings.showLeaderboardBetween}
        onChange={(showLeaderboardBetween) => patch({ showLeaderboardBetween })}
      />
    </div>
  );
}

function TimeLimitField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor="time-limit" className="text-sm font-medium">
        Zeit pro Frage
      </label>
      <select
        id="time-limit"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
      >
        {[10, 15, 20, 30, 45, 60, 90, 120].map((s) => (
          <option key={s} value={s}>
            {s} Sekunden
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4"
        />
        <span>{label}</span>
      </label>
      {hint && <p className="text-muted-foreground mt-1 ml-6 text-xs">{hint}</p>}
    </div>
  );
}
