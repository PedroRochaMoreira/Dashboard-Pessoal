function daysBetween(dateKeyA, dateKeyB) {
  const a = new Date(dateKeyA + 'T00:00:00');
  const b = new Date(dateKeyB + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

/**
 * Verifica se uma tarefa "acontece" numa determinada data — seja porque
 * a data bate exatamente, seja porque é uma recorrência semanal (mesmo
 * dia da semana) ou de intervalo (a cada N dias) cujo cálculo bate com
 * a data informada.
 */
export function taskOccursOn(task, dateKey) {
  if (!task.date) return false;
  if (task.date === dateKey) return true;

  if (task.recurrence?.type === 'weekly') {
    const day = new Date(dateKey + 'T00:00:00').getDay();
    return day === task.recurrence.weekday && dateKey >= task.date;
  }

  if (task.recurrence?.type === 'interval') {
    if (dateKey < task.date) return false;
    const diff = daysBetween(task.date, dateKey);
    return diff % task.recurrence.days === 0;
  }

  return false;
}

/**
 * Para tarefas recorrentes, cada ocorrência tem seu próprio estado de
 * "concluída" (guardado em completedDates). Para tarefas avulsas, usa
 * o campo done normal.
 */
export function isTaskDoneOn(task, dateKey) {
  if (task.recurrence) {
    return (task.completedDates || []).includes(dateKey);
  }
  return !!task.done;
}

const WEEKDAY_LONG = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
];

export function weekdayName(dateKey) {
  return WEEKDAY_LONG[new Date(dateKey + 'T00:00:00').getDay()];
}

export function recurrenceLabel(task) {
  if (!task.recurrence) return null;
  if (task.recurrence.type === 'weekly') return `toda ${WEEKDAY_LONG[task.recurrence.weekday]}`;
  if (task.recurrence.type === 'interval') return `a cada ${task.recurrence.days} dia${task.recurrence.days !== 1 ? 's' : ''}`;
  return null;
}

/**
 * Calcula as próximas N datas (YYYY-MM-DD) em que uma tarefa recorrente
 * vai acontecer, a partir de hoje (inclusive). Usado pra agendar
 * notificações com antecedência.
 */
export function nextOccurrences(task, count, fromDateKey) {
  const results = [];
  let cursor = fromDateKey;
  let guard = 0;
  while (results.length < count && guard < 3650) {
    guard += 1;
    if (taskOccursOn(task, cursor)) results.push(cursor);
    const next = new Date(cursor + 'T00:00:00');
    next.setDate(next.getDate() + 1);
    cursor = next.toISOString().slice(0, 10);
  }
  return results;
}

export { WEEKDAY_LONG };
