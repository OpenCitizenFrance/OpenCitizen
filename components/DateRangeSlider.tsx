"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { Slider } from "@/components/ui/slider";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface DateRangeSliderProps {
    minDate: Date;
    maxDate: Date;
    currentMin?: Date;
    currentMax?: Date;
    baseUrl: string;
    /** Prefix for URL params - e.g. "creation" gives creationFrom/creationTo */
    paramPrefix?: string;
}

export function DateRangeSlider({
    minDate,
    maxDate,
    currentMin,
    currentMax,
    baseUrl,
    paramPrefix = "date"
}: DateRangeSliderProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // URL param names based on prefix
    const fromParam = `${paramPrefix}From`;
    const toParam = `${paramPrefix}To`;

    // Convert dates to numeric values for slider (days since minDate)
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    const dateToSliderValue = (date: Date): number => {
        const days = Math.ceil((date.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(0, Math.min(days, totalDays));
    };

    const sliderValueToDate = (value: number): Date => {
        const date = new Date(minDate);
        date.setDate(date.getDate() + value);
        return date;
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateISO = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    // Initialize slider values from URL params or defaults
    const initialMin = currentMin ? dateToSliderValue(currentMin) : 0;
    const initialMax = currentMax ? dateToSliderValue(currentMax) : totalDays;

    const [values, setValues] = useState<[number, number]>([initialMin, initialMax]);

    // Update values when URL params change
    useEffect(() => {
        const newMin = currentMin ? dateToSliderValue(currentMin) : 0;
        const newMax = currentMax ? dateToSliderValue(currentMax) : totalDays;
        setValues([newMin, newMax]);
    }, [currentMin?.getTime(), currentMax?.getTime(), totalDays]);

    const handleValueChange = useCallback((newValues: number[]) => {
        setValues([newValues[0], newValues[1]]);
    }, []);

    const handleValueCommit = useCallback((newValues: number[]) => {
        const startDate = sliderValueToDate(newValues[0]);
        const endDate = sliderValueToDate(newValues[1]);

        // Build new URL with updated date params
        const params = new URLSearchParams(searchParams.toString());

        // Only set param if it's not the minimum
        if (newValues[0] > 0) {
            params.set(fromParam, formatDateISO(startDate));
        } else {
            params.delete(fromParam);
        }

        // Only set param if it's not the maximum
        if (newValues[1] < totalDays) {
            params.set(toParam, formatDateISO(endDate));
        } else {
            params.delete(toParam);
        }

        // Reset to page 1 when filter changes
        params.set('page', '1');

        // Use startTransition to show loading state
        startTransition(() => {
            router.push(`${baseUrl}?${params.toString()}`);
        });
    }, [router, searchParams, baseUrl, totalDays, minDate, fromParam, toParam]);

    const startDate = sliderValueToDate(values[0]);
    const endDate = sliderValueToDate(values[1]);

    // Check if we're filtering (not at extremes)
    const isFiltering = values[0] > 0 || values[1] < totalDays;

    const handleReset = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(fromParam);
        params.delete(toParam);
        params.set('page', '1');
        startTransition(() => {
            router.push(`${baseUrl}?${params.toString()}`);
        });
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(minDate)}</span>
                <span>{formatDate(maxDate)}</span>
            </div>

            <Slider
                value={values}
                onValueChange={handleValueChange}
                onValueCommit={handleValueCommit}
                max={totalDays}
                min={0}
                step={1}
                className="cursor-pointer"
            />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                    {isPending && (
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    )}
                    <span className={`font-medium ${isPending ? 'text-muted-foreground' : 'text-primary'}`}>
                        {formatDate(startDate)}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className={`font-medium ${isPending ? 'text-muted-foreground' : 'text-primary'}`}>
                        {formatDate(endDate)}
                    </span>
                </div>

                {isFiltering && (
                    <button
                        onClick={handleReset}
                        disabled={isPending}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                        Réinitialiser
                    </button>
                )}
            </div>
        </div>
    );
}
