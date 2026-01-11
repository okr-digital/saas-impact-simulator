import React from 'react';
import clsx from 'clsx';

interface InputGroupProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  type?: 'int' | 'float' | 'currency' | 'percent';
  tooltip?: string;
  step?: number;
  min?: number;
  max?: number;
}

export const InputGroup: React.FC<InputGroupProps> = ({ 
  label, value, onChange, type = 'float', tooltip, step, min = 0, max 
}) => {
  
  const displayValue = type === 'percent' ? Math.round(value * 100 * 10) / 10 : value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) val = 0;
    
    if (type === 'percent') {
      onChange(val / 100);
    } else {
      onChange(val);
    }
  };

  return (
    <div className="flex flex-col mb-4">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
        </label>
        {tooltip && (
          <div className="group relative ml-2 flex items-center">
            {/* Fragezeichen Icon */}
            <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-400 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600">
              ?
            </span>
            
            {/* Custom Tooltip Overlay */}
            <div className="pointer-events-none absolute bottom-full right-[-6px] mb-2 w-56 opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-50">
              <div className="relative rounded bg-slate-800 px-3 py-2 text-xs font-medium leading-relaxed text-white shadow-xl">
                {tooltip}
                {/* Kleiner Pfeil nach unten */}
                <div className="absolute bottom-[-4px] right-2 h-2 w-2 rotate-45 bg-slate-800"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={step || (type === 'percent' ? 0.1 : 1)}
          value={displayValue}
          onChange={handleChange}
          className={clsx(
            "w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
            type === 'currency' && "pl-7",
            type === 'percent' && "pr-6"
          )}
        />
        {type === 'currency' && (
          <span className="absolute left-3 top-2 text-slate-400 text-sm">€</span>
        )}
        {type === 'percent' && (
          <span className="absolute right-3 top-2 text-slate-400 text-sm">%</span>
        )}
      </div>
    </div>
  );
};