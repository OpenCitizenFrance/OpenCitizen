"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, MotionValue } from "framer-motion";
import Link from "next/link";

// ========== FRAME CONFIGURATION ==========
// Adjust these values to match your image sequence
const FRAME_PREFIX = "/sequence/ezgif-frame-";  // Path prefix (relative to public folder)
const FRAME_EXTENSION = ".jpg";                  // File extension
const TOTAL_FRAMES = 180;                        // Total number of frames
const FRAME_PADDING = 3;                         // Zero-padding digits (001, 010, 100)
// ==========================================

// Background color that matches the image sequence
const SEQUENCE_BG_COLOR = "#D8D4CD";

interface TextOverlay {
    title: string;
    description: string;
    scrollStart: number;
    scrollEnd: number;
    isCTA?: boolean;
}

const textOverlays: TextOverlay[] = [
    {
        title: "OpenCitizen.",
        description: "La Démocratie dans votre poche.",
        scrollStart: 0,
        scrollEnd: 0.2,
    },
    {
        title: "Comprenez l'Assemblée.",
        description: "Suivez les textes de loi et les amendements en temps réel.",
        scrollStart: 0.2,
        scrollEnd: 0.4,
    },
    {
        title: "Analysez vos Députés.",
        description: "Accédez à leurs votes et leur activité en toute transparence.",
        scrollStart: 0.4,
        scrollEnd: 0.6,
    },
    {
        title: "Pesez sur le débat.",
        description: "Créez ou rejoignez des causes citoyennes qui comptent.",
        scrollStart: 0.6,
        scrollEnd: 0.8,
    },
    {
        title: "Reprenez le pouvoir.",
        description: "",
        scrollStart: 0.8,
        scrollEnd: 1.0,
        isCTA: true,
    },
];

function getFramePath(frameIndex: number): string {
    const paddedIndex = String(frameIndex).padStart(FRAME_PADDING, "0");
    return `${FRAME_PREFIX}${paddedIndex}${FRAME_EXTENSION}`;
}

export function CitizenScroll() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);
    const [currentFrame, setCurrentFrame] = useState(1);
    const [isMounted, setIsMounted] = useState(false);
    const animationFrameRef = useRef<number>();

    // Track mount state for hydration safety
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Use scroll tracking - only track when mounted
    const { scrollYProgress } = useScroll({
        target: isMounted ? containerRef : undefined,
        offset: ["start start", "end end"],
    });

    const frameIndex = useTransform(scrollYProgress, [0, 1], [1, TOTAL_FRAMES]);

    // Preload all images
    useEffect(() => {
        const images: HTMLImageElement[] = [];
        let loadedCount = 0;

        const loadImage = (index: number): Promise<void> => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = getFramePath(index);
                img.onload = () => {
                    loadedCount++;
                    setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to load frame ${index}`);
                    loadedCount++;
                    setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
                    resolve();
                };
                images[index - 1] = img;
            });
        };

        const loadAllImages = async () => {
            const promises = [];
            for (let i = 1; i <= TOTAL_FRAMES; i++) {
                promises.push(loadImage(i));
            }
            await Promise.all(promises);
            imagesRef.current = images;
            setIsLoading(false);
        };

        loadAllImages();
    }, []);

    // Draw frame to canvas with proper scaling
    const drawFrame = useCallback((frameNum: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        const images = imagesRef.current;

        if (!canvas || !ctx || images.length === 0) return;

        const frameIdx = Math.max(0, Math.min(frameNum - 1, images.length - 1));
        const img = images[frameIdx];

        if (!img || !img.complete) return;

        // Set canvas size to match window
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;

        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        ctx.scale(dpr, dpr);

        // Fill background with matching color
        ctx.fillStyle = SEQUENCE_BG_COLOR;
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        // Calculate aspect ratio preserving dimensions (object-fit: contain)
        const imgAspect = img.width / img.height;
        const canvasAspect = displayWidth / displayHeight;

        let drawWidth: number;
        let drawHeight: number;
        let drawX: number;
        let drawY: number;

        if (imgAspect > canvasAspect) {
            // Image is wider - fit to width
            drawWidth = displayWidth;
            drawHeight = displayWidth / imgAspect;
            drawX = 0;
            drawY = (displayHeight - drawHeight) / 2;
        } else {
            // Image is taller - fit to height
            drawHeight = displayHeight;
            drawWidth = displayHeight * imgAspect;
            drawX = (displayWidth - drawWidth) / 2;
            drawY = 0;
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }, []);

    // Update frame on scroll
    useMotionValueEvent(frameIndex, "change", (latest) => {
        const newFrame = Math.round(latest);
        if (newFrame !== currentFrame) {
            setCurrentFrame(newFrame);
        }
    });

    // Render frame with requestAnimationFrame
    useEffect(() => {
        if (isLoading) return;

        const render = () => {
            drawFrame(currentFrame);
            animationFrameRef.current = requestAnimationFrame(render);
        };

        animationFrameRef.current = requestAnimationFrame(render);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isLoading, currentFrame, drawFrame]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (!isLoading) {
                drawFrame(currentFrame);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [isLoading, currentFrame, drawFrame]);

    return (
        <div
            ref={containerRef}
            className="relative"
            style={{ height: "500vh" }}
        >
            {/* Sticky container - always rendered for scroll tracking */}
            <div className="sticky top-0 h-screen w-full overflow-hidden">
                {/* Loading screen overlay */}
                {isLoading && (
                    <div
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center"
                        style={{ backgroundColor: "#0A0A0A" }}
                    >
                        {/* Pulsing loader */}
                        <div className="relative mb-8">
                            <div className="w-24 h-24 rounded-full border-2 border-white/10" />
                            <div
                                className="absolute inset-0 w-24 h-24 rounded-full border-2 border-t-white/80 border-r-white/40 border-b-white/10 border-l-white/10 animate-spin"
                                style={{ animationDuration: "1.5s" }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white/80 text-sm font-medium tabular-nums">
                                    {loadProgress}%
                                </span>
                            </div>
                        </div>

                        {/* Loading text */}
                        <p className="text-white/60 text-sm tracking-widest uppercase">
                            Chargement de l'expérience
                        </p>

                        {/* Progress bar */}
                        <div className="mt-6 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 via-white to-red-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${loadProgress}%` }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                )}

                {/* Canvas - rendered behind loading screen */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full z-0"
                    style={{ backgroundColor: SEQUENCE_BG_COLOR }}
                />

                {/* Gradient overlay for text readability */}
                {!isLoading && (
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
                )}

                {/* Text overlays */}
                {!isLoading && textOverlays.map((overlay, index) => (
                    <TextOverlayComponent
                        key={index}
                        overlay={overlay}
                        scrollProgress={scrollYProgress}
                    />
                ))}
            </div>
        </div>
    );
}

interface TextOverlayProps {
    overlay: TextOverlay;
    scrollProgress: MotionValue<number>;
}

function TextOverlayComponent({ overlay, scrollProgress }: TextOverlayProps) {
    const opacityTransform = useTransform(
        scrollProgress,
        [
            Math.max(0, overlay.scrollStart - 0.02),
            overlay.scrollStart + 0.02,
            overlay.scrollEnd - 0.02,
            Math.min(1, overlay.scrollEnd + 0.02),
        ],
        [0, 1, 1, 0]
    );

    const yTransform = useTransform(
        scrollProgress,
        [
            Math.max(0, overlay.scrollStart - 0.02),
            overlay.scrollStart + 0.02,
            overlay.scrollEnd - 0.02,
            Math.min(1, overlay.scrollEnd + 0.02),
        ],
        [30, 0, 0, -30]
    );

    return (
        <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center pointer-events-none"
            style={{ opacity: opacityTransform, y: yTransform }}
        >
            {/* Title */}
            <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 md:mb-6 tracking-tight"
                style={{
                    textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                    letterSpacing: "-0.02em"
                }}
            >
                {overlay.title}
            </motion.h1>

            {/* Description or CTA */}
            {overlay.isCTA ? (
                <Link
                    href="/auth/signup"
                    className="pointer-events-auto mt-8"
                >
                    <motion.button
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 via-white to-red-600 text-gray-900 font-semibold text-lg rounded-full shadow-2xl hover:shadow-white/25 transition-shadow"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            background: "linear-gradient(135deg, #2563eb 0%, #ffffff 50%, #dc2626 100%)",
                        }}
                    >
                        Télécharger l'application
                    </motion.button>
                </Link>
            ) : (
                <motion.p
                    className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-2xl leading-relaxed"
                    style={{
                        textShadow: "0 1px 10px rgba(0,0,0,0.5)",
                        lineHeight: "1.6"
                    }}
                >
                    {overlay.description}
                </motion.p>
            )}
        </motion.div>
    );
}
