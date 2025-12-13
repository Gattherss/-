"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

/**
 * Upload images directly from client to Supabase Storage.
 * This bypasses server timeout limits and allows real progress tracking.
 */
export async function uploadReceiptImages(
    projectId: string,
    files: File[],
    onProgress?: (current: number, total: number) => void
): Promise<{ paths: string[]; errors: string[] }> {
    const supabase = createSupabaseBrowserClient();
    const paths: string[] = [];
    const errors: string[] = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size === 0) continue;

        const ext = file.name.split(".").pop();
        const objectPath = `${projectId}/${crypto.randomUUID()}.${ext || "bin"}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from("receipts")
                .upload(objectPath, file, {
                    cacheControl: "3600",
                    contentType: file.type || "application/octet-stream",
                    upsert: false,
                });

            if (uploadError) {
                console.error(`[ClientUpload] Error uploading file ${i + 1}:`, uploadError);
                errors.push(`${file.name}: ${uploadError.message}`);
            } else {
                paths.push(objectPath);
                console.log(`[ClientUpload] File ${i + 1}/${total} uploaded: ${objectPath}`);
            }
        } catch (err: any) {
            console.error(`[ClientUpload] Exception uploading file ${i + 1}:`, err);
            errors.push(`${file.name}: ${err.message || "上传失败"}`);
        }

        // Report progress after each file
        if (onProgress) {
            onProgress(i + 1, total);
        }
    }

    return { paths, errors };
}
