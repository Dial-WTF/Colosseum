'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ImageStudioProject } from '#/components/studio/image-studio-project';
import { ImageStudio } from '#/components/studio/image-studio';

export const dynamic = 'force-dynamic';

function ImageStudioWrapper() {
  const searchParams = useSearchParams();
  const hasProjectParams = searchParams?.has('projectId') || searchParams?.has('mode');
  
  if (hasProjectParams) {
    return <ImageStudioProject />;
  }
  
  return <ImageStudio />;
}

export default function ImageStudioPage() {
  return (
    <div className="h-full">
      <Suspense fallback={
        <div className="flex h-full min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        </div>
      }>
        <ImageStudioWrapper />
      </Suspense>
    </div>
  );
}

