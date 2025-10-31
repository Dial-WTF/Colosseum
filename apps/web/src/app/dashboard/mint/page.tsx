import { MintInterface } from '~/mint/mint-interface';

export const dynamic = 'force-dynamic';

export default function MintPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Mint Ringtone NFTs</h1>
          <p className="text-muted-foreground">
            Mint limited edition ringtone NFTs with bonding curve pricing
          </p>
        </div>

        <MintInterface />
      </div>
    </div>
  );
}

