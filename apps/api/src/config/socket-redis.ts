

import { createClient, type RedisClientType } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

let pubClient: RedisClientType | null = null;
let subClient: RedisClientType | null = null;

/** Adapter type accepted by io.adapter() when using Redis. */
export type SocketRedisAdapter = ReturnType<typeof createAdapter>;

export async function getSocketRedisAdapter(): Promise<SocketRedisAdapter | null> {
  if (!REDIS_HOST || REDIS_HOST === '') {
    return null;
  }

  const url = process.env.REDIS_URL || `redis://${REDIS_HOST}:${REDIS_PORT}`;

  try {
    pubClient = createClient({ url });
    subClient = pubClient.duplicate();

    pubClient.on('error', (err) => {
      console.error('[Socket Redis] Pub client error:', err.message);
    });
    subClient.on('error', (err) => {
      console.error('[Socket Redis] Sub client error:', err.message);
    });

    await Promise.all([pubClient.connect(), subClient.connect()]);

    const adapter = createAdapter(pubClient, subClient);
    console.log('✅ Socket.io Redis adapter attached (multi-instance WebSockets enabled)');
    return adapter;
  } catch (err) {
    console.warn(
      '[Socket Redis] Could not connect – Socket.io will use in-memory adapter (single instance only):',
      err instanceof Error ? err.message : err
    );
    await closeSocketRedisClients();
    return null;
  }
}

/** Close Redis clients used by the Socket adapter (e.g. on shutdown). */
export async function closeSocketRedisClients(): Promise<void> {
  const close = async (c: RedisClientType | null) => {
    if (!c) return;
    try {
      await c.quit();
    } catch (_) {
      // ignore
    }
  };
  await Promise.all([close(pubClient), close(subClient)]);
  pubClient = null;
  subClient = null;
}
