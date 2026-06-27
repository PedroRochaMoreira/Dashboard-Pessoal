import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Wallet, BookOpen, Check, ArrowRight, Flame } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useStudyStreak } from '../hooks/useStudyStreak';
import { toKey } from '../utils/dateKey';
import { taskOccursOn, isTaskDoneOn, WEEKDAY_LONG } from '../utils/recurrence';
import { isInMonthOffset } from '../utils/monthCompare';
import { tagColor } from '../utils/tagColor';
import { toggleTaskDone } from '../utils/taskActions';

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatToday() {
  const date = new Date();
  return `${WEEKDAY_LONG[date.getDay()]}, ${date.getDate()} de ${date.toLocaleDateString('pt-BR', { month: 'long' })}`;
}

export default function Home() {
  const { user } = useAuth();
  const todayKey = toKey(new Date());

  const { items: tasks, updateItem: updateTask } = useFirestoreCollection(user.uid, 'tasks');
  const { items: transactions } = useFirestoreCollection(user.uid, 'transactions');
  const { items: subjects } = useFirestoreCollection(user.uid, 'subjects');
  const { preferences } = useUserPreferences(user.uid);
  const { streak } = useStudyStreak(user.uid);

  const todayTasks = useMemo(
    () =>
      tasks
        .filter((t) => taskOccursOn(t, todayKey))
        .sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    [tasks, todayKey]
  );
  const pendingCount = todayTasks.filter((t) => !isTaskDoneOn(t, todayKey)).length;

  const saldo = transactions.reduce((acc, t) => acc + (t.type === 'entrada' ? t.value : -t.value), 0);
  const monthSaidas = transactions
    .filter((t) => t.type === 'saida' && isInMonthOffset(t.date, 0))
    .reduce((a, t) => a + t.value, 0);
  const budget = preferences.monthlyBudget || 0;

  const topSubject = useMemo(
    () => subjects.slice().sort((a, b) => (b.loggedMinutes || 0) - (a.loggedMinutes || 0))[0],
    [subjects]
  );

  const firstName = user.displayName ? user.displayName.split(' ')[0] : '';

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <span className="page-comment" style={{ textTransform: 'capitalize' }}>
            {formatToday()}
          </span>
          <h2 className="page-title">
            {greeting()}{firstName ? `, ${firstName}` : ''}
          </h2>
        </div>
      </div>

      {/* Agenda de hoje */}
      <div className="card accent-agenda" style={{ marginBottom: 16 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="page-icon-badge agenda">
            <Calendar size={16} />
          </div>
          <span className="settings-section-title">Agenda de hoje</span>
        </div>

        <div className="list">
          {todayTasks.length === 0 && <div className="empty">Nada marcado para hoje.</div>}
          {todayTasks.map((t) => {
            const done = isTaskDoneOn(t, todayKey);
            return (
              <div className="item" key={t.id}>
                <button
                  className={`check-btn ${done ? 'done' : ''}`}
                  onClick={() => toggleTaskDone(t, todayKey, updateTask)}
                  aria-label={done ? 'Marcar como pendente' : 'Marcar como concluída'}
                >
                  {done && <Check size={12} />}
                </button>
                <span className="item-time">{t.time}</span>
                <div className="item-body">
                  <div className={`item-title ${done ? 'done' : ''}`}>{t.title}</div>
                  <span className="tag-chip" style={{ color: tagColor(t.tag), backgroundColor: `${tagColor(t.tag)}26` }}>
                    {t.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="settings-actions" style={{ justifyContent: 'space-between', width: '100%' }}>
          <span className="item-tag" style={{ margin: 0 }}>
            {pendingCount} pendente{pendingCount !== 1 ? 's' : ''} hoje
          </span>
          <Link to="/agenda" className="text-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Ver agenda completa <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Financeiro */}
      <div className="card accent-financeiro" style={{ marginBottom: 16 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="page-icon-badge financeiro">
            <Wallet size={16} />
          </div>
          <span className="settings-section-title">Financeiro</span>
        </div>

        <div className="saldo-box">
          <span className="saldo-label">Saldo atual</span>
          <span className={`saldo-value ${saldo >= 0 ? 'pos' : 'neg'}`}>
            R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {budget > 0 && (
          <div className="budget-bar-track">
            <div
              className={`budget-bar-fill ${monthSaidas > budget ? 'over-budget' : ''}`}
              style={{ width: `${Math.min(100, (monthSaidas / budget) * 100)}%` }}
            />
          </div>
        )}
        {budget > 0 && (
          <span className="item-tag" style={{ margin: 0 }}>
            R$ {monthSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} gastos este mês
          </span>
        )}

        <div className="settings-actions" style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Link to="/financeiro" className="text-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Ver financeiro <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Estudos */}
      <div className="card accent-estudos">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="page-icon-badge estudos">
            <BookOpen size={16} />
          </div>
          <span className="settings-section-title">Estudos</span>
        </div>

        {streak > 0 && (
          <div className="streak-badge">
            <Flame size={14} color="var(--accent-estudos)" />
            {streak} dia{streak !== 1 ? 's' : ''} seguido{streak !== 1 ? 's' : ''} estudando
          </div>
        )}

        {topSubject ? (
          <span className="item-tag" style={{ margin: 0 }}>
            Matéria mais estudada: <strong style={{ color: 'var(--text)' }}>{topSubject.name}</strong>
          </span>
        ) : (
          <div className="empty">Nenhuma matéria cadastrada ainda.</div>
        )}

        <div className="settings-actions" style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Link to="/estudos" className="text-btn" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Ver estudos <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </main>
  );
}
