import { Capacitor } from '@capacitor/core';

const VERCEL_URL = 'https://dashboard-pessoal-theta.vercel.app';

/**
 * Converte data (YYYY-MM-DD) + horário (HH:mm) no formato send_after do OneSignal.
 * Ainda usado pra web/PWA via Vercel API.
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

// ─── OneSignal (somente web/PWA) ────────────────────────────────────────────

function withOneSignal(callback, fallback, timeoutMs = 6000) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) { settled = true; resolve(fallback); }
    }, timeoutMs);
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        const result = await callback(OneSignal);
        if (!settled) { settled = true; clearTimeout(timer); resolve(result); }
      } catch {
        if (!settled) { settled = true; clearTimeout(timer); resolve(fallback); }
      }
    });
  });
}

export function requestNotificationPermission() {
  return withOneSignal(async (OS) => {
    await OS.Notifications.requestPermission();
    return OS.Notifications.permission;
  }, false);
}

export function requestNotificationPermissionSafe(timeoutMs = 6000) {
  return withOneSignal(async (OS) => {
    await OS.Notifications.requestPermission();
    return OS.Notifications.permission;
  }, 'timeout', timeoutMs);
}

export function getNotificationPermission() {
  return withOneSignal((OS) => OS.Notifications.permission, false);
}

export function getOptedIn() {
  return withOneSignal((OS) => Boolean(OS.User.PushSubscription.optedIn), false);
}

export function setOptedIn(enabled) {
  return withOneSignal(async (OS) => {
    if (enabled) await OS.User.PushSubscription.optIn();
    else await OS.User.PushSubscription.optOut();
    return enabled;
  }, 'timeout');
}

// ─── Agendamento de notificações (detecta a plataforma) ─────────────────────

/**
 * Agenda uma notificação.
 *
 * - Nativo (Android/iOS): usa @capacitor/local-notifications.
 *   Funciona mesmo com o app 100% fechado, sem servidor, sem FCM.
 *   O Android AlarmManager fica responsável por disparar no horário certo.
 *
 * - Web/PWA: chama a Vercel API (que usa FCM).
 *
 * @param {string} title       - Título da notificação
 * @param {string} message     - Corpo da notificação
 * @param {string} sendAfter   - Horário no formato OneSignal (usado só no web)
 * @param {Date}   at          - Objeto Date com o horário exato (usado no nativo)
 * @param {string} userId      - UID do Firebase (usado só no web)
 */

  export async function scheduleTaskNotification({ title, message, sendAfter, at, userId }) {
  if (isElectron()) {
    const scheduledAt = at instanceof Date ? at : new Date(sendAfter);
    scheduleElectronNotification({ title, message, at: scheduledAt });
    return 'electron';
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      // Usa o Date direto se veio, senão tenta parsear o sendAfter
      const scheduledAt = at instanceof Date ? at : new Date(sendAfter);

      if (isNaN(scheduledAt.getTime())) {
        console.error('Data inválida para notificação:', sendAfter);
        return null;
      }

      // ID numérico obrigatório pelo LocalNotifications
      const id = Math.floor(Math.random() * 2000000000);
      const soundPref = localStorage.getItem('painelpp-notif-sound') || 'default';

      await LocalNotifications.schedule({
        notifications: [{
          title,
          body: message || title,
          id,
          schedule: { at: scheduledAt, allowWhileIdle: true },
          channelId: 'painel-pp-v3',
          sound: soundPref,
        }],
      });

      console.log('Notificação local agendada, id:', id, 'para:', scheduledAt.toLocaleString(), 'som:', soundPref);
      return String(id);
    } catch (err) {
      console.error('Erro ao agendar notificação local:', err);
      return null;
    }
  }

  // Web/PWA → Vercel API
  if (!userId) return null;
  try {
    const res = await fetch(`${VERCEL_URL}/api/schedule-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message, sendAfter, userId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id || null;
  } catch {
    return null;
  }
}

/**
 * Agenda uma notificação de TESTE pra daqui 8 segundos, usando o mesmo
 * caminho de código da notificação real (mesmo canal, mesmo som escolhido).
 * Serve pra testar rápido sem precisar criar tarefa na Agenda.
 */
export async function scheduleTestNotification() {
  if (!Capacitor.isNativePlatform()) return null;
  const testDate = new Date(Date.now() + 8000);
  return scheduleTaskNotification({
    title: 'Teste de som 🔔',
    message: 'Se você ouviu isso, o som está funcionando!',
    at: testDate,
  });
}

// ─── Electron (desktop) ──────────────────────────────────────────────────

function isElectron() {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron;
}

export function scheduleElectronNotification({ title, message, at }) {
  if (!isElectron()) return null;
  const delay = at.getTime() - Date.now();
  if (delay <= 0) return null;
  const timerId = setTimeout(() => {
    window.electronAPI.showNotification(title, message);
  }, delay);
  return timerId;
}

export async function cancelTaskNotification(notificationId) {
  if (!notificationId) return;

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({
        notifications: [{ id: parseInt(notificationId) }],
      });
    } catch {
      // ignora silenciosamente
    }
    return;
  }

  // Web/PWA → Vercel API
  try {
    await fetch(`${VERCEL_URL}/api/cancel-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId }),
    });
  } catch {
    // ignora silenciosamente
  }
}