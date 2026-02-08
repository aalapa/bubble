import {getSupabase} from './supabase';
import database from '../database';
import NetInfo from '@react-native-community/netinfo';

export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'success'
  | 'error'
  | 'offline'
  | 'not_configured';

type SyncListener = (status: SyncStatus, message?: string) => void;

class SyncService {
  private listeners: Set<SyncListener> = new Set();
  private status: SyncStatus = 'idle';
  private syncInProgress = false;

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(status: SyncStatus, message?: string) {
    this.status = status;
    this.listeners.forEach(l => l(status, message));
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  async performSync(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      // Check network
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        this.notify('offline');
        return;
      }

      // Check Supabase config
      const supabase = await getSupabase();
      if (!supabase) {
        this.notify('not_configured');
        return;
      }

      this.notify('syncing');

      // PUSH: local dirty rows → Supabase (order: users → goals → habit_logs)
      await this.pushTable(supabase, 'users');
      await this.pushTable(supabase, 'goals');
      await this.pushTable(supabase, 'habit_logs');

      // PULL: remote rows → local (order: users → goals → habit_logs)
      const lastSyncAt = await database.getSyncMeta('last_sync_at');
      await this.pullTable(supabase, 'users', lastSyncAt);
      await this.pullTable(supabase, 'goals', lastSyncAt);
      await this.pullTable(supabase, 'habit_logs', lastSyncAt);

      // Update last sync timestamp
      await database.setSyncMeta('last_sync_at', new Date().toISOString());

      // Clean up soft-deleted rows that have been synced
      await database.purgeDeletedRows();

      this.notify('success');
    } catch (error: any) {
      console.error('Sync failed:', error);
      this.notify('error', error?.message || 'Unknown error');
    } finally {
      this.syncInProgress = false;
    }
  }

  // ── PUSH ───────────────────────────────────────────────────────────────────

  private async pushTable(supabase: any, table: string): Promise<void> {
    const dirtyRows = await database.getDirtyRows(table);
    if (dirtyRows.length === 0) return;

    // Map SQLite column names to Supabase column names
    const remoteRows = dirtyRows.map(row => this.toRemoteRow(table, row));

    // Batch upsert in groups of 50
    for (let i = 0; i < remoteRows.length; i += 50) {
      const batch = remoteRows.slice(i, i + 50);
      const {error} = await supabase
        .from(table)
        .upsert(batch, {onConflict: 'id'});

      if (error) {
        console.error(`Push error for ${table}:`, error);
        throw error;
      }
    }

    // Clear dirty flags
    for (const row of dirtyRows) {
      await database.clearDirtyFlag(table, row.id);
    }
  }

  private toRemoteRow(table: string, localRow: any): Record<string, any> {
    const base: Record<string, any> = {
      id: localRow.id,
      created_at: localRow.created_at,
      updated_at: localRow.updated_at,
      deleted_at: localRow.is_deleted ? localRow.updated_at : null,
    };

    if (table === 'users') {
      return {
        ...base,
        name: localRow.name,
        photo: localRow.photo,
        pin: localRow.pin,
      };
    } else if (table === 'goals') {
      return {
        ...base,
        user_id: localRow.user_id,
        title: localRow.title,
        color: localRow.color,
        type: localRow.type,
        target_value: localRow.target_value,
        unit: localRow.unit,
        frequency_type: localRow.frequency_type,
        frequency_data: localRow.frequency_data,
      };
    } else {
      // habit_logs
      return {
        ...base,
        goal_id: localRow.goal_id,
        date: localRow.date,
        status: localRow.status,
        value: localRow.value,
      };
    }
  }

  // ── PULL ───────────────────────────────────────────────────────────────────

  private async pullTable(
    supabase: any,
    table: string,
    lastSyncAt: string | null,
  ): Promise<void> {
    let query = supabase.from(table).select('*');

    if (lastSyncAt) {
      query = query.gt('updated_at', lastSyncAt);
    }

    // Paginate: pull up to 1000 at a time
    const {data, error} = await query
      .order('updated_at', {ascending: true})
      .limit(1000);

    if (error) {
      console.error(`Pull error for ${table}:`, error);
      throw error;
    }

    if (!data || data.length === 0) return;

    for (const remoteRow of data) {
      const localRow = this.toLocalRow(table, remoteRow);
      await database.upsertFromRemote(table, localRow);
    }
  }

  private toLocalRow(table: string, remoteRow: any): Record<string, any> {
    const base: Record<string, any> = {
      id: remoteRow.id,
      created_at: remoteRow.created_at,
      updated_at: remoteRow.updated_at,
      is_deleted: remoteRow.deleted_at ? 1 : 0,
      is_dirty: 0,
    };

    if (table === 'users') {
      return {
        ...base,
        name: remoteRow.name,
        photo: remoteRow.photo,
        pin: remoteRow.pin,
      };
    } else if (table === 'goals') {
      return {
        ...base,
        user_id: remoteRow.user_id,
        title: remoteRow.title,
        color: remoteRow.color,
        type: remoteRow.type,
        target_value: remoteRow.target_value,
        unit: remoteRow.unit,
        frequency_type: remoteRow.frequency_type,
        frequency_data: remoteRow.frequency_data,
      };
    } else {
      // habit_logs
      return {
        ...base,
        goal_id: remoteRow.goal_id,
        date: remoteRow.date,
        status: remoteRow.status,
        value: remoteRow.value,
      };
    }
  }
}

export default new SyncService();
