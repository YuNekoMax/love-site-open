import { useEffect, useRef, useState } from 'react';
import { getAuthConfig, getChallenge, login } from '../api';

export default function Login({ onSuccess }) {
  const [config, setConfig] = useState({ turnstileSiteKey: '' });
  const [challenge, setChallenge] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [answer, setAnswer] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const widgetEl = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    getAuthConfig().then(setConfig).catch(() => {});
    getChallenge().then(setChallenge).catch(() => {});
  }, []);

  useEffect(() => {
    if (!config.turnstileSiteKey || !widgetEl.current) return;
    let cancelled = false;

    function render() {
      if (cancelled || !window.turnstile || !widgetEl.current) return;
      if (widgetId.current) {
        try { window.turnstile.remove(widgetId.current); } catch (e) { /* ignore */ }
      }
      widgetId.current = window.turnstile.render(widgetEl.current, {
        sitekey: config.turnstileSiteKey,
        theme: 'auto',
        callback: (token) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => setTurnstileToken('')
      });
    }

    if (window.turnstile) {
      render();
    } else {
      let script = document.querySelector('script[data-turnstile]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.turnstile = '1';
        document.head.appendChild(script);
      }
      script.addEventListener('load', render);
    }

    return () => { cancelled = true; };
  }, [config.turnstileSiteKey]);

  async function submit(e) {
    e.preventDefault();
    if (busy || !challenge) return;
    setBusy(true);
    setError('');
    try {
      await login({ username, password, answer, token: challenge.token, turnstileToken });
      onSuccess();
    } catch (err) {
      setError('再想想');
      setAnswer('');
      try {
        setChallenge(await getChallenge());
      } catch (e) { /* ignore */ }
      if (window.turnstile && widgetId.current) {
        try { window.turnstile.reset(widgetId.current); } catch (e) { /* ignore */ }
      }
      setTurnstileToken('');
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
          <p>把平常的日子收起来，<br />偶尔翻一翻。</p>
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
            {config.turnstileSiteKey && <div className="login-turnstile" ref={widgetEl} />}
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
