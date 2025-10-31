import { Header } from '~/layout/header';
import { Hero } from '~/home/hero';
import { MintSection } from '~/home/mint-section';
import { MarketplacePreview } from '~/home/marketplace-preview';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <MintSection />
        <MarketplacePreview />
      </main>
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Dial.WTF. Built on Solana.</p>
        </div>
      </footer>
    </div>
  );
}

