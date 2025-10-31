/**
 * User Profile Page
 * Allows users to view and edit their profile
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useUser } from '@/providers/user-context';
import { ProfilePhotoEditor } from '~/profile/profile-photo-editor';
import { Loader2, Save, Edit2, X, Twitter, Globe, MessageCircle, Send } from 'lucide-react';

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

export default function ProfilePage() {
  const { address, isAuthenticated, isLoading: authLoading, refreshProfile } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [twitter, setTwitter] = useState('');
  const [discord, setDiscord] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // Load profile
  useEffect(() => {
    if (!address || authLoading) return;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/users/profile?address=${address}`);
        if (!response.ok) throw new Error('Failed to load profile');

        const data = await response.json();
        setProfile(data);
        
        // Update form state
        setDisplayName(data.displayName || '');
        setBio(data.bio || '');
        setEmail(data.email || '');
        setTwitter(data.socialLinks?.twitter || '');
        setDiscord(data.socialLinks?.discord || '');
        setTelegram(data.socialLinks?.telegram || '');
        setWebsite(data.socialLinks?.website || '');
        setAvatarUrl(data.avatarUrl || '');
        setBannerUrl(data.bannerUrl || '');
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [address, authLoading]);

  const handleSave = async () => {
    if (!address) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          displayName,
          bio,
          email,
          avatarUrl,
          bannerUrl,
          socialLinks: {
            twitter,
            discord,
            telegram,
            website,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save profile');

      const data = await response.json();
      setProfile(data);
      setIsEditing(false);
      
      // Refresh the profile in the context
      await refreshProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to profile data
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setEmail(profile.email || '');
      setTwitter(profile.socialLinks?.twitter || '');
      setDiscord(profile.socialLinks?.discord || '');
      setTelegram(profile.socialLinks?.telegram || '');
      setWebsite(profile.socialLinks?.website || '');
      setAvatarUrl(profile.avatarUrl || '');
      setBannerUrl(profile.bannerUrl || '');
    }
    setIsEditing(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!isAuthenticated || !address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-secondary/30 border border-border rounded-lg p-12 text-center">
          <p className="text-xl text-muted-foreground mb-4">
            Connect your wallet to view your profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your public profile and settings
          </p>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Edit2 size={16} />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="space-y-6">
        {/* Banner Section */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {isEditing ? (
            <ProfilePhotoEditor
              currentPhotoUrl={bannerUrl}
              onPhotoChange={setBannerUrl}
              address={address}
              type="banner"
              className="p-6"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-r from-primary/20 to-purple-500/20 relative">
              {bannerUrl && (
                <img src={bannerUrl} alt="Profile banner" className="w-full h-full object-cover" />
              )}
            </div>
          )}
        </div>

        {/* Avatar and Basic Info */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            {isEditing ? (
              <ProfilePhotoEditor
                currentPhotoUrl={avatarUrl}
                onPhotoChange={setAvatarUrl}
                address={address}
                type="avatar"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-secondary/30 border-2 border-border overflow-hidden flex-shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground">
                    {displayName?.[0]?.toUpperCase() || address[0].toUpperCase()}
                  </div>
                )}
              </div>
            )}

            {/* Basic Info Form */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <p className="text-foreground">{displayName || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Wallet Address</label>
                <p className="text-sm text-muted-foreground font-mono">{address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <label className="block text-sm font-medium mb-2">Bio</label>
          {isEditing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={4}
            />
          ) : (
            <p className="text-foreground whitespace-pre-wrap">{bio || 'No bio added yet'}</p>
          )}
        </div>

        {/* Contact Information */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-foreground">{email || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Social Links</h3>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Twitter size={16} />
                Twitter
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@username"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-foreground">{twitter || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <MessageCircle size={16} />
                Discord
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="username#0000"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-foreground">{discord || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Send size={16} />
                Telegram
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-foreground">{telegram || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Globe size={16} />
                Website
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <p className="text-foreground">{website || 'Not set'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

