import React, { useState } from 'react';
import {
  CloudRain,
  Flame,
  Zap,
  CheckCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { SimulationScenario } from '../types';

interface ScenarioBarProps {
  scenarios: SimulationScenario[];
  activeScenarioId: string | null;
  onApplyScenario: (scenarioId: string) => void;
  onApplyCustomWeather: (overrides: {
    precipitationRateMmHr: number;
    temperatureC: number;
    relativeHumidityPct: number;
  }) => void;
  currentRain: number;
  currentTemp: number;
  currentHumidity: number;
}

export const ScenarioBar: React.FC<ScenarioBarProps> = ({
  scenarios,
  activeScenarioId,
  onApplyScenario,
  onApplyCustomWeather,
  currentRain,
  currentTemp,
  currentHumidity,
}) => {
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [sliderRain, setSliderRain] = useState(currentRain);
  const [sliderTemp, setSliderTemp] = useState(currentTemp);
  const [sliderHumidity, setSliderHumidity] = useState(currentHumidity);

  const handleApplyCustom = () => {
    onApplyCustomWeather({
      precipitationRateMmHr: sliderRain,
      temperatureC: sliderTemp,
      relativeHumidityPct: sliderHumidity,
    });
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 lg:px-6 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Label */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Simulation & Hazard Stress-Testing:
          </span>
        </div>

        {/* 1-Click Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {scenarios.map((scenario) => {
            const isActive = activeScenarioId === scenario.id;
            let icon = <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
            let badgeColor = 'hover:bg-slate-800 border-slate-700 text-slate-300';

            if (scenario.category === 'FLOOD') {
              icon = <CloudRain className="w-3.5 h-3.5 text-blue-400" />;
              if (isActive) badgeColor = 'bg-blue-950/80 border-blue-500 text-blue-200 shadow-sm shadow-blue-900/50';
            } else if (scenario.category === 'HEAT') {
              icon = <Flame className="w-3.5 h-3.5 text-orange-400" />;
              if (isActive) badgeColor = 'bg-orange-950/80 border-orange-500 text-orange-200 shadow-sm shadow-orange-900/50';
            } else if (scenario.category === 'COMPOUND') {
              icon = <Zap className="w-3.5 h-3.5 text-purple-400" />;
              if (isActive) badgeColor = 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-sm shadow-purple-900/50';
            } else {
              if (isActive) badgeColor = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
            }

            return (
              <button
                key={scenario.id}
                onClick={() => onApplyScenario(scenario.id)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border transition ${badgeColor}`}
                title={scenario.description}
              >
                {icon}
                <span>{scenario.name.split(' ')[0]}</span>
                {scenario.category === 'FLOOD' && <span className="text-[10px] text-blue-400">72mm/h</span>}
                {scenario.category === 'HEAT' && <span className="text-[10px] text-orange-400">41.5°C</span>}
              </button>
            );
          })}

          {/* Toggle Custom Sliders */}
          <button
            onClick={() => setIsSliderOpen(!isSliderOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
              isSliderOpen
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Sliders</span>
            {isSliderOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expandable Custom Climate Sliders */}
      {isSliderOpen && (
        <div className="mt-3 p-3.5 bg-slate-950/90 rounded-xl border border-cyan-500/30 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Rainfall Rate:</span>
              <span className="font-mono font-bold text-blue-400">{sliderRain} mm/hr</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="2"
              value={sliderRain}
              onChange={(e) => setSliderRain(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Ambient Temperature:</span>
              <span className="font-mono font-bold text-orange-400">{sliderTemp}°C</span>
            </div>
            <input
              type="range"
              min="18"
              max="48"
              step="0.5"
              value={sliderTemp}
              onChange={(e) => setSliderTemp(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Relative Humidity:</span>
              <span className="font-mono font-bold text-cyan-400">{sliderHumidity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="1"
              value={sliderHumidity}
              onChange={(e) => setSliderHumidity(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleApplyCustom}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md transition hover:scale-[1.02]"
            >
              Simulate Stress Test
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
