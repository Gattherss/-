-- Add status column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'completed', 'archived'));
