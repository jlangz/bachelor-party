'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import { Home, Info, Calendar, Trophy, Shield, LogOut, Dices, User, Users, MapPin } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/info', label: 'Event Info', icon: Info },
    { href: '/rsvp', label: 'RSVP', icon: Calendar },
    { href: '/activities', label: 'Activities', icon: Trophy },
    { href: '/recommendations', label: 'Places', icon: MapPin },
    { href: '/directory', label: 'Directory', icon: Users },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/admin', label: 'Admin', icon: Shield },
  ];

  return (
    <nav className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 text-primary font-bold">
            <Dices className="w-6 h-6" />
            <span className="hidden sm:inline">Jakob&apos;s Bachelor Party</span>
            <span className="sm:hidden">JBP</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              // Hide admin link for non-admin users
              if (item.href === '/admin' && (!user || user.role !== 'admin')) {
                return null;
              }

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className="gap-1 sm:gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}

            {/* Logout Button */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1 sm:gap-2 text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
