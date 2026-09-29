"use client";

import { useEffect, useState } from "react";
import { getAuditData } from "../lib/data";
import { ScoreCard } from "../components/score-card";
import { TrendChart } from "../components/trend-chart";
import { Hotspots } from "../components/hotspots";

export default function Page() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        getAuditData().then(setData);
    }, []);

    if (!data) return <div style={{ padding: 40 }}>Loading...</div>;

    return (
        <main style={{ padding: 40 }}>
            <h1>AI Audit Dashboard</h1>

            <ScoreCard result={data.result} />

            <TrendChart data={data.history} />

            <Hotspots files={data.result?.files} />
        </main>
    );
}