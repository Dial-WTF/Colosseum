export const dynamic = 'force-dynamic';

export default function MyCollectionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Collection</h1>
        <p className="text-muted-foreground">
          View and manage your ringtone NFTs
        </p>
      </div>

      <div className="bg-secondary/30 border border-border rounded-lg p-12 text-center">
        <p className="text-xl text-muted-foreground mb-4">
          Connect your wallet to view your collection
        </p>
        <p className="text-sm text-muted-foreground">
          Your minted and purchased ringtone NFTs will appear here
        </p>
      </div>
    </div>
  );
}

