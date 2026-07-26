import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';

function translateError(code) {
  const map = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-not-found': 'Não existe conta com esse e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Já existe uma conta com esse e-mail.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco antes de tentar de novo.',
  };
  return map[code] || 'Algo deu errado. Tente novamente.';
}

export default function Login() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [resetSending, setResetSending] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(translateError(err.code));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setError('');
    setResetMsg('');
    if (!email.trim()) {
      setError('Digite seu e-mail no campo acima primeiro.');
      return;
    }
    setResetSending(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetMsg('Enviamos um link de redefinição para o seu e-mail. Confira também a caixa de spam.');
    } catch (err) {
      setError(translateError(err.code));
    } finally {
      setResetSending(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div>
          <h1 className="auth-title">{mode === 'login' ? 'Entrar' : 'Criar conta'}</h1>
          <p className="auth-sub">
            {mode === 'login'
              ? 'Acesse seu painel pessoal.'
              : 'Seus dados ficam sincronizados entre todos os seus dispositivos.'}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {resetMsg && <span className="settings-success">{resetMsg}</span>}

        <div className="auth-field">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
          />
        </div>

        <div className="auth-field">
          <label htmlFor="password">Senha</label>
          <div className="password-wrap">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {mode === 'login' && (
          <button
            type="button"
            className="auth-toggle"
            style={{ textAlign: 'right', background: 'none', border: 'none', color: 'var(--accent-agenda)', cursor: 'pointer', padding: 0, fontSize: 12 }}
            onClick={handleForgotPassword}
            disabled={resetSending}
          >
            {resetSending ? 'Enviando...' : 'Esqueceu a senha?'}
          </button>
        )}

        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Enviando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>

        <div className="auth-toggle">
          {mode === 'login' ? (
            <>
              Ainda não tem conta?{' '}
              <button type="button" onClick={() => setMode('signup')}>
                Criar uma
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button type="button" onClick={() => setMode('login')}>
                Entrar
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}