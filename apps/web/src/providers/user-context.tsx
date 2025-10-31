/**
 * User Context Provider
 * Tracks the current user's wallet address and syncs it with services
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { setCurrentUserAddress } from '@/lib/project-service';

interface UserProfile {
  address: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  socialLinks?: {
    twitter?: string;
    discord?: string;
    telegram?: string;
    website?: string;
  };
  email?: string;
}

interface UserContextValue {
  address: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: UserProfile | null;
  isLoadingProfile: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  address: null,
  isAuthenticated: false,
  isLoading: true,
  profile: null,
  isLoadingProfile: false,
  refreshProfile: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { user, authenticated, ready } = usePrivy();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Extract wallet address from Privy user
  const address = user?.wallet?.address || null;

  // Sync address with project service
  useEffect(() => {
    setCurrentUserAddress(address);
  }, [address]);

  // Load user profile when address is available
  const loadProfile = async () => {
    if (!address) {
      setProfile(null);
      return;
    }

    setIsLoadingProfile(true);
    try {
      const response = await fetch(`/api/users/profile?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (authenticated && address) {
      loadProfile();
    }
  }, [authenticated, address]);

  const value: UserContextValue = {
    address,
    isAuthenticated: authenticated,
    isLoading: !ready,
    profile,
    isLoadingProfile,
    refreshProfile: loadProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

