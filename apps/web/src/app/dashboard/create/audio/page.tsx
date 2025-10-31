'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AudioStudioProject } from '#/components/studio/audio-studio-project';
import { AudioStudio } from '#/components/studio/audio-studio';

export const dynamic = 'force-dynamic';

function AudioStudioWrapper() {
  const searchParams = useSearchParams();
  const hasProjectParams = searchParams?.has('projectId') || searchParams?.has('mode');
  
  if (hasProjectParams) {
    return <AudioStudioProject />;
  }
  
  return <AudioStudio />;
}

export default function AudioStudioPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    }>
      <AudioStudioWrapper />
    </Suspense>
  );
}

