"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts";

export function TrendChart({ data }: any) {
    return (
        <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
                <LineChart data={data}>
                    <XAxis dataKey="date" hide />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" strokeWidth={3} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}