'use client';

import { ReactNode } from 'react';
import { PrivyProviderWrapper } from './privy-provider';
import { UserProvider } from './user-context';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <PrivyProviderWrapper>
      <UserProvider>
        {children}
      </UserProvider>
    </PrivyProviderWrapper>
  );
}

