import { useCallback, useEffect, useState } from 'react';
import { request } from './api';

export function useApi(path) {
  const [state, setState] = useState({ loading: true, data: null, error: '' });

  const load = useCallback(() => {
    let alive = true;
    setState({ loading: true, data: null, error: '' });
    request(path)
      .then((data) => {
        if (alive) setState({ loading: false, data, error: '' });
      })
      .catch((e) => {
        if (alive) setState({ loading: false, data: null, error: e.message });
      });
    return () => {
      alive = false;
    };
  }, [path]);

  useEffect(load, [load]);

  const refresh = useCallback(() => {
    request(path)
      .then((data) => setState({ loading: false, data, error: '' }))
      .catch(() => {});
  }, [path]);

  return {
    ...state,
    setData: (data) => setState({ loading: false, data, error: '' }),
    reload: load,
    refresh
  };
}
