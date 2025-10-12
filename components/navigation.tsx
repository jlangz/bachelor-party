'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';
import { Home, Info, Calendar, Trophy, Shield, LogOut, Dices, User, Users, MapPin, Target, Menu, X, MessageSquare } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
    setMobileMenuOpen(false);
  };

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/info', label: 'Event Info', icon: Info },
    { href: '/rsvp', label: 'RSVP', icon: Calendar },
    { href: '/activities', label: 'Activities', icon: Trophy },
    { href: '/predictions', label: 'Predictions', icon: Target },
    { href: '/recommendations', label: 'Places', icon: MapPin },
    { href: '/posts', label: 'Posts', icon: MessageSquare },
    { href: '/directory', label: 'Directory', icon: Users },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/admin', label: 'Admin', icon: Shield },
  ];

  const visibleNavItems = navItems.filter(
    (item) => item.href !== '/admin' || (user && user.role === 'admin')
  );

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

          {/* Desktop Navigation Links - Hidden below 1320px */}
          <div className="hidden min-[1320px]:flex items-center gap-1 sm:gap-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

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

          {/* Hamburger Menu Button - Shows below 1320px */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-[1320px]:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="min-[1320px]:hidden border-t border-border/50 py-4">
            <div className="flex flex-col gap-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className="w-full justify-start gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}

              {/* Logout Button in Mobile Menu */}
              {user && (
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
