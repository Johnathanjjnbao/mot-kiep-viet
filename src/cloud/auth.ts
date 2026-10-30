import { createClient, type SupabaseClient } from '@supabase/supabase-js';
export interface CloudConfig {
  url: string;
  publishableKey: string;
}
export function scopedDataClient(config: CloudConfig, token: () => string) {
  return createClient(config.url, config.publishableKey, {
    accessToken: async () => token(),
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
export function cloudConfig(env: Record<string, unknown>): CloudConfig | null {
  if (env.VITE_CLOUD_ENABLED !== 'true') return null;
  const url = String(env.VITE_SUPABASE_URL ?? ''),
    publishableKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '');
  const parsed = new URL(url);
  if (
    parsed.protocol !== 'https:' ||
    !parsed.hostname.endsWith('.supabase.co') ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)
  )
    throw new Error('Cấu hình đám mây chưa hợp lệ. Bạn vẫn có thể chơi không đăng nhập.');
  return { url: parsed.origin, publishableKey };
}
export function createAuthProvider(config: CloudConfig) {
  const client = createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: `mkv-auth:${new URL(config.url).hostname}`,
    },
  });
  return new AuthProvider(client);
}
export class AuthProvider {
  constructor(readonly client: SupabaseClient) {}
  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error)
      throw new Error('Không đăng nhập được. Kiểm tra thông tin hoặc thử lại khi có mạng.');
    return data.session;
  }
  async setPassword(password: string) {
    if (password.length < 12) throw new Error('Dùng mật khẩu ít nhất 12 ký tự.');
    const { error } = await this.client.auth.updateUser({ password });
    if (error) throw new Error('Chưa đổi được mật khẩu; liên kết có thể đã hết hạn.');
  }
  async signOut() {
    const { error } = await this.client.auth.signOut({ scope: 'local' });
    if (error) throw new Error('Chưa đăng xuất được. Hãy thử lại trước khi dùng chung thiết bị.');
  }
  async isInvited() {
    const { data, error } = await this.client.rpc('mkv_invited');
    if (error) throw new Error('Chưa kiểm tra được quyền tài khoản.');
    return data === true;
  }
}
