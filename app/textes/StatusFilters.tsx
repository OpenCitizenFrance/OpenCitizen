"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface StatusFiltersProps {
    currentStatus: string | undefined;
}

const statusConfig = [
    { value: null, label: "Tous les statuts", color: null },
    { value: "EN_COURS", label: "En cours", color: "bg-blue-500" },
    { value: "PROMULGUE", label: "Promulgué", color: "bg-purple-500" },
    { value: "REJETE", label: "Rejeté", color: "bg-red-500" },
];

export function StatusFilters({ currentStatus }: StatusFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handleStatusChange = (status: string | null) => {
        const params = new URLSearchParams(searchParams.toString());

        if (status === null) {
            params.delete("status");
        } else {
            params.set("status", status);
        }

        // Reset to page 1 when changing filters
        params.set("page", "1");

        startTransition(() => {
            router.push(`/textes?${params.toString()}`);
        });
    };

    return (
        <div className="flex gap-2 flex-wrap items-center">
            {statusConfig.map((config) => {
                const isActive = currentStatus === config.value ||
                    (config.value === null && !currentStatus);

                return (
                    <Button
                        key={config.value || "all"}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className="gap-2 rounded-full relative"
                        onClick={() => handleStatusChange(config.value)}
                        disabled={isPending}
                    >
                        {isPending && isActive && (
                            <Loader2 className="h-3 w-3 animate-spin absolute left-2" />
                        )}
                        {config.color && (
                            <div className={`w-2 h-2 rounded-full ${config.color}`} />
                        )}
                        <span className={isPending && isActive ? "opacity-50" : ""}>
                            {config.label}
                        </span>
                    </Button>
                );
            })}

            {isPending && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Chargement...
                </span>
            )}
        </div>
    );
}
