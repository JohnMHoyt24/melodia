const LABELS: Record<string, string> = {
  energy: "Energy",
  valence: "Mood",
  melody: "Melody",
  aggression: "Aggression",
  danceability: "Danceability",
  complexity: "Complexity",
};

export function CharacteristicBars({ scores }: { scores: Record<string, number> }) {
  return (
    <div className="characteristics card">
      <h2>Sound profile</h2>
      <dl>
        {Object.entries(scores).map(([name, score]) => {
          const percent = Math.round(Math.max(0, Math.min(1, score)) * 100);
          return (
            <div key={name} className="characteristic">
              <dt>{LABELS[name] ?? name}</dt>
              <dd>
                <div
                  className="characteristic-track"
                  role="meter"
                  aria-label={LABELS[name] ?? name}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                >
                  <div className="characteristic-fill" style={{ width: `${percent}%` }} />
                </div>
                <span className="characteristic-value">{percent}</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
