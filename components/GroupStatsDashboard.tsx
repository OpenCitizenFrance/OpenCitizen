"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts';
import { GroupStats } from "@/lib/groups-stats";

interface Props {
    data: GroupStats[];
}

export function GroupStatsDashboard({ data }: Props) {
    // Top 5 by adoption rate
    const topByAdoption = [...data].sort((a, b) => b.adoptionRate - a.adoptionRate);

    // Top 5 by activity (amendments per member)
    const topByActivity = [...data].sort((a, b) => b.activityScore - a.activityScore).slice(0, 8);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const group = payload[0].payload;
            return (
                <div className="bg-background/95 backdrop-blur border rounded-lg p-3 shadow-xl">
                    <p className="font-bold text-sm mb-1">{group.acronym || group.groupName}</p>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Adoption:</span>
                            <span className="font-mono text-green-500 font-semibold">{group.adoptionRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-mono">{group.totalAmendments}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Membres:</span>
                            <span className="font-mono">{group.memberCount}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Adoption Rates */}
                <Card className="glass-morphism overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="text-lg">Taux d'adoption des amendements</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topByAdoption} layout="vertical" margin={{ left: -10, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2} />
                                <XAxis type="number" unit="%" domain={[0, 100]} stroke="#888888" fontSize={12} />
                                <YAxis
                                    dataKey="acronym"
                                    type="category"
                                    stroke="#888888"
                                    fontSize={10}
                                    width={70}
                                    tickFormatter={(val) => val || 'NC'}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
                                <Bar dataKey="adoptionRate" radius={[0, 4, 4, 0]} barSize={24}>
                                    {topByAdoption.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.colorCode || 'hsl(var(--primary))'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Activity Score (Amendments per Member) */}
                <Card className="glass-morphism overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="text-lg">Activité moyenne (Amendements/Député)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topByActivity} margin={{ bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                                <XAxis
                                    dataKey="acronym"
                                    stroke="#888888"
                                    fontSize={10}
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis stroke="#888888" fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="activityScore" radius={[4, 4, 0, 0]} barSize={24}>
                                    {topByActivity.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.colorCode || 'hsl(var(--primary))'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Comprehensive Table */}
            <Card className="glass-morphism">
                <CardHeader>
                    <CardTitle>Classement complet</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-y">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Groupe</th>
                                    <th className="px-6 py-4 font-medium text-right">Membres</th>
                                    <th className="px-6 py-4 font-medium text-right">Amendements</th>
                                    <th className="px-6 py-4 font-medium text-right text-green-600 dark:text-green-400">Adoptés</th>
                                    <th className="px-6 py-4 font-medium text-right">Taux</th>
                                    <th className="px-6 py-4 font-medium text-right">Efficacité</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {data.map((group) => (
                                    <tr key={group.groupId} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-1.5 h-8 rounded-full"
                                                    style={{ backgroundColor: group.colorCode || '#ccc' }}
                                                />
                                                <div>
                                                    <p className="font-bold">{group.acronym || '??'}</p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{group.groupName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono">{group.memberCount}</td>
                                        <td className="px-6 py-4 text-right font-mono">{group.totalAmendments}</td>
                                        <td className="px-6 py-4 text-right font-mono text-green-600 dark:text-green-400 font-bold">{group.adoptedCount}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500"
                                                        style={{ width: `${group.adoptionRate}%` }}
                                                    />
                                                </div>
                                                <span className="font-mono w-10">{group.adoptionRate.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                {group.activityScore.toFixed(2)} pts
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
