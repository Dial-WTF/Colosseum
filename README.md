# Dial.WTF - Solana Ringtone NFT Marketplace

> Limited edition Solana ringtone NFTs with bonding curve pricing

## 🎵 Overview

Dial.WTF is a Solana-based NFT marketplace for limited edition ringtones. Built with Next.js 15, React 19, and Metaplex, it allows users to mint, collect, and trade unique ringtone NFTs as Master Editions with dynamic bonding curve pricing.

## 🚀 Tech Stack

### Frontend
- **Next.js 15** - App Router with React 19
- **TypeScript 5.6** - Type safety
- **Tailwind CSS 3.4** - Styling
- **Lucide React** - Icons

### Blockchain
- **Solana** - Layer 1 blockchain
- **Metaplex** - NFT standard (Master Editions)
- **@solana/web3.js** - Solana SDK
- **@solana/wallet-adapter** - Wallet connection

### Authentication
- **Privy** - Solana wallet authentication (Sign-In With Solana)

### NFT Standards
- ✅ **Master Edition** - Limited editions with numbered prints (default)
- 🔜 **Semi-Fungible Tokens (SFT)** - Coming soon
- 🔜 **Compressed NFTs (cNFT)** - Coming soon

## 📦 Project Structure

```
Colosseum/
├── apps/
│   └── web/                  # Next.js 15 web application
│       ├── src/
│       │   ├── app/          # App router pages
│       │   │   ├── (routes)/ # Client pages
│       │   │   │   ├── marketplace/
│       │   │   │   ├── mint/
│       │   │   │   └── my-collection/
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── components/   # React components
│       │   │   ├── home/
│       │   │   ├── layout/
│       │   │   ├── marketplace/
│       │   │   ├── mint/
│       │   │   └── wallet/
│       │   └── lib/          # Utilities
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── package.json
├── packages/
│   ├── bonding-curve/        # Bonding curve calculations
│   │   └── src/              # Calculator and advanced features
│   ├── shared/               # Shared utilities and types
│   │   ├── src/
│   │   │   ├── types/        # TypeScript types
│   │   │   ├── constants/    # Constants
│   │   │   └── utils/        # Shared utilities
│   │   └── package.json
│   ├── types/                # TypeScript type definitions
│   │   └── src/              # NFT and project types
│   └── worm/                 # S3WORM data storage layer
│       ├── src/
│       │   ├── client.ts     # Storj client configuration
│       │   ├── entities/     # Entity definitions
│       │   └── repositories/ # Data access layer
│       └── package.json
├── pnpm-workspace.yaml
└── package.json
```

## 🛠️ Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Solana wallet** (Phantom, Solflare, etc.)
- **Storj account** (for user data storage) - [Sign up](https://storj.io/)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Colosseum
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**

Create `apps/web/.env.local`:
```env
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# AI Generation APIs
REPLICATE_API_TOKEN=your_replicate_token
ELEVENLABS_API_KEY=your_elevenlabs_key

# Storj S3 Configuration (User Data Storage)
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_BUCKET=dial-wtf-users
STORJ_ACCESS_KEY=your_storj_access_key_id
STORJ_SECRET_KEY=your_storj_secret_access_key
```

**Get Storj Credentials:**
1. Create account at [storj.io](https://storj.io/)
2. Go to **Access** → **Create S3 Credentials**
3. Configure permissions (Read, Write, List, Delete)
4. Create or select a bucket
5. Copy credentials to `.env.local`

4. **Run development server**
```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
pnpm build
pnpm start
```

## 🎨 Features

### Current Features (v0.1)
- ✅ Next.js 15 with React 19
- ✅ Privy wallet authentication
- ✅ Solana wallet adapter integration
- ✅ Master Edition NFT type selector
- ✅ Bonding curve price calculations
- ✅ Marketplace preview
- ✅ Mint interface with pack selection
- ✅ Responsive UI with Tailwind CSS
- ✅ **User data storage with Storj** (via `@dial/worm`)
  - User profiles organized by wallet address
  - NFT collection tracking
  - Activity logging
  - User settings and preferences

### Coming Soon
- 🔜 Actual NFT minting (Metaplex integration)
- 🔜 Smart contract deployment (Anchor)
- 🔜 Semi-fungible token support
- 🔜 Compressed NFT support
- 🔜 Audio preview player
- 🔜 Secondary marketplace trading
- 🔜 React Native mobile app

### Data Storage Architecture

User data is stored in **Storj** (decentralized S3-compatible storage) using the `@dial/worm` package:

```
users/
  └── [wallet-address]/
      ├── profile.json      # User profile
      ├── collection.json   # NFT collection
      ├── activity.json     # Activity log
      └── settings.json     # User settings
```

**API Routes:**
- `GET /api/users/[address]/profile` - Get user profile
- `PUT /api/users/[address]/profile` - Update profile
- `POST /api/users/[address]/profile` - Initialize user
- `GET /api/users/[address]/collection` - Get NFT collection
- `POST /api/users/[address]/collection` - Update collection

## 💎 NFT Standards

### Master Edition (Current)
- Each ringtone pack is a Master Edition NFT
- Limited supply with numbered prints (e.g., #1/100, #2/100)
- Bonding curve pricing for fair distribution
- Full Metaplex marketplace support
- Built-in royalty enforcement

### Semi-Fungible Tokens (Coming Soon)
- True fungibility within editions
- Lower storage costs
- ERC-1155 equivalent

### Compressed NFTs (Coming Soon)
- 99.9% cheaper minting costs
- Merkle tree-based storage
- Perfect for high-volume drops

## 📈 Bonding Curves

The platform supports multiple bonding curve types:

### Linear Curve
```
Price = basePrice + (editionNumber * increment)
```

### Exponential Curve
```
Price = basePrice * (multiplier ^ editionNumber)
```

### Logarithmic Curve
```
Price = basePrice + log(editionNumber) * increment
```

## 🔐 Security

- Client-side wallet integration via Privy
- No private keys stored on servers
- All transactions require user approval
- Testnet (devnet) by default for development

## 📝 Scripts

```bash
# Development
pnpm dev              # Start dev server

# Build
pnpm build            # Build for production
pnpm start            # Start production server

# Utilities
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript type checking
pnpm clean            # Clean node_modules
```

## 🤝 Contributing

This project is under active development. Contributions are welcome!

## 📄 License

MIT

## 🔗 Links

- [Solana Documentation](https://docs.solana.com/)
- [Metaplex Documentation](https://developers.metaplex.com/)
- [Privy Documentation](https://docs.privy.io/)
- [Next.js Documentation](https://nextjs.org/docs)

---

Built with ❤️ on Solana

