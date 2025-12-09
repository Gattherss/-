"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
    children: React.ReactNode;
}

export function PullToRefresh({ children }: PullToRefreshProps) {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const isPulling = useRef(false);

    const THRESHOLD = 80;

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Only allow pull when at top
        if (containerRef.current && containerRef.current.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
            isPulling.current = true;
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling.current) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 0 && containerRef.current?.scrollTop === 0) {
            // Apply resistance factor
            const distance = Math.min(diff * 0.5, 120);
            setPullDistance(distance);
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (pullDistance >= THRESHOLD && !refreshing) {
            setRefreshing(true);
            setPullDistance(THRESHOLD);

            // Refresh the page
            router.refresh();

            setTimeout(() => {
                setRefreshing(false);
                setPullDistance(0);
            }, 1000);
        } else {
            setPullDistance(0);
        }
        isPulling.current = false;
    }, [pullDistance, refreshing, router]);

    return (
        <div
            ref={containerRef}
            className="min-h-screen overflow-y-auto"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull indicator */}
            <div
                className="flex items-center justify-center transition-all duration-200 overflow-hidden"
                style={{ height: pullDistance }}
            >
                <RefreshCw
                    size={24}
                    className={`text-cyan-400 transition-transform ${refreshing ? "animate-spin" : ""
                        }`}
                    style={{
                        transform: `rotate(${pullDistance * 3}deg)`,
                        opacity: Math.min(pullDistance / THRESHOLD, 1),
                    }}
                />
            </div>

            {/* Content */}
            <div
                style={{
                    transform: `translateY(${pullDistance > 0 ? 0 : 0}px)`,
                }}
            >
                {children}
            </div>
        </div>
    );
}
