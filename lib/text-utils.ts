/**
 * Utility to clean HTML and decode entities for better display.
 */
export function cleanHtml(html: string | null | undefined): string {
    if (!html) return "";

    // 1. Basic tagging stripping (regex is safe for SSR/Client)
    let text = html.replace(/<[^>]*>/g, " ");

    // 2. Decode entities (Common hex entities from AN data)
    // Example: &#x00C0; -> À
    text = text.replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => {
        try {
            return String.fromCharCode(parseInt(hex, 16));
        } catch (e) {
            return "";
        }
    });

    // 3. Decimal entities &#160; -> Space
    text = text.replace(/&#([0-9]+);/g, (_, dec) => {
        try {
            return String.fromCharCode(parseInt(dec, 10));
        } catch (e) {
            return "";
        }
    });

    // 4. Named entities (Common ones)
    const entities: Record<string, string> = {
        "&nbsp;": " ",
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&apos;": "'",
        "&laquo;": "«",
        "&raquo;": "»",
        "&copy;": "©",
        "&reg;": "®"
    };

    Object.entries(entities).forEach(([entity, char]) => {
        text = text.replaceAll(entity, char);
    });

    // 5. Cleanup whitespace
    return text.replace(/\s+/g, " ").trim();
}
