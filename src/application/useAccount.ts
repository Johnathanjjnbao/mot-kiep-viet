import { useEffect, useRef, useState } from 'react';
import { type Session } from '@supabase/supabase-js';
import { cloudConfig, createAuthProvider, scopedDataClient } from '../cloud/auth';
import { AccountRepository } from '../cloud/account';
import type { SyncStatus } from '../cloud/contracts';
function configuration() {
  try {
    return { config: cloudConfig(import.meta.env), error: '' };
  } catch {
    return {
      config: null,
      error: 'Chưa bật được tài khoản. Bạn vẫn chơi và lưu trên thiết bị bình thường.',
    };
  }
}
const settings = configuration(),
  provider = settings.config ? createAuthProvider(settings.config) : null;
export function useAccount() {
  const [account, setAccount] = useState<AccountRepository | null>(null),
    [email, setEmail] = useState(''),
    [error, setError] = useState(settings.error),
    [loading, setLoading] = useState(Boolean(provider)),
    [status, setStatus] = useState<SyncStatus>('local');
  const current = useRef<AccountRepository | null>(null);
  const credentials = useRef<{ userId: string; token: string } | null>(null);
  useEffect(() => {
    if (!provider || !settings.config) return;
    const config = settings.config;
    let alive = true,
      sequence = 0;
    const adopt = async (session: Session | null) => {
      const generation = ++sequence;
      if (!session) {
        if (credentials.current) credentials.current.token = '';
        credentials.current = null;
        current.current?.close();
        current.current = null;
        if (alive) {
          setAccount(null);
          setEmail('');
          setLoading(false);
        }
        return;
      }
      if (current.current?.userId === session.user.id) {
        if (credentials.current) credentials.current.token = session.access_token;
        if (alive) setLoading(false);
        return;
      }
      current.current?.close();
      if (credentials.current) credentials.current.token = '';
      credentials.current = null;
      current.current = null;
      if (alive) {
        setAccount(null);
        setEmail('');
        setLoading(true);
      }
      const marker = `mkv-invited:${config.url}:${session.user.id}`;
      try {
        let invited = false;
        try {
          invited = await provider.isInvited();
          if (invited) localStorage.setItem(marker, 'true');
        } catch {
          invited = localStorage.getItem(marker) === 'true';
        }
        if (!alive || sequence !== generation) return;
        if (!invited)
          throw new Error(
            'Tài khoản chưa được cấp quyền chơi đám mây. Hãy liên hệ chủ dự án để cấp quyền.',
          );
        const bound = { userId: session.user.id, token: session.access_token };
        credentials.current = bound;
        // Each account owns its token source: an old request can never adopt the next account's JWT.
        const dataClient = scopedDataClient(config, () => bound.token);
        const repository = new AccountRepository(dataClient, config.url, session.user.id, (s) => {
          if (alive && current.current === repository) setStatus(s);
        });
        current.current = repository;
        setAccount(repository);
        setEmail(session.user.email ?? 'Tài khoản cá nhân');
        setError('');
      } catch (e) {
        if (alive && sequence === generation)
          setError(e instanceof Error ? e.message : 'Chưa mở được tài khoản.');
      } finally {
        if (alive && sequence === generation) setLoading(false);
      }
    };
    const listener = provider.client.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        if (alive) void adopt(session);
      });
    });
    void provider.client.auth.getSession().then(({ data, error }) => {
      if (alive) {
        if (error) {
          setError(
            'Phiên đăng nhập chưa khôi phục được. Bạn có thể chơi trên thiết bị hoặc đăng nhập lại.',
          );
          setLoading(false);
        } else void adopt(data.session);
      }
    });
    return () => {
      alive = false;
      sequence++;
      current.current?.close();
      if (credentials.current) credentials.current.token = '';
      credentials.current = null;
      current.current = null;
      listener.data.subscription.unsubscribe();
    };
  }, []);
  return { account, email, error, setError, loading, status, provider };
}
