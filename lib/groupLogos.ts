/**
 * Mapping of political group acronyms to their logo URLs from Wikipedia
 */

export const GROUP_LOGOS: Record<string, string> = {
    // La France Insoumise - Nouveau Front Populaire
    'LFI-NFP': 'https://upload.wikimedia.org/wikipedia/fr/7/75/Groupe_La_France_insoumise_Logo.png',

    // Gauche Démocrate et Républicaine
    'GDR': 'https://upload.wikimedia.org/wikipedia/fr/e/e9/Logo_GDR.svg',

    // Socialistes et apparentés
    'SOC': 'https://upload.wikimedia.org/wikipedia/fr/3/34/Logotype_du_groupe_Socialistes_et_apparent%C3%A9s_%C3%A0_l%E2%80%99Assembl%C3%A9e_nationale.png',

    // Écologiste et Social
    'EcoS': 'https://upload.wikimedia.org/wikipedia/fr/5/57/Logo_groupe_Ecologiste_et_Social_2024.png',

    // Libertés, Indépendants, Outre-mer et Territoires
    'LIOT': 'https://upload.wikimedia.org/wikipedia/fr/2/26/Logo_Libert%C3%A9s_%26_Territoires.png',

    // Démocrates (MoDem)
    'Dem': 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Logotype_du_groupe_Mouvement_d%C3%A9mocrate_et_d%C3%A9mocrates_apparent%C3%A9s.png',

    // Horizons
    'HOR': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Horizons_Group.png',

    // Ensemble pour la République (ex-Renaissance)
    'EPR': 'https://upload.wikimedia.org/wikipedia/commons/7/75/Groupe_EPR.png',

    // Droite Républicaine (ex-LR)
    'DR': 'https://upload.wikimedia.org/wikipedia/fr/b/bb/Groupe_Les_R%C3%A9publicains_An.png',

    // Union des Droites pour la République
    'UDR': 'https://upload.wikimedia.org/wikipedia/fr/a/aa/Logo_udr_2024.jpg',

    // Rassemblement National
    'RN': 'https://upload.wikimedia.org/wikipedia/fr/9/90/Groupe_Rassemblement_national.png',
};

/**
 * Get the logo URL for a political group by its acronym
 * @param acronym The group's acronym (e.g., 'RN', 'LFI-NFP')
 * @returns The logo URL or undefined if not found
 */
export function getGroupLogoUrl(acronym: string | null | undefined): string | undefined {
    if (!acronym) return undefined;
    return GROUP_LOGOS[acronym];
}
