export function ScoreCard({ result }: any) {
    const score = result?.score ?? 0;

    return (
        <div style={{ padding: 20, border: "1px solid #333", borderRadius: 12 }}>
            <h2>AI Score</h2>
            <p style={{ fontSize: 40 }}>{score}/10</p>
            <p>Trend: {result?.trend ?? "unknown"}</p>
        </div>
    );
}