import React, { useState } from 'react';
import { X, PlusCircle, Building, MapPin } from 'lucide-react';
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
  const [contactTeam, setContactTeam] = useState('BBMP Rapid Response Taskforce');
  const [emergencyContact, setEmergencyContact] = useState('+91 80 2200 1100');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        historicalIncidentCount: 0,
        drainageQuality: 'Moderate',
      });
      onClose();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Establish Asset Geographic Context</h3>
              <p className="text-[11px] text-slate-500">
                Register a new critical facility into the municipal risk mesh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Asset Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Asset Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Baptist Hospital Emergency Wing / Koramangala 11kV Substation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-slate-900 placeholder-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Type & Ward */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Asset Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AssetType)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="HOSPITAL">Hospital / Healthcare</option>
                <option value="POWER_SUBSTATION">Power Substation</option>
                <option value="METRO_STATION">Metro / Transit Hub</option>
                <option value="STORMWATER_PUMP">Stormwater Pumping Station</option>
                <option value="RESIDENTIAL_SETTLEMENT">Informal Settlement</option>
                <option value="CRITICAL_ROAD_JUNCTION">Road Junction / Underpass</option>
                <option value="INDUSTRIAL_PARK">Industrial / Tech Park</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Municipal Ward</label>
              <select
                value={wardId}
                onChange={(e) => handleWardChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
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
              <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Elevation (m MSL)</label>
              <input
                type="number"
                required
                value={elevationM}
                onChange={(e) => setElevationM(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Drainage Capacity & Impervious Surface */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Drainage Capacity (mm/hr)
              </label>
              <input
                type="number"
                required
                value={drainageCapacityMmHr}
                onChange={(e) => setDrainageCapacityMmHr(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Impervious Surface (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={imperviousPct}
                onChange={(e) => setImperviousPct(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Criticality & Population */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Criticality Tier (1 to 5)
              </label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(parseInt(e.target.value, 10) as CriticalityLevel)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value={5}>Tier 5 - Vital (Hospitals, Major Substation)</option>
                <option value={4}>Tier 4 - High (Transit Hub, Settlements)</option>
                <option value={3}>Tier 3 - Moderate (Arterial Junction)</option>
                <option value={2}>Tier 2 - Secondary</option>
                <option value={1}>Tier 1 - Baseline</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Population Served</label>
              <input
                type="number"
                value={populationServed}
                onChange={(e) => setPopulationServed(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

          {/* Vulnerability Checkboxes */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Physical Vulnerabilities & Onsite Buffers
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={basementEquipment}
                  onChange={(e) => setBasementEquipment(e.target.checked)}
                  className="rounded border-slate-300 text-sky-700 focus:ring-0"
                />
                <span>Basement Equipment</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDewateringPumps}
                  onChange={(e) => setHasDewateringPumps(e.target.checked)}
                  className="rounded border-slate-300 text-sky-700 focus:ring-0"
                />
                <span>Dewatering Pumps</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBackupPower}
                  onChange={(e) => setHasBackupPower(e.target.checked)}
                  className="rounded border-slate-300 text-sky-700 focus:ring-0"
                />
                <span>Backup Generators</span>
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1 px-4 py-1.5 rounded-md bg-sky-900 hover:bg-sky-800 text-white font-semibold shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Registering...' : 'Register Asset in Risk Mesh'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
