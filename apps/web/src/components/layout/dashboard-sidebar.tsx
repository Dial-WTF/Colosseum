'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Image as ImageIcon,
  Music,
  Sparkles,
  Wallet,
  LayoutGrid,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  {
    label: 'Studio Home',
    href: '/dashboard/studio',
    icon: Home,
  },
  {
    label: 'Image Studio',
    href: '/dashboard/create/image',
    icon: ImageIcon,
  },
  {
    label: 'Audio Studio',
    href: '/dashboard/create/audio',
    icon: Music,
  },
  {
    label: 'Mint NFT',
    href: '/dashboard/mint',
    icon: Sparkles,
  },
  {
    label: 'My Collection',
    href: '/dashboard/my-collection',
    icon: Wallet,
  },
  {
    label: 'Marketplace',
    href: '/marketplace',
    icon: LayoutGrid,
  },
  {
    label: 'My Profile',
    href: '/dashboard/profile',
    icon: User,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } transition-all duration-300 border-r border-border bg-card flex flex-col relative`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {collapsed ? (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">D</span>
              </div>
              <div>
                <h2 className="font-bold text-lg">Dial.WTF</h2>
                <p className="text-xs text-muted-foreground">Creator Studio</p>
              </div>
            </>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard/studio' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-border">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={20} className="flex-shrink-0" />
          {!collapsed && <span className="font-medium">Settings</span>}
        </Link>
      </div>
    </aside>
  );
}

