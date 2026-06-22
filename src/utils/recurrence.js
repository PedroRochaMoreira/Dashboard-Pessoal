/**
 * Verifica se uma tarefa "acontece" numa determinada data — seja porque
 * a data bate exatamente, seja porque é uma tarefa recorrente semanal
 * cujo dia da semana coincide (e a data é igual ou posterior à data em
 * que a recorrência foi criada).
 */
export function taskOccursOn(task, dateKey) {
  if (!task.date) return false;
  if (task.date === dateKey) return true;
  if (task.recurrence?.type === 'weekly') {
    const day = new Date(dateKey + 'T00:00:00').getDay();
    return day === task.recurrence.weekday && dateKey >= task.date;
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

export { WEEKDAY_LONG };
