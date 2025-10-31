import { Header } from '~/layout/header';
import { InfiniteFeed } from '~/feed/infinite-feed';

export const dynamic = 'force-dynamic';

export default function FeedPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Your Personalized Feed
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover ringtone NFTs curated just for you. Scroll to explore trending drops, 
            recommended collections, and items similar to what you love.
          </p>
        </div>

        {/* Feed Component */}
        <InfiniteFeed />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Powered by AI recommendations • Updated in real-time • Personalized for you
          </p>
        </div>
      </footer>
    </div>
  );
}

