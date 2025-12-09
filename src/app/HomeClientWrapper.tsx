"use client";

import { PullToRefresh } from "@/components/ui/PullToRefresh";

interface HomeClientWrapperProps {
    children: React.ReactNode;
}

export function HomeClientWrapper({ children }: HomeClientWrapperProps) {
    return <PullToRefresh>{children}</PullToRefresh>;
}
