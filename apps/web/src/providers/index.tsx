'use client';

import { ReactNode } from 'react';
import { PrivyProviderWrapper } from './privy-provider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <PrivyProviderWrapper>
      {children}
    </PrivyProviderWrapper>
  );
}

