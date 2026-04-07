/**
 * OperatingHours — editor de horário de funcionamento da concessionária.
 * Dados salvos como JSONB em dealerships.operating_hours (migration 020).
 */

import { useState } from 'react';
import { Clock } from 'lucide-react';

export type DayKey = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export interface DaySchedule {
  open: string | null;
  close: string | null;
  closed: boolean;
}

export type OperatingHoursData = Record<DayKey, DaySchedule>;

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'lunes',     label: 'Lunes' },
  { key: 'martes',    label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves',    label: 'Jueves' },
  { key: 'viernes',   label: 'Viernes' },
  { key: 'sabado',    label: 'Sábado' },
  { key: 'domingo',   label: 'Domingo' },
];

const DEFAULT_HOURS: OperatingHoursData = {
  lunes:     { open: '08:00', close: '18:00', closed: false },
  martes:    { open: '08:00', close: '18:00', closed: false },
  miercoles: { open: '08:00', close: '18:00', closed: false },
  jueves:    { open: '08:00', close: '18:00', closed: false },
  viernes:   { open: '08:00', close: '18:00', closed: false },
  sabado:    { open: '09:00', close: '13:00', closed: false },
  domingo:   { open: null,    close: null,    closed: true },
};

interface Props {
  value: OperatingHoursData | null;
  onChange: (hours: OperatingHoursData) => void;
}

export function OperatingHours({ value, onChange }: Props) {
  const [hours, setHours] = useState<OperatingHoursData>(value ?? DEFAULT_HOURS);

  const update = (day: DayKey, patch: Partial<DaySchedule>) => {
    const updated = { ...hours, [day]: { ...hours[day], ...patch } };
    setHours(updated);
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-text-secondary" />
        <span className="text-sm font-semibold text-text-secondary">Horario de atención</span>
      </div>

      <div className="space-y-2">
        {DAYS.map(({ key, label }) => {
          const day = hours[key];
          return (
            <div key={key} className="flex items-center gap-3">
              {/* Day label */}
              <span className="text-sm text-text-secondary w-24 shrink-0">{label}</span>

              {/* Closed toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={!day.closed}
                  onChange={(e) => update(key, { closed: !e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-xs text-text-secondary">Abierto</span>
              </label>

              {/* Time inputs */}
              {!day.closed ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={day.open ?? '08:00'}
                    onChange={(e) => update(key, { open: e.target.value })}
                    className="text-xs border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-xs text-text-secondary">a</span>
                  <input
                    type="time"
                    value={day.close ?? '18:00'}
                    onChange={(e) => update(key, { close: e.target.value })}
                    className="text-xs border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ) : (
                <span className="text-xs text-text-secondary/50 italic">Cerrado</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Formata o horário de um dia para exibição pública (ex: "08:00 – 18:00") */
export function formatDayHours(day: DaySchedule): string {
  if (day.closed || !day.open || !day.close) return 'Cerrado';
  return `${day.open} – ${day.close}`;
}
