/**
 * Converte uma data (YYYY-MM-DD) + horário (HH:mm) no formato que a
 * API do OneSignal espera pro campo send_after, já considerando o
 * fuso horário local de quem está usando o app.
 */
export function toOneSignalSendAfter(dateKey, time) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const local = new Date(year, month - 1, day, hour, minute, 0);

  const offsetMin = -local.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const pad = (n) => String(n).padStart(2, '0');

  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:00 GMT${sign}${pad(Math.floor(abs / 60))}${pad(abs % 60)}`;
}

export function requestNotificationPermission() {
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.Notifications.requestPermission();
        resolve(OneSignal.Notifications.permission);
      } catch {
        resolve(false);
      }
    });
  });
}

export function getNotificationPermission() {
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      resolve(OneSignal.Notifications.permission);
    });
  });
}

export async function scheduleTaskNotification({ title, message, sendAfter }) {
  const res = await fetch('/api/schedule-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, message, sendAfter }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id || null;
}

export async function cancelTaskNotification(notificationId) {
  if (!notificationId) return;
  await fetch('/api/cancel-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationId }),
  }).catch(() => {});
}
