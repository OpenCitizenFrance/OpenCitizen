"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import { AssemblyHemicycle } from "./AssemblyHemicycle";
import { DataParticles } from "./DataParticles";
import { NeuralConnections } from "./NeuralConnections";

function SceneContent() {
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 8, 16]} fov={50} />
            <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.3}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 2}
            />

            {/* Background stars for depth */}
            <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />

            {/* Lighting - enhanced for visual impact without post-processing */}
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={2} color="#6366f1" />
            <pointLight position={[-10, 5, -10]} intensity={1.5} color="#a855f7" />
            <pointLight position={[0, -5, 5]} intensity={0.8} color="#818cf8" />
            <spotLight
                position={[0, 20, 0]}
                angle={0.5}
                penumbra={1}
                intensity={1.2}
                color="#ffffff"
            />

            {/* Fog for depth effect */}
            <fog attach="fog" args={["#0c0a1d", 15, 40]} />

            {/* 3D Components */}
            <AssemblyHemicycle />
            <DataParticles count={400} />
            <NeuralConnections />
        </>
    );
}

export function AssemblyScene() {
    return (
        <div className="absolute inset-0 w-full h-full">
            <Canvas
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: "high-performance",
                }}
                dpr={[1, 2]}
                style={{ background: "transparent" }}
            >
                <Suspense fallback={null}>
                    <SceneContent />
                </Suspense>
            </Canvas>
        </div>
    );
}
