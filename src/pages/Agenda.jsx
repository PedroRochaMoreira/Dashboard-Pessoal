import { useEffect, useState } from 'react';
import { Calendar, Check, Plus, Trash2, Search, Repeat, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import MonthCalendar from '../components/MonthCalendar';
import WeekCalendar from '../components/WeekCalendar';
import { toKey } from '../utils/dateKey';
import { taskOccursOn, isTaskDoneOn, weekdayName, WEEKDAY_LONG } from '../utils/recurrence';
import { tagColor } from '../utils/tagColor';
import {
  toOneSignalSendAfter,
  requestNotificationPermission,
  getNotificationPermission,
  scheduleTaskNotification,
  cancelTaskNotification,
} from '../utils/notifications';

function formatSelected(dateKey) {
  const today = toKey(new Date());
  const date = new Date(dateKey + 'T00:00:00');
  const label = `${WEEKDAY_LONG[date.getDay()]}, ${date.getDate()} de ${date.toLocaleDateString('pt-BR', { month: 'long' })}`;
  return dateKey === today ? `Hoje — ${label}` : label;
}

function TagChip({ tag }) {
  const color = tagColor(tag);
  return (
    <span className="tag-chip" style={{ color, backgroundColor: `${color}26` }}>
      {tag}
    </span>
  );
}

export default function Agenda() {
  const { user } = useAuth();
  const { items: tasks, loading, addItem, updateItem, removeItem } = useFirestoreCollection(
    user.uid,
    'tasks'
  );

  const [selectedDate, setSelectedDate] = useState(() => toKey(new Date()));
  const [viewMode, setViewMode] = useState('mes');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTask, setNewTask] = useState({ time: '', title: '', tag: '', repeat: false });
  const [notifPermission, setNotifPermission] = useState(null);

  useEffect(() => {
    getNotificationPermission().then(setNotifPermission);
  }, []);

  async function handleEnableNotifications() {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted);
  }

  const tasksForDay = tasks
    .filter((t) => taskOccursOn(t, selectedDate))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const legacyTasks = tasks.filter((t) => !t.date);

  const query = searchQuery.trim().toLowerCase();
  const searchResults = query
    ? tasks
        .filter((t) => t.date && (t.title.toLowerCase().includes(query) || (t.tag || '').toLowerCase().includes(query)))
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    : [];

  async function handleAdd() {
    if (!newTask.title.trim()) return;
    const base = {
      date: selectedDate,
      time: newTask.time || '--:--',
      title: newTask.title.trim(),
      tag: newTask.tag.trim() || 'Geral',
    };

    if (newTask.repeat) {
      addItem({
        ...base,
        recurrence: { type: 'weekly', weekday: new Date(selectedDate + 'T00:00:00').getDay() },
        completedDates: [],
      });
      setNewTask({ time: '', title: '', tag: '', repeat: false });
      return;
    }

    let notificationId = null;
    const hasRealTime = /^\d{1,2}:\d{2}$/.test(base.time);
    if (hasRealTime && notifPermission) {
      const [h, m] = base.time.split(':').map(Number);
      const target = new Date(selectedDate + 'T00:00:00');
      target.setHours(h, m, 0, 0);
      if (target > new Date()) {
        notificationId = await scheduleTaskNotification({
          title: base.title,
          message: `${base.time} · ${base.tag}`,
          sendAfter: toOneSignalSendAfter(selectedDate, base.time),
        });
      }
    }

    addItem({ ...base, done: false, notificationId });
    setNewTask({ time: '', title: '', tag: '', repeat: false });
  }

  async function toggleDone(task) {
    if (task.recurrence) {
      const current = task.completedDates || [];
      const next = current.includes(selectedDate)
        ? current.filter((d) => d !== selectedDate)
        : [...current, selectedDate];
      updateItem(task.id, { completedDates: next });
    } else {
      const nowDone = !task.done;
      if (nowDone && task.notificationId) {
        await cancelTaskNotification(task.notificationId);
      }
      updateItem(task.id, { done: nowDone });
    }
  }

  async function handleRemove(task) {
    if (task.notificationId) {
      await cancelTaskNotification(task.notificationId);
    }
    removeItem(task.id);
  }

  const pending = tasksForDay.filter((t) => !isTaskDoneOn(t, selectedDate)).length;

  return (
    <main className="page">
      <div className="page-header">
        <div className="page-icon-badge agenda">
          <Calendar size={18} />
        </div>
        <div>
          <span className="page-comment">// agenda</span>
          <h2 className="page-title">Compromissos</h2>
        </div>
      </div>

      {notifPermission === false && (
        <div className="card accent-agenda" style={{ marginBottom: 16 }}>
          <div className="settings-actions" style={{ justifyContent: 'space-between', width: '100%' }}>
            <span className="item-tag" style={{ margin: 0 }}>
              Ative as notificações pra receber lembrete dos seus compromissos, mesmo com o app fechado.
            </span>
            <button className="btn btn-primary" onClick={handleEnableNotifications}>
              Ativar notificações
            </button>
          </div>
        </div>
      )}

      <div className="search-row" style={{ marginBottom: 16 }}>
        <Search size={15} />
        <input
          type="text"
          placeholder="Buscar tarefas por nome ou categoria..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {query ? (
        <div className="card accent-agenda">
          <div className="page-header" style={{ marginBottom: 0 }}>
            <span className="page-comment">// resultados da busca</span>
          </div>
          <div className="list">
            {searchResults.length === 0 && <div className="empty">Nada encontrado.</div>}
            {searchResults.map((t) => (
              <div className="item" key={t.id}>
                {!t.recurrence && (
                  <button
                    className={`check-btn ${t.done ? 'done' : ''}`}
                    onClick={() => toggleDone(t)}
                    aria-label="Marcar como concluída"
                  >
                    {t.done && <Check size={12} />}
                  </button>
                )}
                <div className="item-body">
                  <div className="item-title">
                    {t.recurrence ? (
                      <span className="search-result-date">toda {WEEKDAY_LONG[t.recurrence.weekday]}</span>
                    ) : (
                      <span className="search-result-date">{t.date}</span>
                    )}
                    {t.time !== '--:--' && t.time} {t.title}
                    {t.recurrence && <Repeat size={11} className="recurrence-icon" />}
                    {t.notificationId && <Bell size={11} className="recurrence-icon" />}
                  </div>
                  <TagChip tag={t.tag} />
                </div>
                <button className="del-btn" onClick={() => handleRemove(t)} aria-label="Remover">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="view-toggle" style={{ marginBottom: 16 }}>
            <button className={viewMode === 'mes' ? 'active' : ''} onClick={() => setViewMode('mes')}>
              Mês
            </button>
            <button className={viewMode === 'semana' ? 'active' : ''} onClick={() => setViewMode('semana')}>
              Semana
            </button>
          </div>

          <div className="card accent-agenda">
            {viewMode === 'mes' ? (
              <MonthCalendar tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            ) : (
              <WeekCalendar tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            )}
          </div>

          <div className="card accent-agenda" style={{ marginTop: 16 }}>
            <span className="page-comment" style={{ textTransform: 'capitalize' }}>
              {formatSelected(selectedDate)}
            </span>

            <div className="list">
              {loading && <div className="empty">Carregando...</div>}
              {!loading && tasksForDay.length === 0 && (
                <div className="empty">Nada marcado para este dia. Adicione algo abaixo.</div>
              )}
              {tasksForDay.map((t) => {
                const done = isTaskDoneOn(t, selectedDate);
                return (
                  <div className="item" key={t.id}>
                    <button
                      className={`check-btn ${done ? 'done' : ''}`}
                      onClick={() => toggleDone(t)}
                      aria-label={done ? 'Marcar como pendente' : 'Marcar como concluída'}
                    >
                      {done && <Check size={12} />}
                    </button>
                    <span className="item-time">{t.time}</span>
                    <div className="item-body">
                      <div className={`item-title ${done ? 'done' : ''}`}>
                        {t.title}
                        {t.recurrence && <Repeat size={11} className="recurrence-icon" />}
                        {t.notificationId && <Bell size={11} className="recurrence-icon" />}
                      </div>
                      <TagChip tag={t.tag} />
                    </div>
                    <button className="del-btn" onClick={() => handleRemove(t)} aria-label="Remover">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="add-row">
              <input
                className="w-time"
                type="text"
                placeholder="08:00"
                value={newTask.time}
                onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
              />
              <input
                className="flex-1"
                type="text"
                placeholder="O que precisa fazer?"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <input
                className="w-tag"
                type="text"
                placeholder="categoria"
                value={newTask.tag}
                onChange={(e) => setNewTask({ ...newTask, tag: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button className="add-btn" onClick={handleAdd} aria-label="Adicionar compromisso">
                <Plus size={15} />
              </button>
            </div>

            <label className="repeat-toggle">
              <input
                type="checkbox"
                checked={newTask.repeat}
                onChange={(e) => setNewTask({ ...newTask, repeat: e.target.checked })}
              />
              <Repeat size={13} />
              Repetir toda {weekdayName(selectedDate)}
            </label>
            {newTask.repeat && (
              <span className="item-tag" style={{ margin: 0 }}>
                Tarefas recorrentes ainda não recebem notificação — só as avulsas, por enquanto.
              </span>
            )}
          </div>

          {legacyTasks.length > 0 && (
            <div className="card accent-agenda" style={{ marginTop: 16 }}>
              <span className="page-comment">// criadas antes do calendário — sem data definida</span>
              <div className="list">
                {legacyTasks.map((t) => (
                  <div className="item" key={t.id}>
                    <div className="item-body">
                      <div className="item-title">{t.title}</div>
                      <TagChip tag={t.tag} />
                    </div>
                    <button
                      className="text-btn"
                      onClick={() => updateItem(t.id, { date: toKey(new Date()) })}
                    >
                      Mover p/ hoje
                    </button>
                    <button className="del-btn" onClick={() => handleRemove(t)} aria-label="Remover">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="empty" style={{ marginTop: 14 }}>
            {pending} tarefa{pending !== 1 ? 's' : ''} pendente{pending !== 1 ? 's' : ''} neste dia
          </p>
        </>
      )}
    </main>
  );
}
