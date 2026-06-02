import { isSupabaseConfigured, supabase } from './db';

// Generate or retrieve a unique client-side device ID to filter out self-broadcasted events
let deviceId = '';
if (typeof window !== 'undefined') {
  deviceId = localStorage.getItem('pd_device_id') || '';
  if (!deviceId) {
    deviceId = Math.random().toString(36).substr(2, 9);
    localStorage.setItem('pd_device_id', deviceId);
  }
}

export interface ActiveStatePayload {
  activePath: string;
  activeItemId: string | null;
  timestamp: number;
  sender: string;
  extra?: any;
}

// Keep a map of active Supabase channels to avoid duplicate subscriptions
const channelMap: { [key: string]: any } = {};

/**
 * Broadcasts the current active route and item (prompt, dare, idea, position)
 * to the partner's device in real time.
 */
export async function publishActiveState(
  coupleId: string,
  path: string,
  itemId: string | null,
  extra?: any
): Promise<void> {
  if (!coupleId) return;

  const payload: ActiveStatePayload = {
    activePath: path,
    activeItemId: itemId,
    timestamp: Date.now(),
    sender: deviceId,
    extra,
  };

  // 1. Sync via localStorage for same-browser multi-tab local testing
  if (typeof window !== 'undefined') {
    localStorage.setItem('pd_shared_active_state', JSON.stringify(payload));
  }

  // 2. Broadcast via Supabase Realtime if configured
  if (isSupabaseConfigured && supabase) {
    try {
      let channel = channelMap[coupleId];
      if (!channel) {
        channel = supabase.channel(`couple_sync_${coupleId}`);
        channel.subscribe();
        channelMap[coupleId] = channel;
      }
      
      await channel.send({
        type: 'broadcast',
        event: 'active_state',
        payload,
      });
    } catch (err) {
      console.warn('Failed to broadcast real-time sync active state:', err);
    }
  }
}

/**
 * Subscribes to the partner's active state changes.
 * Returns an unsubscribe/cleanup function.
 */
export function subscribeToActiveState(
  coupleId: string,
  callback: (data: ActiveStatePayload) => void
): () => void {
  if (!coupleId) return () => {};

  // 1. Setup local Storage Event listener (same browser, other tabs)
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === 'pd_shared_active_state' && e.newValue) {
      try {
        const payload: ActiveStatePayload = JSON.parse(e.newValue);
        // Only process events sent from OTHER devices/tabs
        if (payload.sender !== deviceId) {
          callback(payload);
        }
      } catch (err) {
        console.error('Failed to parse storage sync payload:', err);
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }

  // 2. Setup Supabase Realtime Broadcast listener if configured
  let supabaseCleanup = () => {};
  if (isSupabaseConfigured && supabase) {
    try {
      const channel = supabase.channel(`couple_sync_${coupleId}`);
      
      channel
        .on('broadcast', { event: 'active_state' }, ({ payload }) => {
          if (payload && payload.sender !== deviceId) {
            callback(payload);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channelMap[coupleId] = channel;
          }
        });

      supabaseCleanup = () => {
        channel.unsubscribe();
        delete channelMap[coupleId];
      };
    } catch (err) {
      console.warn('Failed to register Supabase Realtime sync listener:', err);
    }
  }

  // Return full cleanup function
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
    }
    supabaseCleanup();
  };
}
