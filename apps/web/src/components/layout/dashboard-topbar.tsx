'use client';

import { Bell, Search, HelpCircle } from 'lucide-react';
import { PrivyWalletButton } from '#/components/wallet/privy-wallet-button';

export function DashboardTopBar() {
  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            className="p-2 hover:bg-muted rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell size={20} className="text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>

          <button
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Help"
          >
            <HelpCircle size={20} className="text-muted-foreground" />
          </button>

          <div className="h-8 w-px bg-border"></div>

          <PrivyWalletButton />
        </div>
      </div>
    </header>
  );
}

