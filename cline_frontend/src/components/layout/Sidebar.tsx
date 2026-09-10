import {
  Activity,
  Flame,
  LayoutDashboard,
  MapPin,
  Settings,
  Shield,
} from 'lucide-react';

const navItems = [
  { id: 'command', label: 'Command Center', icon: LayoutDashboard, active: true },
  { id: 'responses', label: 'Responses', icon: Activity, active: false },
  { id: 'infrastructure', label: 'Infrastructure', icon: MapPin, active: false },
  { id: 'hotspots', label: 'Hotspots', icon: Flame, active: false },
  { id: 'settings', label: 'Settings', icon: Settings, active: false },
];

export function Sidebar() {
  return (
    <aside className="flex w-14 shrink-0 flex-col items-center border-r border-cs-border bg-cs-panel py-4 lg:w-16">
      <div
        className="mb-6 flex h-9 w-9 items-center justify-center rounded-lg bg-cs-primary/20 text-cs-primary"
        aria-label="ClimateShield"
      >
        <Shield className="h-5 w-5" />
      </div>
      <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
        {navItems.map(({ id, label, icon: Icon, active }) => (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            disabled={!active}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cs-primary/50 ${
              active
                ? 'bg-cs-primary/20 text-cs-primary'
                : 'cursor-not-allowed text-cs-muted/40'
            }`}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </nav>
    </aside>
  );
}
