'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// Popular icons for bachelor party activities
const popularIcons = [
  'Trophy', 'Target', 'Ticket', 'Beer', 'Wine', 'Utensils', 'Music',
  'Gamepad2', 'Dumbbell', 'Ship', 'Plane', 'Car', 'Home', 'Hotel',
  'MapPin', 'Calendar', 'Clock', 'Zap', 'Flame', 'Star', 'Heart',
  'Users', 'User', 'PartyPopper', 'Gift', 'Camera', 'Film', 'Tv',
  'Palette', 'Brush', 'Scissors', 'Hammer', 'Wrench', 'Sword',
  'Shield', 'Mountain', 'Trees', 'Waves', 'Sun', 'Moon', 'Coffee'
];

interface IconSelectorProps {
  value: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
}

export function IconSelector({ value, onChange, disabled }: IconSelectorProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  // Get the icon component
  const IconComponent = (Icons as any)[value] as LucideIcon || Icons.Trophy;

  // Filter icons based on search
  const filteredIcons = popularIcons.filter((icon) =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={disabled}
        >
          <IconComponent className="w-4 h-4 mr-2" />
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            {filteredIcons.map((iconName) => {
              const Icon = (Icons as any)[iconName] as LucideIcon;
              if (!Icon) return null;

              return (
                <button
                  key={iconName}
                  onClick={() => {
                    onChange(iconName);
                    setOpen(false);
                  }}
                  className={`p-2 rounded hover:bg-accent transition-colors ${
                    value === iconName ? 'bg-accent' : ''
                  }`}
                  title={iconName}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
          {filteredIcons.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No icons found
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
