"use client";

import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

interface HemicycleProps {
    data: {
        id: string;
        name: string;
        group: string;
        color: string;
    }[];
}

export function Hemicycle({ data }: HemicycleProps) {
    // Generate hemicycle coordinates
    const chartData = useMemo(() => {
        // Group data by group for sorting, but here we just process linear for demo
        // In real app we need sophisticated algo to place them in rows
        // Simplified dummy placement for now:
        const rows = 10;
        const total = data.length;

        return data.map((d, i) => {
            // Very simple semi-circle approximation
            const angle = Math.PI * (i / (total - 1));
            const r = 10;
            return {
                ...d,
                x: Math.cos(angle) * r * -1, // Flip to match left-right
                y: Math.sin(angle) * r,
                z: 1
            };
        });
    }, [data]);

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <XAxis type="number" dataKey="x" name="x" hide />
                    <YAxis type="number" dataKey="y" name="y" hide />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                                <div className="bg-white p-2 border rounded shadow text-sm">
                                    <p className="font-bold">{d.name}</p>
                                    <p className="text-gray-500">{d.group}</p>
                                </div>
                            );
                        }
                        return null;
                    }} />
                    <Scatter name="Deputies" data={chartData} fill="#8884d8">
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
}
