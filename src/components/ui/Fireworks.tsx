"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface FireworksProps {
    isActive: boolean;
    onComplete?: () => void;
    duration?: number;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    speedX: number;
    speedY: number;
    life: number;
}

const COLORS = [
    "#22c55e", // green
    "#06b6d4", // cyan
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#ef4444", // red
];

function FireworksBurst({ x, y }: { x: number; y: number }) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const newParticles: Particle[] = [];
        const particleCount = 30 + Math.floor(Math.random() * 20);

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
            const speed = 2 + Math.random() * 4;
            newParticles.push({
                id: i,
                x: 0,
                y: 0,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: 3 + Math.random() * 3,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                life: 1,
            });
        }
        setParticles(newParticles);
    }, []);

    useEffect(() => {
        if (particles.length === 0) return;

        const interval = setInterval(() => {
            setParticles((prev) =>
                prev
                    .map((p) => ({
                        ...p,
                        x: p.x + p.speedX,
                        y: p.y + p.speedY + 0.1, // gravity
                        speedX: p.speedX * 0.98,
                        speedY: p.speedY * 0.98 + 0.05,
                        life: p.life - 0.02,
                    }))
                    .filter((p) => p.life > 0)
            );
        }, 16);

        return () => clearInterval(interval);
    }, [particles.length]);

    return (
        <>
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        left: x + p.x,
                        top: y + p.y,
                        width: p.size * p.life,
                        height: p.size * p.life,
                        backgroundColor: p.color,
                        opacity: p.life,
                        boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                        transform: "translate(-50%, -50%)",
                    }}
                />
            ))}
        </>
    );
}

export function Fireworks({
    isActive,
    onComplete,
    duration = 3000,
}: FireworksProps) {
    const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>(
        []
    );
    const [mounted, setMounted] = useState(false);
    const { playFireworks: playFireworksSound } = useSoundEffects();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isActive) {
            setBursts([]);
            return;
        }

        let burstId = 0;
        const createBurst = () => {
            const id = burstId++;
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * (window.innerHeight * 0.6);
            setBursts((prev) => [...prev, { id, x, y }]);

            // Remove burst after animation completes
            setTimeout(() => {
                setBursts((prev) => prev.filter((b) => b.id !== id));
            }, 2000);
        };

        // Create initial bursts
        createBurst();
        createBurst();
        playFireworksSound(); // Play fireworks sound

        // Create more bursts over time
        const intervalId = setInterval(createBurst, 300);

        // Stop after duration
        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            setTimeout(() => {
                setBursts([]);
                onComplete?.();
            }, 2000);
        }, duration);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, [isActive, duration, onComplete]);

    if (!mounted || !isActive) return null;

    return createPortal(
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {bursts.map((burst) => (
                <FireworksBurst key={burst.id} x={burst.x} y={burst.y} />
            ))}

            {/* Celebratory text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl font-bold text-white animate-bounce drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]">
                    🎉 恭喜完成！
                </div>
            </div>
        </div>,
        document.body
    );
}
