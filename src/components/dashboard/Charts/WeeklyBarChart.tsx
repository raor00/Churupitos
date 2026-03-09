"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const data = [
    { name: "Mon", spent: 400 },
    { name: "Tue", spent: 300 },
    { name: "Wed", spent: 550 },
    { name: "Thu", spent: 200 },
    { name: "Fri", spent: 700 },
    { name: "Sat", spent: 150 },
    { name: "Sun", spent: 100 },
];

export function WeeklyBarChart() {
    return (
        <div className="h-64 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#666", fontSize: 10, fontFamily: "monospace" }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#666", fontSize: 10, fontFamily: "monospace" }}
                    />
                    <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.05)" }}
                        contentStyle={{
                            backgroundColor: "rgba(255,255,255,0.9)",
                            border: "1px solid rgba(0,0,0,0.1)",
                            borderRadius: "8px",
                            fontFamily: "monospace",
                            fontSize: "12px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                        }}
                        itemStyle={{ color: "#111", fontWeight: "bold" }}
                    />
                    <Bar dataKey="spent" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 4 ? "#111" : "#e0e0e0"} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
