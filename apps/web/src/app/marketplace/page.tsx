import { Header } from '~/layout/header';
import { MarketplaceGrid } from '~/marketplace/marketplace-grid';
import { MarketplaceFilters } from '~/marketplace/marketplace-filters';

export const dynamic = 'force-dynamic';

export default function MarketplacePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Marketplace</h1>
            <p className="text-muted-foreground">
              Browse and trade limited edition ringtone NFTs
            </p>
          </div>

          <div className="grid lg:grid-cols-[240px_1fr] gap-8">
            <aside>
              <MarketplaceFilters />
            </aside>
            <div>
              <MarketplaceGrid />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

