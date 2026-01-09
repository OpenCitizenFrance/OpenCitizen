"use server";

import { getDeputies, DeputyFilters } from "@/lib/deputies";

export async function loadMoreDeputies(filters: DeputyFilters) {
    const result = await getDeputies(filters);
    return result;
}
