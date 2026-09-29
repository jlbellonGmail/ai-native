export function Hotspots({ files }: any) {
    if (!files?.length) return <p>No hotspots</p>;

    const worst = [...files]
        .sort((a, b) => a.score - b.score)
        .slice(0, 5);

    return (
        <div style={{ padding: 20, border: "1px solid #333", borderRadius: 12 }}>
            <h2>Hotspots</h2>
            <ul>
                {worst.map((f: any) => (
                    <li key={f.path}>
                        {f.path} — {f.score}
                    </li>
                ))}
            </ul>
        </div>
    );
}