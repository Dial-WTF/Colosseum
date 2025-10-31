'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AudioStudioProject } from '#/components/studio/audio-studio-project';

export const dynamic = 'force-dynamic';

function AudioStudioWrapper() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasProjectParams = searchParams?.has('projectId') || searchParams?.has('mode');
  
  // Always use project-based studio - redirect if no params
  useEffect(() => {
    if (!hasProjectParams) {
      router.replace('/dashboard/create/audio?mode=project');
    }
  }, [hasProjectParams, router]);
  
  return <AudioStudioProject />;
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

