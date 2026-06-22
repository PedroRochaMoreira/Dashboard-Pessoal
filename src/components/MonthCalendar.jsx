import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toKey } from '../utils/dateKey';
import { taskOccursOn } from '../utils/recurrence';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function MonthCalendar({ tasks, selectedDate, onSelectDate }) {
  const [viewDate, setViewDate] = useState(() => {
    const base = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const todayKey = toKey(new Date());

  const cells = useMemo(() => {
    const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const startOffset = firstOfMonth.getDay(); // 0 = domingo
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - startOffset);

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      return date;
    });
  }, [viewDate]);

  function changeMonth(delta) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="icon-btn" onClick={() => changeMonth(-1)} aria-label="Mês anterior">
          <ChevronLeft size={16} />
        </button>
        <span className="calendar-title">
          {MONTH_NAMES[viewDate.getMonth()]} de {viewDate.getFullYear()}
        </span>
        <button className="icon-btn" onClick={() => changeMonth(1)} aria-label="Próximo mês">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="calendar-grid calendar-weekdays">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((date, i) => {
          const key = toKey(date);
          const inMonth = date.getMonth() === viewDate.getMonth();
          const isToday = key === todayKey;
          const isSelected = key === selectedDate;
          const hasTasks = tasks.some((t) => taskOccursOn(t, key));

          return (
            <button
              key={i}
              className={[
                'calendar-day',
                !inMonth && 'calendar-day-muted',
                isToday && 'calendar-day-today',
                isSelected && 'calendar-day-selected',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(key)}
            >
              {date.getDate()}
              {hasTasks && <span className="calendar-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
