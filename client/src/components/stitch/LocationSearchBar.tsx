import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation, Check, Loader2, Globe } from 'lucide-react';
import { 
  getActiveRegion, 
  setActiveRegion, 
  getCustomLocation, 
  setCustomLocation, 
  searchLocation, 
  getActiveLocationDetails,
  type RegionKey, 
  type CustomLocation 
} from '../../citizen/geo';

export const LocationSearchBar: React.FC = () => {
  const [activeRegion, setActiveRegionState] = useState<RegionKey>(getActiveRegion());
  const [customLoc, setCustomLocState] = useState<CustomLocation | null>(getCustomLocation());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const locDetails = getActiveLocationDetails();

  useEffect(() => {
    const handleChanged = () => {
      setActiveRegionState(getActiveRegion());
      setCustomLocState(getCustomLocation());
    };
    window.addEventListener('climateshield_region_changed', handleChanged);
    return () => window.removeEventListener('climateshield_region_changed', handleChanged);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await searchLocation(query);
      setResults(res);
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const handleGpsClick = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: CustomLocation = {
            name: 'My GPS Location',
            subtitle: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (Live Geolocation)`,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setCustomLocation(loc);
          setActiveRegionState('CUSTOM');
          setCustomLocState(loc);
          setDropdownOpen(false);
          setQuery('');
          setLoading(false);
          window.dispatchEvent(new Event('climateshield_region_changed'));
        },
        () => {
          setLoading(false);
          selectRegion('GPS');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      selectRegion('GPS');
    }
  };

  const selectRegion = (key: RegionKey) => {
    setActiveRegion(key);
    setActiveRegionState(key);
    setDropdownOpen(false);
    setQuery('');
    window.dispatchEvent(new Event('climateshield_region_changed'));
  };

  const selectCustomLocation = (loc: CustomLocation) => {
    setCustomLocation(loc);
    setActiveRegionState('CUSTOM');
    setCustomLocState(loc);
    setDropdownOpen(false);
    setQuery('');
    window.dispatchEvent(new Event('climateshield_region_changed'));
  };

  return (
    <div className="relative font-sans z-[9999]" ref={dropdownRef}>
      <div className="flex items-center gap-2 bg-[#0f172a]/95 backdrop-blur-md text-white px-2.5 py-1.5 rounded-xl text-xs shadow-xl border border-slate-700/80">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">LOCATION:</span>
        </span>

        {/* GPS Quick Action */}
        <button
          onClick={handleGpsClick}
          title="Use browser live GPS telemetry"
          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 ${
            activeRegion === 'GPS' || (activeRegion === 'CUSTOM' && customLoc?.name === 'My GPS Location')
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-200 bg-slate-800/80 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>My GPS</span>
        </button>

        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[140px]">
          <input
            type="text"
            value={query}
            onFocus={() => setDropdownOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setDropdownOpen(true);
            }}
            placeholder={activeRegion === 'CUSTOM' && customLoc ? customLoc.name : "Search location or city..."}
            className="w-full bg-slate-900 border border-slate-700 text-white text-[11px] rounded-lg px-2.5 py-1 pl-7 focus:outline-none focus:border-sky-500 transition-colors placeholder:text-slate-400"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
          {loading && <Loader2 className="w-3 h-3 text-sky-400 animate-spin absolute right-2 pointer-events-none" />}
        </div>
      </div>

      {/* Geocoding Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-[9999] overflow-hidden text-white animate-in fade-in slide-in-from-top-1 duration-150">
          {query.trim().length >= 2 ? (
            <div className="p-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Search className="w-3 h-3 text-sky-400" />
                Global Place Search Results
              </div>
              {results.length > 0 ? (
                results.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectCustomLocation(item)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-start gap-2 group"
                  >
                    <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="truncate">
                      <div className="font-bold text-xs text-white truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-3 text-center text-xs text-slate-400">
                  {loading ? 'Searching OpenStreetMap Nominatim...' : 'No matching locations found'}
                </div>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Quick Region Switcher
              </div>
              <button
                onClick={() => selectRegion('GPS')}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-blue-400" />
                  <span>My Live GPS Location</span>
                </span>
                {activeRegion === 'GPS' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
              <button
                onClick={() => selectRegion('NEPAL')}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>🇳🇵</span>
                  <span>Kathmandu Valley, Nepal</span>
                </span>
                {activeRegion === 'NEPAL' && <Check className="w-3.5 h-3.5 text-red-400" />}
              </button>
              <button
                onClick={() => selectRegion('CHENNAI')}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>🇮🇳</span>
                  <span>East Basin, Chennai</span>
                </span>
                {activeRegion === 'CHENNAI' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>

              {customLoc && (
                <button
                  onClick={() => selectCustomLocation(customLoc)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs transition-colors border-t border-slate-800 mt-1 pt-2"
                >
                  <span className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">{customLoc.name}</span>
                  </span>
                  {activeRegion === 'CUSTOM' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
