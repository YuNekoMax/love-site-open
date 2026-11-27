import { useEffect, useState } from 'react';
import { getChallenge, login } from '../api';

export default function Login({ onSuccess }) {
  const [challenge, setChallenge] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getChallenge().then(setChallenge).catch(() => {});
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (busy || !challenge) return;
    setBusy(true);
    setError('');
    try {
      await login({ username, password, answer, token: challenge.token });
      onSuccess();
    } catch (err) {
      setError('再想想');
      setAnswer('');
      try {
        setChallenge(await getChallenge());
      } catch (e) { /* ignore */ }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <main className="login-shell">
        <aside className="login-brand">
          <div className="login-mark" aria-hidden="true">日</div>
          <h1>恋爱日记</h1>
        </aside>
        <section className="login-panel">
          <h2>欢迎回来</h2>
          <form onSubmit={submit}>
            <input
              className="login-input"
              placeholder="账户"
              aria-label="账户"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
            />
            <input
              className="login-input"
              type="password"
              placeholder="密码"
              aria-label="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <label className="login-question">
              <span>{challenge ? challenge.question : ''}</span>
              <input
                className="login-input"
                placeholder="答案"
                aria-label="问题答案"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                autoComplete="off"
              />
            </label>
            {error && <p className="login-error">{error}</p>}
            <button className="login-submit" type="submit" disabled={busy || !challenge}>
              {busy ? '…' : '进去'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
