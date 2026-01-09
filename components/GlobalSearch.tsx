"use client"

import * as React from "react"
import { Search, FileText, Send, User, ChevronRight, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { cleanHtml } from "@/lib/text-utils"

export function GlobalSearch() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<{ dossiers: any[]; amendments: any[] }>({ dossiers: [], amendments: [] })
    const [isLoading, setIsLoading] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    React.useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 2) {
                setResults({ dossiers: [], amendments: [] })
                return
            }

            setIsLoading(true)
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
                const data = await res.json()
                setResults(data)
            } catch (error) {
                console.error("Search error:", error)
            } finally {
                setIsLoading(false)
            }
        }

        const timer = setTimeout(fetchResults, 300)
        return () => clearTimeout(timer)
    }, [query])

    const onSelect = (path: string) => {
        setOpen(false)
        setQuery("")
        router.push(path)
    }

    return (
        <>
            <div
                onClick={() => setOpen(true)}
                className="relative w-full max-w-sm group cursor-pointer"
            >
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="flex items-center h-9 w-full rounded-md border border-input bg-transparent px-8 py-1 text-sm shadow-sm transition-colors text-muted-foreground">
                    Rechercher un dossier, un amendement...
                    <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input
                            placeholder="Rechercher..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none focus-visible:ring-0"
                            autoFocus
                        />
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
                    </div>

                    <ScrollArea className="max-h-[60vh]">
                        <div className="p-2">
                            {!query && (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    Entrez au moins 2 caractères pour commencer la recherche.
                                </div>
                            )}

                            {query && !isLoading && results.dossiers.length === 0 && results.amendments.length === 0 && (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    Aucun résultat trouvé pour "{query}".
                                </div>
                            )}

                            {results.dossiers.length > 0 && (
                                <div className="mb-4">
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Dossiers Législatifs
                                    </div>
                                    {results.dossiers.map((dossier) => (
                                        <button
                                            key={dossier.uid}
                                            onClick={() => onSelect(`/dossiers/${dossier.uid}`)}
                                            className="w-full flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-accent text-left group transition-all"
                                        >
                                            <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                                <FileText className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <Badge variant="outline" className="text-[10px] h-4 px-1 leading-none uppercase">
                                                        {dossier.type.replace('_', ' ')}
                                                    </Badge>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{dossier.uid}</span>
                                                </div>
                                                <div className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                                                    {cleanHtml(dossier.title)}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.amendments.length > 0 && (
                                <div>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Amendements
                                    </div>
                                    {results.amendments.map((amdt) => (
                                        <button
                                            key={amdt.uid}
                                            onClick={() => onSelect(`/amendements/${amdt.uid}`)}
                                            className="w-full flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-accent text-left group transition-all"
                                        >
                                            <div className="h-9 w-9 rounded-md bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/40 transition-colors">
                                                <Send className="h-5 w-5 text-orange-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[10px] font-mono text-muted-foreground">{amdt.uid}</span>
                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1 leading-none">
                                                        {amdt.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm font-medium line-clamp-1 group-hover:text-orange-600 transition-colors">
                                                    {cleanHtml(amdt.expose) || "Amendement"}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                                                    <User className="h-3 w-3" />
                                                    <span>{amdt.author.firstName} {amdt.author.lastName}</span>
                                                    <span className="mx-1">•</span>
                                                    <span className="truncate italic">{cleanHtml(amdt.law.title)}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="border-t p-3 bg-muted/30 flex items-center justify-between text-[10px] text-muted-foreground">
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="rounded border bg-background px-1">Esc</kbd> Fermer
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="rounded border bg-background px-1">↵</kbd> Sélectionner
                            </span>
                        </div>
                        <div>
                            {results.dossiers.length + results.amendments.length} résultats trouvés
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
