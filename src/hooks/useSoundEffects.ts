"use client";

import { useCallback, useRef, useEffect } from "react";

// Simple sound effects using Web Audio API
class SoundGenerator {
    private audioContext: AudioContext | null = null;
    private enabled: boolean = true;

    constructor() {
        if (typeof window !== "undefined") {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            // Check localStorage for sound preference
            this.enabled = localStorage.getItem("soundEnabled") !== "false";
        }
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (typeof window !== "undefined") {
            localStorage.setItem("soundEnabled", enabled.toString());
        }
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    // Keypress beep sound
    playKeypress() {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    // Cash register / money sound
    playCashRegister() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Create a "cha-ching" effect with two tones
        [1000, 1200].forEach((freq, i) => {
            const oscillator = this.audioContext!.createOscillator();
            const gainNode = this.audioContext!.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext!.destination);

            oscillator.frequency.value = freq;
            oscillator.type = "triangle";

            const startTime = now + i * 0.05;
            gainNode.gain.setValueAtTime(0.15, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.15);
        });
    }

    // Success notification sound
    playSuccess() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Ascending notes for success
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const oscillator = this.audioContext!.createOscillator();
            const gainNode = this.audioContext!.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext!.destination);

            oscillator.frequency.value = freq;
            oscillator.type = "sine";

            const startTime = now + i * 0.08;
            gainNode.gain.setValueAtTime(0.1, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.12);
        });
    }

    // Fireworks explosion sound
    playFireworks() {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // White noise burst for explosion effect
        const bufferSize = this.audioContext.sampleRate * 0.3;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        filter.type = "highpass";
        filter.frequency.value = 2000;

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        noise.start(now);
        noise.stop(now + 0.3);
    }
}

let soundGenerator: SoundGenerator | null = null;

export function useSoundEffects() {
    const generatorRef = useRef<SoundGenerator | null>(null);

    useEffect(() => {
        if (!generatorRef.current && typeof window !== "undefined") {
            if (!soundGenerator) {
                soundGenerator = new SoundGenerator();
            }
            generatorRef.current = soundGenerator;
        }
    }, []);

    const playKeypress = useCallback(() => {
        generatorRef.current?.playKeypress();
    }, []);

    const playCashRegister = useCallback(() => {
        generatorRef.current?.playCashRegister();
    }, []);

    const playSuccess = useCallback(() => {
        generatorRef.current?.playSuccess();
    }, []);

    const playFireworks = useCallback(() => {
        generatorRef.current?.playFireworks();
    }, []);

    const setEnabled = useCallback((enabled: boolean) => {
        generatorRef.current?.setEnabled(enabled);
    }, []);

    const isEnabled = useCallback(() => {
        return generatorRef.current?.isEnabled() ?? true;
    }, []);

    return {
        playKeypress,
        playCashRegister,
        playSuccess,
        playFireworks,
        setEnabled,
        isEnabled,
    };
}
