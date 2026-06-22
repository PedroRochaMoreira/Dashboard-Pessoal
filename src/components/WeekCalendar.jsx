import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toKey } from '../utils/dateKey';
import { taskOccursOn } from '../utils/recurrence';

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export default function WeekCalendar({ tasks, selectedDate, onSelectDate }) {
  const [anchor, setAnchor] = useState(() => new Date(selectedDate + 'T00:00:00'));

  const todayKey = toKey(new Date());

  const weekStart = new Date(anchor);
  weekStart.setDate(anchor.getDate() - anchor.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  function changeWeek(delta) {
    setAnchor((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta * 7);
      return next;
    });
  }

  const rangeLabel = `${days[0].getDate()} – ${days[6].getDate()} de ${days[6].toLocaleDateString('pt-BR', { month: 'long' })}`;

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="icon-btn" onClick={() => changeWeek(-1)} aria-label="Semana anterior">
          <ChevronLeft size={16} />
        </button>
        <span className="calendar-title">{rangeLabel}</span>
        <button className="icon-btn" onClick={() => changeWeek(1)} aria-label="Próxima semana">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="week-grid">
        {days.map((date, i) => {
          const key = toKey(date);
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;
          const hasTasks = tasks.some((t) => taskOccursOn(t, key));

          return (
            <button
              key={i}
              className={[
                'week-day',
                isToday && 'calendar-day-today',
                isSelected && 'calendar-day-selected',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(key)}
            >
              <span className="week-day-name">{WEEKDAY_SHORT[date.getDay()]}</span>
              <span className="week-day-num">{date.getDate()}</span>
              {hasTasks && <span className="calendar-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
