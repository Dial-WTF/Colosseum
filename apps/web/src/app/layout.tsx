import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';

const inter = Inter({ subsets: ['latin'] });

// Disable static generation for wallet adapter compatibility
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dial.WTF - Solana Ringtone NFT Marketplace',
  description: 'Limited edition Solana ringtone NFTs. Mint, collect, and trade unique ringtones on the blockchain.',
  keywords: ['Solana', 'NFT', 'Ringtones', 'Marketplace', 'Metaplex', 'Web3'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

