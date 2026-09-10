import React, { useState } from 'react';
import { X, PlusCircle, Building2, MapPin } from 'lucide-react';
import { Ward, Asset, AssetType, CriticalityLevel } from '../types';

interface NewAssetModalProps {
  wards: Ward[];
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (newAsset: Omit<Asset, 'id'>) => Promise<void>;
}

export const NewAssetModal: React.FC<NewAssetModalProps> = ({
  wards,
  isOpen,
  onClose,
  onAddAsset,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('HOSPITAL');
  const [wardId, setWardId] = useState(wards[0]?.id || '');
  const [lat, setLat] = useState('12.9350');
  const [lng, setLng] = useState('77.6250');
  const [elevationM, setElevationM] = useState('883');
  const [drainageCapacityMmHr, setDrainageCapacityMmHr] = useState('30');
  const [imperviousPct, setImperviousPct] = useState('85');
  const [criticality, setCriticality] = useState<CriticalityLevel>(4);
  const [hasBackupPower, setHasBackupPower] = useState(true);
  const [basementEquipment, setBasementEquipment] = useState(true);
  const [hasDewateringPumps, setHasDewateringPumps] = useState(false);
  const [populationServed, setPopulationServed] = useState('25000');
  const [contactTeam, setContactTeam] = useState('Facility Emergency Response');
  const [emergencyContact, setEmergencyContact] = useState('+91 80 2200 1100');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When ward changes, automatically update center coordinates
  const handleWardChange = (newWardId: string) => {
    setWardId(newWardId);
    const ward = wards.find((w) => w.id === newWardId);
    if (ward) {
      setLat(ward.center[0].toFixed(4));
      setLng(ward.center[1].toFixed(4));
      setElevationM(ward.avgElevationM.toString());
      setDrainageCapacityMmHr(ward.drainageCapacityMmHr.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedWard = wards.find((w) => w.id === wardId);
    setIsSubmitting(true);

    try {
      await onAddAsset({
        name: name.trim(),
        type,
        wardId,
        wardName: selectedWard ? selectedWard.name : 'Bengaluru Ward',
        location: {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        },
        elevationM: parseFloat(elevationM) || 885,
        drainageCapacityMmHr: parseFloat(drainageCapacityMmHr) || 30,
        imperviousPct: parseFloat(imperviousPct) || 80,
        criticality,
        hasBackupPower,
        basementEquipment,
        hasDewateringPumps,
        populationServed: parseInt(populationServed, 10) || 10000,
        contactTeam,
        emergencyContact,
        status: 'OPERATIONAL',
      });
      onClose();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Establish Asset Context</h3>
              <p className="text-xs text-slate-400">
                Register a new critical facility into the urban climate risk mesh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Asset Name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Asset Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Baptist Hospital Emergency Wing / Koramangala 11kV Substation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Type & Ward */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Asset Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AssetType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="HOSPITAL">Hospital / Healthcare</option>
                <option value="POWER_SUBSTATION">Power Substation</option>
                <option value="METRO_STATION">Metro / Transit Hub</option>
                <option value="STORMWATER_PUMP">Stormwater Pumping Station</option>
                <option value="RESIDENTIAL_SETTLEMENT">Informal Settlement / Low-Lying Community</option>
                <option value="CRITICAL_ROAD_JUNCTION">Critical Road Junction / Underpass</option>
                <option value="INDUSTRIAL_PARK">Tech / Industrial Park</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Municipal Ward</label>
              <select
                value={wardId}
                onChange={(e) => handleWardChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Coordinates & Elevation */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Elevation (m MSL)</label>
              <input
                type="number"
                required
                value={elevationM}
                onChange={(e) => setElevationM(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Drainage Capacity & Impervious Surface */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Drainage Capacity (mm/hr)
              </label>
              <input
                type="number"
                required
                value={drainageCapacityMmHr}
                onChange={(e) => setDrainageCapacityMmHr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Impervious Surface (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={imperviousPct}
                onChange={(e) => setImperviousPct(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Criticality & Population Served */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Criticality Level (1 to 5)
              </label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(parseInt(e.target.value, 10) as CriticalityLevel)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value={5}>Level 5 - Vital (Hospitals / Major Grid)</option>
                <option value={4}>Level 4 - High (Transit Hubs / Large Settlements)</option>
                <option value={3}>Level 3 - Medium (Major Intersections)</option>
                <option value={2}>Level 2 - Secondary</option>
                <option value={1}>Level 1 - Baseline</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Population Served</label>
              <input
                type="number"
                value={populationServed}
                onChange={(e) => setPopulationServed(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Checkboxes: Physical Vulnerabilities & Mitigations */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Physical Vulnerabilities & Resilience Measures
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={basementEquipment}
                  onChange={(e) => setBasementEquipment(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Basement Equipment</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDewateringPumps}
                  onChange={(e) => setHasDewateringPumps(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Dewatering Pumps Onsite</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBackupPower}
                  onChange={(e) => setHasBackupPower(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Backup Generators</span>
              </label>
            </div>
          </div>

          {/* Contact Team */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Response Unit Name</label>
              <input
                type="text"
                value={contactTeam}
                onChange={(e) => setContactTeam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Emergency Contact #</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-950/50 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Register Asset in Risk Mesh'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
