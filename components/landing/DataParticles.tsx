"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface DataParticlesProps {
    count?: number;
}

export function DataParticles({ count = 400 }: DataParticlesProps) {
    const pointsRef = useRef<THREE.Points>(null);
    const velocitiesRef = useRef<Float32Array | null>(null);

    const { positions, colors, sizes, velocities } = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const velocities = new Float32Array(count * 3);

        // Color palette based on vote types
        const colorPalette = [
            new THREE.Color("#4f46e5"), // Primary blue - textes
            new THREE.Color("#6366f1"), // Lighter blue
            new THREE.Color("#818cf8"), // Even lighter
            new THREE.Color("#a855f7"), // Accent purple - votes
            new THREE.Color("#c084fc"), // Lighter purple
            new THREE.Color("#22c55e"), // Green - pour
            new THREE.Color("#ef4444"), // Red - contre
            new THREE.Color("#eab308"), // Yellow - abstention
        ];

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Random spherical distribution around the hemicycle
            const radius = 8 + Math.random() * 8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.6 + Math.PI * 0.2;

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.cos(phi) + 2;
            positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

            // Random color from palette
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            // Variable sizes
            sizes[i] = Math.random() * 0.15 + 0.05;

            // Orbital velocities
            const speed = 0.2 + Math.random() * 0.3;
            velocities[i3] = (Math.random() - 0.5) * speed;
            velocities[i3 + 1] = (Math.random() - 0.5) * speed * 0.3;
            velocities[i3 + 2] = (Math.random() - 0.5) * speed;
        }

        return { positions, colors, sizes, velocities };
    }, [count]);

    // Store velocities ref
    velocitiesRef.current = velocities;

    useFrame((state, delta) => {
        if (pointsRef.current && velocitiesRef.current) {
            const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;

                // Get current position
                const x = positions[i3];
                const y = positions[i3 + 1];
                const z = positions[i3 + 2];

                // Calculate distance from center
                const dist = Math.sqrt(x * x + z * z);

                // Orbital motion around Y axis
                const angle = Math.atan2(z, x);
                const orbitSpeed = velocitiesRef.current[i3] * delta;
                const newAngle = angle + orbitSpeed;

                positions[i3] = Math.cos(newAngle) * dist;
                positions[i3 + 2] = Math.sin(newAngle) * dist;

                // Slight vertical oscillation
                positions[i3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.002;

                // Slowly drift inward/outward
                const driftFactor = 1 + Math.sin(state.clock.elapsedTime * 0.5 + i * 0.1) * 0.01;
                positions[i3] *= driftFactor;
                positions[i3 + 2] *= driftFactor;

                // Respawn if too far or too close
                const newDist = Math.sqrt(positions[i3] ** 2 + positions[i3 + 2] ** 2);
                if (newDist < 6 || newDist > 20) {
                    const radius = 8 + Math.random() * 8;
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI * 0.6 + Math.PI * 0.2;
                    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
                    positions[i3 + 1] = radius * Math.cos(phi) + 2;
                    positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
                }
            }

            pointsRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                    count={count}
                />
                <bufferAttribute
                    attach="attributes-color"
                    args={[colors, 3]}
                    count={count}
                />
                <bufferAttribute
                    attach="attributes-size"
                    args={[sizes, 1]}
                    count={count}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.15}
                vertexColors
                transparent
                opacity={0.8}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                sizeAttenuation
            />
        </points>
    );
}
