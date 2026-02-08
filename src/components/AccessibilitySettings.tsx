import { Sun, Moon, Eye, Type } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export function AccessibilitySettings() {
  const {
    theme,
    colorblindMode,
    textScale,
    setTheme,
    setColorblindMode,
    setTextScale,
  } = useAccessibility();

  const colorblindModes = [
    { value: 'none', label: 'Standard' },
    { value: 'deuteranopia', label: 'Deuteranopia' },
    { value: 'protanopia', label: 'Protanopia' },
    { value: 'tritanopia', label: 'Tritanopia' },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Eye className="h-5 w-5" />
          <span className="sr-only">Accessibility settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-4">
        <DropdownMenuLabel className="flex items-center gap-2 text-base font-semibold">
          <Eye className="h-4 w-4" />
          Accessibility
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-3" />
        
        {/* Theme Toggle */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Theme
          </label>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setTheme('light')}
            >
              <Sun className="h-4 w-4 mr-2" />
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setTheme('dark')}
            >
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator className="my-3" />

        {/* Colorblind Modes */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium">Color Vision</label>
          <div className="grid grid-cols-2 gap-2">
            {colorblindModes.map((mode) => (
              <Button
                key={mode.value}
                variant={colorblindMode === mode.value ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setColorblindMode(mode.value)}
              >
                {mode.label}
              </Button>
            ))}
          </div>
        </div>

        <DropdownMenuSeparator className="my-3" />

        {/* Text Size */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Type className="h-4 w-4" />
            Text Size: {Math.round(textScale * 100)}%
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">A</span>
            <Slider
              value={[textScale]}
              onValueChange={([value]) => setTextScale(value)}
              min={0.8}
              max={2}
              step={0.01}
              className="flex-1"
            />
            <span className="text-lg text-muted-foreground">A</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>80%</span>
            <button 
              onClick={() => setTextScale(1)} 
              className="hover:text-foreground transition-colors"
            >
              Reset
            </button>
            <span>200%</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
