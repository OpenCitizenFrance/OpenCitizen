"use client";

import { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Official hemicycle order from left to right (viewing from speaker's position)
const HEMICYCLE_ORDER: Record<string, number> = {
    'LFI-NFP': 1,
    'GDR': 2,
    'SOC': 3,
    'EcoS': 4,
    'LIOT': 5,
    'Dem': 6,
    'HOR': 7,
    'EPR': 8,
    'DR': 9,
    'UDR': 10,
    'RN': 11,
    'NI': 12,
};

interface GroupData {
    uid: string;
    name: string;
    acronym: string | null;
    colorCode: string | null;
    memberCount: number;
    logoUrl?: string | null;
}

interface Hemicycle3DProps {
    groups: GroupData[];
    selectedGroupId?: string | null;
}

// Individual arc segment component
function ArcSegment({
    startAngle,
    endAngle,
    innerRadius,
    outerRadius,
    height,
    color,
    groupId,
    acronym,
    memberCount,
    isHovered,
    onHover,
    onUnhover,
}: {
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
    height: number;
    color: string;
    groupId: string;
    acronym: string;
    memberCount: number;
    isHovered: boolean;
    onHover: () => void;
    onUnhover: () => void;
}) {
    const router = useRouter();
    const meshRef = useRef<THREE.Mesh>(null);

    // Create the arc geometry
    const geometry = useMemo(() => {
        const shape = new THREE.Shape();
        const segments = 32;

        // Start at inner radius
        const innerStartX = Math.cos(startAngle) * innerRadius;
        const innerStartZ = Math.sin(startAngle) * innerRadius;
        shape.moveTo(innerStartX, innerStartZ);

        // Draw outer arc
        for (let i = 0; i <= segments; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / segments);
            const x = Math.cos(angle) * outerRadius;
            const z = Math.sin(angle) * outerRadius;
            if (i === 0) {
                shape.lineTo(x, z);
            } else {
                shape.lineTo(x, z);
            }
        }

        // Draw inner arc (reverse)
        for (let i = segments; i >= 0; i--) {
            const angle = startAngle + (endAngle - startAngle) * (i / segments);
            const x = Math.cos(angle) * innerRadius;
            const z = Math.sin(angle) * innerRadius;
            shape.lineTo(x, z);
        }

        shape.closePath();

        const extrudeSettings = {
            depth: height,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 2,
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, [startAngle, endAngle, innerRadius, outerRadius, height]);

    // Calculate label position
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = (innerRadius + outerRadius) / 2;
    const labelX = Math.cos(midAngle) * labelRadius;
    const labelZ = Math.sin(midAngle) * labelRadius;

    // Animate hover
    useFrame(() => {
        if (meshRef.current) {
            const targetY = isHovered ? 0.15 : 0;
            meshRef.current.position.y += (targetY - meshRef.current.position.y) * 0.1;
        }
    });

    return (
        <group>
            <mesh
                ref={meshRef}
                geometry={geometry}
                rotation={[-Math.PI / 2, 0, 0]}
                onClick={() => router.push(`/groupes/${groupId}`)}
                onPointerOver={onHover}
                onPointerOut={onUnhover}
            >
                <meshStandardMaterial
                    color={color}
                    metalness={0.3}
                    roughness={0.4}
                    emissive={isHovered ? color : '#000000'}
                    emissiveIntensity={isHovered ? 0.3 : 0}
                />
            </mesh>

            {/* Label on top of segment */}
            {(endAngle - startAngle) > 0.15 && (
                <Html
                    position={[labelX, height + 0.1, labelZ]}
                    center
                    style={{
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <div className={`text-center transition-all ${isHovered ? 'scale-110' : ''}`}>
                        <div className="text-xs font-bold text-white drop-shadow-lg bg-black/50 px-1.5 py-0.5 rounded">
                            {acronym}
                        </div>
                        <div className="text-[10px] text-white/80 drop-shadow">
                            {memberCount}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

// The hemicycle scene
function HemicycleScene({ groups, selectedGroupId }: { groups: GroupData[], selectedGroupId?: string | null }) {
    const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

    // Sort and calculate arc positions
    const groupArcs = useMemo(() => {
        const politicalGroups = groups.filter(g => g.memberCount > 0);

        const sorted = [...politicalGroups].sort((a, b) => {
            const orderA = HEMICYCLE_ORDER[a.acronym || ''] || 50;
            const orderB = HEMICYCLE_ORDER[b.acronym || ''] || 50;
            return orderA - orderB;
        });

        const totalSeats = sorted.reduce((sum, g) => sum + g.memberCount, 0);

        // Full 180 degrees (PI radians) - from left to right
        let currentAngle = Math.PI; // Start from left (180°)

        return sorted.map(group => {
            const proportion = group.memberCount / totalSeats;
            const arcAngle = proportion * Math.PI; // 180 degrees total
            const startAngle = currentAngle;
            currentAngle -= arcAngle; // Move right (decreasing angle)

            return {
                ...group,
                startAngle: currentAngle, // End becomes start (reverse for correct winding)
                endAngle: startAngle,
            };
        });
    }, [groups]);

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={0.3} />
            <pointLight position={[0, 5, 0]} intensity={0.5} />

            {/* Hemicycle base/floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
                <ringGeometry args={[0.3, 2.2, 64]} />
                <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} />
            </mesh>

            {/* Arc segments */}
            {groupArcs.map((group) => (
                <ArcSegment
                    key={group.uid}
                    startAngle={group.startAngle}
                    endAngle={group.endAngle}
                    innerRadius={0.8}
                    outerRadius={2}
                    height={0.25}
                    color={group.colorCode || '#888888'}
                    groupId={group.uid}
                    acronym={group.acronym || group.name.substring(0, 3)}
                    memberCount={group.memberCount}
                    isHovered={hoveredGroup === group.uid}
                    onHover={() => setHoveredGroup(group.uid)}
                    onUnhover={() => setHoveredGroup(null)}
                />
            ))}

            {/* Speaker podium (center) */}
            <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.25, 0.3, 0.1, 32]} />
                <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.2} />
            </mesh>

            {/* Podium label */}
            <Html position={[0, 0.15, 0]} center>
                <div className="text-[10px] font-semibold text-blue-400 whitespace-nowrap">
                    ASSEMBLÉE
                </div>
            </Html>

            {/* Camera controls */}
            <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={2.5}
                maxDistance={6}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 2.2}
                autoRotate={false}
            />
        </>
    );
}

export function Hemicycle3D({ groups, selectedGroupId }: Hemicycle3DProps) {
    // Sort groups for legend
    const sortedGroups = useMemo(() => {
        return [...groups]
            .filter(g => g.memberCount > 0)
            .sort((a, b) => {
                const orderA = HEMICYCLE_ORDER[a.acronym || ''] || 50;
                const orderB = HEMICYCLE_ORDER[b.acronym || ''] || 50;
                return orderA - orderB;
            });
    }, [groups]);

    return (
        <div className="relative w-full">
            {/* 3D Canvas */}
            <div className="w-full h-[350px] rounded-xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800">
                <Canvas
                    camera={{ position: [0, 3, 3.5], fov: 50 }}
                    shadows
                >
                    <Suspense fallback={null}>
                        <HemicycleScene groups={groups} selectedGroupId={selectedGroupId} />
                    </Suspense>
                </Canvas>
            </div>

            {/* Instruction */}
            <p className="text-center text-xs text-muted-foreground mt-2">
                Cliquez sur un groupe pour accéder à sa page • Faites glisser pour pivoter
            </p>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-3 px-4">
                {sortedGroups.map(group => (
                    <Link
                        key={group.uid}
                        href={`/groupes/${group.uid}`}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs hover:bg-muted/50 transition-colors"
                    >
                        <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: group.colorCode || '#888' }}
                        />
                        <span className="font-medium">{group.acronym}</span>
                        <span className="text-muted-foreground">({group.memberCount})</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default Hemicycle3D;
