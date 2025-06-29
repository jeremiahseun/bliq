import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface BliqDB extends DBSchema {
  users: {
    key: string;
    value: {
      id: string;
      email: string;
      name: string;
      passwordHash: string;
      createdAt: string;
    };
  };
  tasks: {
    key: string;
    value: {
      id: string;
      userId: string;
      title: string;
      description: string;
      status: 'todo' | 'in-progress' | 'done';
      priority: 'low' | 'medium' | 'high';
      source: 'local' | 'github' | 'trello';
      sourceId?: string;
      isMarkdown: boolean;
      tags: string[];
      createdAt: string;
      updatedAt: string;
    };
  };
  integrations: {
    key: string;
    value: {
      id: string;
      userId: string;
      service: 'github' | 'trello';
      token: string;
      refreshToken?: string;
      expiresAt?: string;
      metadata: any;
      selectedRepos?: Array<{ owner: string; name: string; id: number; full_name: string; }>;
      createdAt: string;
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      userId: string;
      action: 'create' | 'update' | 'delete';
      entityType: 'task';
      entityId: string;
      data: any;
      createdAt: string;
    };
  };
}

class DBService {
  private db: IDBPDatabase<BliqDB> | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<BliqDB>('bliq-db', 1, {
      upgrade(db) {
        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
        }

        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('userId', 'userId');
          taskStore.createIndex('status', 'status');
          taskStore.createIndex('source', 'source');
        }

        // Integrations store
        if (!db.objectStoreNames.contains('integrations')) {
          const integrationStore = db.createObjectStore('integrations', { keyPath: 'id' });
          integrationStore.createIndex('userId', 'userId');
          integrationStore.createIndex('service', 'service');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('userId', 'userId');
        }
      },
    });
  }

  async getUser(id: string) {
    await this.init();
    return this.db!.get('users', id);
  }

  async getAllUsers() {
    await this.init();
    return this.db!.getAll('users');
  }

  async addUser(user: BliqDB['users']['value']) {
    await this.init();
    return this.db!.add('users', user);
  }

  async getTasks(userId: string) {
    await this.init();
    return this.db!.getAllFromIndex('tasks', 'userId', userId);
  }

  async addTask(task: BliqDB['tasks']['value']) {
    await this.init();
    return this.db!.add('tasks', task);
  }

  async updateTask(id: string, updates: Partial<BliqDB['tasks']['value']>) {
    await this.init();
    const existing = await this.db!.get('tasks', id);
    if (existing) {
      const updated = { ...existing, ...updates };
      return this.db!.put('tasks', updated);
    }
  }

  async deleteTask(id: string) {
    await this.init();
    return this.db!.delete('tasks', id);
  }

  async getIntegration(userId: string, service: 'github' | 'trello') {
    await this.init();
    const integrations = await this.db!.getAllFromIndex('integrations', 'userId', userId);
    return integrations.find(i => i.service === service);
  }

  async addIntegration(integration: BliqDB['integrations']['value']) {
    await this.init();
    return this.db!.add('integrations', integration);
  }

  async updateIntegration(id: string, updates: Partial<BliqDB['integrations']['value']>) {
    await this.init();
    const existing = await this.db!.get('integrations', id);
    if (existing) {
      const updated = { ...existing, ...updates };
      return this.db!.put('integrations', updated);
    }
  }

  async addToSyncQueue(item: BliqDB['syncQueue']['value']) {
    await this.init();
    return this.db!.add('syncQueue', item);
  }

  async getSyncQueue(userId: string) {
    await this.init();
    return this.db!.getAllFromIndex('syncQueue', 'userId', userId);
  }

  async clearSyncQueue(userId: string) {
    await this.init();
    const items = await this.getSyncQueue(userId);
    const tx = this.db!.transaction('syncQueue', 'readwrite');
    await Promise.all(items.map(item => tx.store.delete(item.id)));
    await tx.done;
  }
}

export const dbService = new DBService();