"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SeatProps {
    position: [number, number, number];
    color: string;
    delay: number;
}

function Seat({ position, color, delay }: SeatProps) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            // Subtle breathing animation
            const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.05;
            meshRef.current.scale.setScalar(scale);
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.3}
                roughness={0.3}
                metalness={0.7}
                transparent
                opacity={0.9}
            />
        </mesh>
    );
}

function PlatformBase() {
    return (
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0, 7, 64, 1, 0, Math.PI]} />
            <meshStandardMaterial
                color="#1e1b4b"
                transparent
                opacity={0.6}
                roughness={0.8}
                metalness={0.2}
            />
        </mesh>
    );
}

function TribuneDesk() {
    return (
        <group position={[0, 0, 5.5]}>
            {/* Main desk */}
            <mesh position={[0, 0.3, 0]}>
                <boxGeometry args={[2.5, 0.6, 0.8]} />
                <meshStandardMaterial
                    color="#312e81"
                    emissive="#4f46e5"
                    emissiveIntensity={0.2}
                    roughness={0.4}
                    metalness={0.6}
                />
            </mesh>
            {/* Lectern glow */}
            <pointLight position={[0, 1, 0]} intensity={0.5} color="#818cf8" distance={3} />
        </group>
    );
}

export function AssemblyHemicycle() {
    const groupRef = useRef<THREE.Group>(null);

    // Generate seat positions in hemicycle formation
    const seats = useMemo(() => {
        const seatList: { position: [number, number, number]; color: string; delay: number }[] = [];
        const rows = 6;
        const seatsPerRow = [25, 35, 45, 55, 65, 75]; // Increasing seats per row

        // Create color gradient from blue to purple
        const colorStart = new THREE.Color("#4f46e5"); // Primary blue
        const colorEnd = new THREE.Color("#a855f7");   // Accent purple

        for (let row = 0; row < rows; row++) {
            const radius = 2.5 + row * 1;
            const numSeats = seatsPerRow[row];
            const angleSpan = Math.PI * 0.85; // Slightly less than 180 degrees
            const startAngle = (Math.PI - angleSpan) / 2;

            for (let i = 0; i < numSeats; i++) {
                const angle = startAngle + (i / (numSeats - 1)) * angleSpan;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                const y = row * 0.25; // Slight elevation for each row

                // Color interpolation based on position
                const t = (i / numSeats + row / rows) / 2;
                const color = colorStart.clone().lerp(colorEnd, t);

                seatList.push({
                    position: [x, y, z],
                    color: `#${color.getHexString()}`,
                    delay: row * 0.5 + i * 0.1,
                });
            }
        }

        return seatList;
    }, []);

    useFrame((state) => {
        if (groupRef.current) {
            // Gentle floating motion
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            <PlatformBase />
            <TribuneDesk />
            {seats.map((seat, index) => (
                <Seat key={index} {...seat} />
            ))}
        </group>
    );
}
