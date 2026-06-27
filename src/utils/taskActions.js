import { cancelTaskNotification } from './notifications';

/**
 * Marca/desmarca uma tarefa como concluída numa data específica.
 * Pra tarefas recorrentes, guarda isso por ocorrência (completedDates).
 * Se a tarefa concluída tinha um lembrete agendado pra essa data, ele
 * é cancelado — não faz sentido notificar algo que já foi feito.
 */
export async function toggleTaskDone(task, dateKey, updateItem) {
  if (task.recurrence) {
    const current = task.completedDates || [];
    const willBeDone = !current.includes(dateKey);
    const next = willBeDone
      ? [...current, dateKey]
      : current.filter((d) => d !== dateKey);

    const notifIds = { ...(task.notificationIds || {}) };
    if (willBeDone && notifIds[dateKey]) {
      await cancelTaskNotification(notifIds[dateKey]);
      delete notifIds[dateKey];
    }
    await updateItem(task.id, { completedDates: next, notificationIds: notifIds });
  } else {
    const nowDone = !task.done;
    if (nowDone && task.notificationId) {
      await cancelTaskNotification(task.notificationId);
    }
    await updateItem(task.id, { done: nowDone });
  }
}
