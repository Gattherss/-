"use client";

import { useState } from "react";
import { CaptureSheet } from "./CaptureSheet";
import { ActionFab } from "../ui/ActionFab";
import { type Project } from "@/types";

interface CaptureLauncherProps {
  projects: Project[];
  projectId?: string;
}

export function CaptureLauncher({ projects, projectId }: CaptureLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ActionFab onClick={() => setIsOpen(true)} />
      <CaptureSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        projects={projects}
        projectId={projectId}
      />
    </>
  );
}
