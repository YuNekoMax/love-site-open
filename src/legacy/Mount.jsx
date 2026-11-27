import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import css from '../legacy.css?inline';

export default function LegacyMount({ children }) {
  const hostRef = useRef(null);
  const [root, setRoot] = useState(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    if (!shadow.querySelector('style[data-legacy]')) {
      const style = document.createElement('style');
      style.setAttribute('data-legacy', '');
      style.textContent = css;
      shadow.appendChild(style);
    }
    let mount = shadow.querySelector('[data-legacy-root]');
    if (!mount) {
      mount = document.createElement('div');
      mount.setAttribute('data-legacy-root', '');
      shadow.appendChild(mount);
    }
    setRoot(mount);
  }, []);

  return (
    <div ref={hostRef} className="legacy-host">
      {root ? createPortal(children, root) : null}
    </div>
  );
}
