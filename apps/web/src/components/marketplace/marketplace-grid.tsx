'use client';

export function MarketplaceGrid() {
  // Mock data - will be replaced with real data from Solana
  const mockListings = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `Ringtone Pack #${i + 1}`,
    edition: `${i + 1}/100`,
    price: (0.5 + Math.random()).toFixed(2),
    lastSale: (0.3 + Math.random() * 0.5).toFixed(2),
    image: ['🎵', '📞', '🔮', '👑'][i % 4],
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          Showing {mockListings.length} listings
        </p>
        <select className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm">
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
          <option>Recently Listed</option>
          <option>Edition Number</option>
        </select>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockListings.map((listing) => (
          <div
            key={listing.id}
            className="bg-secondary rounded-lg p-4 hover:bg-secondary/70 transition-colors cursor-pointer border border-transparent hover:border-primary"
          >
            <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center text-6xl">
              {listing.image}
            </div>
            <h3 className="font-semibold mb-1">{listing.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Edition {listing.edition}
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Current Price</p>
                <p className="font-semibold text-primary">{listing.price} SOL</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Last Sale</p>
                <p className="text-sm">{listing.lastSale} SOL</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

