"use client";

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { HemicycleSVG } from './HemicycleSVG';

interface GroupData {
    uid: string;
    name: string;
    acronym: string | null;
    colorCode: string | null;
    memberCount: number;
}

interface HemicycleFilterProps {
    groups: GroupData[];
}

export function HemicycleFilter({ groups }: HemicycleFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Get currently selected groups from URL (comma-separated)
    const selectedGroups = searchParams.get('groupe')?.split(',').filter(Boolean) || [];

    const handleGroupClick = useCallback((groupId: string) => {
        const params = new URLSearchParams(searchParams.toString());

        let newSelection: string[];
        if (selectedGroups.includes(groupId)) {
            // Remove from selection
            newSelection = selectedGroups.filter(id => id !== groupId);
        } else {
            // Add to selection
            newSelection = [...selectedGroups, groupId];
        }

        if (newSelection.length > 0) {
            params.set('groupe', newSelection.join(','));
        } else {
            params.delete('groupe');
        }

        // Reset to page 1 when filtering
        params.set('page', '1');

        router.push(`${pathname}?${params.toString()}`);
    }, [pathname, router, searchParams, selectedGroups]);

    return (
        <HemicycleSVG
            groups={groups}
            mode="filter"
            selectedGroups={selectedGroups}
            onGroupClick={handleGroupClick}
        />
    );
}

export default HemicycleFilter;
