"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Connection {
    start: THREE.Vector3;
    end: THREE.Vector3;
    phase: number;
}

function ConnectionLine({ start, end, phase }: { start: THREE.Vector3; end: THREE.Vector3; phase: number }) {
    const lineRef = useRef<THREE.Line>(null);
    const materialRef = useRef<THREE.LineBasicMaterial>(null);

    const geometry = useMemo(() => {
        const points = [];
        const numSegments = 20;

        // Create curved path using quadratic bezier
        const midPoint = new THREE.Vector3()
            .addVectors(start, end)
            .multiplyScalar(0.5);
        midPoint.y += 2; // Arc upward

        for (let t = 0; t <= 1; t += 1 / numSegments) {
            const p = new THREE.Vector3();
            // Quadratic bezier interpolation
            const t1 = 1 - t;
            p.x = t1 * t1 * start.x + 2 * t1 * t * midPoint.x + t * t * end.x;
            p.y = t1 * t1 * start.y + 2 * t1 * t * midPoint.y + t * t * end.y;
            p.z = t1 * t1 * start.z + 2 * t1 * t * midPoint.z + t * t * end.z;
            points.push(p);
        }

        return new THREE.BufferGeometry().setFromPoints(points);
    }, [start, end]);

    useFrame((state) => {
        if (materialRef.current) {
            const t = state.clock.elapsedTime + phase;
            materialRef.current.opacity = (Math.sin(t * 0.8) * 0.5 + 0.5) * 0.4;
        }
    });

    return (
        <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
            color: "#818cf8",
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
        }))} ref={lineRef} />
    );
}

export function NeuralConnections() {
    const groupRef = useRef<THREE.Group>(null);

    const connections = useMemo(() => {
        const conns: Connection[] = [];
        const numConnections = 50;

        for (let i = 0; i < numConnections; i++) {
            // Random start and end points in a hemisphere around the scene
            const radius1 = 6 + Math.random() * 6;
            const theta1 = Math.random() * Math.PI * 2;
            const phi1 = Math.random() * Math.PI * 0.5;

            const radius2 = 6 + Math.random() * 6;
            const theta2 = Math.random() * Math.PI * 2;
            const phi2 = Math.random() * Math.PI * 0.5;

            conns.push({
                start: new THREE.Vector3(
                    radius1 * Math.sin(phi1) * Math.cos(theta1),
                    radius1 * Math.cos(phi1) + 1,
                    radius1 * Math.sin(phi1) * Math.sin(theta1)
                ),
                end: new THREE.Vector3(
                    radius2 * Math.sin(phi2) * Math.cos(theta2),
                    radius2 * Math.cos(phi2) + 1,
                    radius2 * Math.sin(phi2) * Math.sin(theta2)
                ),
                phase: Math.random() * Math.PI * 2,
            });
        }

        return conns;
    }, []);

    useFrame((state) => {
        // Rotate the whole group slowly
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            {connections.map((conn, index) => (
                <ConnectionLine key={index} start={conn.start} end={conn.end} phase={conn.phase} />
            ))}
        </group>
    );
}
