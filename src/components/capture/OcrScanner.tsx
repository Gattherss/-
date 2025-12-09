"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, FileText, X } from "lucide-react";

interface OcrScannerProps {
    onAmountDetected: (amount: string) => void;
}

export function OcrScanner({ onAmountDetected }: OcrScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
        setError(null);
        setScanning(true);

        try {
            // Dynamic import to avoid SSR issues
            const Tesseract = await import("tesseract.js");

            const result = await Tesseract.recognize(file, "chi_sim+eng", {
                logger: (m) => console.log("[OCR]", m),
            });

            const text = result.data.text;
            console.log("[OCR] Extracted text:", text);

            // Try to find amount patterns (Chinese and Western formats)
            const patterns = [
                /¥\s*([\d,]+\.?\d*)/g,      // ¥123.45
                /￥\s*([\d,]+\.?\d*)/g,      // ￥123.45
                /\$\s*([\d,]+\.?\d*)/g,     // $123.45
                /总[计金额]+[：:]\s*([\d,]+\.?\d*)/g,  // 总计: 123.45
                /合[计]+[：:]\s*([\d,]+\.?\d*)/g,     // 合计: 123.45
                /金额[：:]\s*([\d,]+\.?\d*)/g,       // 金额: 123.45
                /([\d,]+\.\d{2})/g,         // Any decimal number with 2 decimal places
            ];

            let foundAmount: string | null = null;

            for (const pattern of patterns) {
                const matches = text.matchAll(pattern);
                for (const match of matches) {
                    const amount = match[1]?.replace(/,/g, "");
                    if (amount && parseFloat(amount) > 0) {
                        foundAmount = amount;
                        break;
                    }
                }
                if (foundAmount) break;
            }

            if (foundAmount) {
                onAmountDetected(foundAmount);
                setError(null);
            } else {
                setError("未能识别到金额，请手动输入");
            }
        } catch (err) {
            console.error("[OCR] Error:", err);
            setError("识别失败，请重试");
        } finally {
            setScanning(false);
        }
    };

    const handleClear = () => {
        setPreview(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-2">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                id="ocr-input"
            />

            {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <img src={preview} alt="Receipt preview" className="w-full h-32 object-cover" />

                    {scanning && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <div className="flex items-center gap-2 text-white">
                                <Loader2 size={18} className="animate-spin" />
                                <span className="text-sm">识别中...</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleClear}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white/70 hover:text-white transition"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <label
                    htmlFor="ocr-input"
                    className="flex items-center justify-center gap-2 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl text-purple-200 hover:bg-purple-500/30 transition cursor-pointer"
                >
                    <Camera size={18} />
                    <span className="text-sm font-medium">拍照识别金额</span>
                </label>
            )}

            {error && (
                <div className="flex items-center gap-1 text-xs text-amber-400">
                    <FileText size={12} />
                    {error}
                </div>
            )}
        </div>
    );
}
