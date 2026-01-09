"use client";

import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";
import Link from "next/link";

interface LegislativeText {
    uid: string;
    title: string | null;
    numTexte: string | null;
    expose: string | null;
    articles: any; // Json
    fullContent: string | null;
}

interface TextPreviewButtonProps {
    text: LegislativeText;
}

/**
 * Generates the URL to view a legislative text on the AN website
 * Pattern: https://www.assemblee-nationale.fr/dyn/opendata/{UID}.html
 */
function getTextUrl(uid: string): string {
    return `https://www.assemblee-nationale.fr/dyn/opendata/${uid}.html`;
}

export function TextPreviewButton({ text }: TextPreviewButtonProps) {
    const externalUrl = getTextUrl(text.uid);

    return (
        <Link href={externalUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="h-8 text-xs group gap-2">
                <FileText className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                Voir le texte n°{text.numTexte}
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </Button>
        </Link>
    );
}
