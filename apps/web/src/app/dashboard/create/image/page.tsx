'use client';

import { Suspense } from 'react';
import { ImageStudioProject } from '#/components/studio/image-studio-project';
import { ImageStudio } from '#/components/studio/image-studio';

export const dynamic = 'force-dynamic';

function ImageStudioWrapper() {
  // Check if we're in project mode via URL params
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    const hasProjectParams = searchParams.has('projectId') || searchParams.has('mode');
    
    if (hasProjectParams) {
      return <ImageStudioProject />;
    }
  }
  
  return <ImageStudio />;
}

export default function ImageStudioPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    }>
      <ImageStudioWrapper />
    </Suspense>
  );
}

