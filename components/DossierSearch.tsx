"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, X, FileText, Loader2 } from "lucide-react";

interface Dossier {
    uid: string;
    title: string;
    type: string;
    status: string;
}

interface DossierSearchProps {
    selectedDossiers: Dossier[];
    onSelect: (dossier: Dossier) => void;
    onRemove: (uid: string) => void;
}

const typeLabels: Record<string, string> = {
    PROJET_LOI: "Projet de loi",
    PROJET_LOI_FIN: "PLF",
    PROJET_LOI_ORG: "PLO",
    PROPOSITION_LOI: "PPL"
};

export function DossierSearch({ selectedDossiers, onSelect, onRemove }: DossierSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Dossier[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/dossiers/search?q=${encodeURIComponent(query)}&limit=8`);
                if (res.ok) {
                    const data = await res.json();
                    // Filter out already selected dossiers
                    const filtered = data.filter(
                        (d: Dossier) => !selectedDossiers.some(s => s.uid === d.uid)
                    );
                    setResults(filtered);
                    setShowDropdown(true);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, selectedDossiers]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (dossier: Dossier) => {
        onSelect(dossier);
        setQuery("");
        setShowDropdown(false);
    };

    return (
        <div className="space-y-3">
            <Label>Dossiers législatifs ciblés (optionnel)</Label>

            {/* Selected Dossiers */}
            {selectedDossiers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedDossiers.map((dossier) => (
                        <Badge
                            key={dossier.uid}
                            variant="secondary"
                            className="gap-1.5 pr-1.5 py-1.5 text-xs max-w-[300px]"
                        >
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate">{dossier.title}</span>
                            <button
                                type="button"
                                onClick={() => onRemove(dossier.uid)}
                                className="ml-1 p-0.5 hover:bg-background/50 rounded transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Search Input */}
            <div ref={containerRef} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un dossier législatif..."
                    className="pl-10 h-11 bg-background"
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                )}

                {/* Dropdown */}
                {showDropdown && results.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-64 overflow-auto">
                        {results.map((dossier) => (
                            <button
                                key={dossier.uid}
                                type="button"
                                onClick={() => handleSelect(dossier)}
                                className="w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b last:border-0 flex items-start gap-2"
                            >
                                <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium line-clamp-2">
                                        {dossier.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {typeLabels[dossier.type] || dossier.type}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* No results message */}
                {showDropdown && results.length === 0 && !isLoading && query.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
                        Aucun dossier trouvé pour "{query}"
                    </div>
                )}
            </div>

            <p className="text-xs text-muted-foreground">
                Liez votre cause à des projets ou propositions de loi existants
            </p>
        </div>
    );
}
