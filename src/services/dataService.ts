import { dbService } from './dbService';

export interface Task {
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
}

export interface Integration {
  id: string;
  userId: string;
  service: 'github' | 'trello';
  token: string;
  refreshToken?: string;
  expiresAt?: string;
  metadata: any;
  createdAt: string;
}

class DataService {
  async getTasks(userId: string): Promise<Task[]> {
    return await dbService.getTasks(userId);
  }

  async addTask(task: Task): Promise<void> {
    await dbService.addTask(task);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await dbService.updateTask(id, updates);
  }

  async deleteTask(id: string): Promise<void> {
    await dbService.deleteTask(id);
  }

  async getIntegration(userId: string, service: 'github' | 'trello'): Promise<Integration | undefined> {
    return await dbService.getIntegration(userId, service);
  }

  async addIntegration(integration: Integration): Promise<void> {
    await dbService.addIntegration(integration);
  }

  async syncWithGitHub(userId: string, token: string): Promise<void> {
    try {
      const response = await fetch('https://api.github.com/issues?filter=assigned&state=open', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch GitHub issues');
      }

      const issues = await response.json();
      
      for (const issue of issues) {
        const existingTasks = await this.getTasks(userId);
        const existingTask = existingTasks.find(t => t.sourceId === issue.id.toString() && t.source === 'github');
        
        if (!existingTask) {
          const task: Task = {
            id: crypto.randomUUID(),
            userId,
            title: issue.title,
            description: issue.body || '',
            status: 'todo',
            priority: issue.labels.some((l: any) => l.name.includes('high')) ? 'high' : 'medium',
            source: 'github',
            sourceId: issue.id.toString(),
            isMarkdown: true,
            tags: issue.labels.map((l: any) => l.name),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          await this.addTask(task);
        }
      }
    } catch (error) {
      console.error('GitHub sync error:', error);
      throw error;
    }
  }

  async syncWithTrello(userId: string, token: string): Promise<void> {
    try {
      // Get user's boards
      const boardsResponse = await fetch(`https://api.trello.com/1/members/me/boards?key=${process.env.TRELLO_API_KEY}&token=${token}`);
      
      if (!boardsResponse.ok) {
        throw new Error('Failed to fetch Trello boards');
      }

      const boards = await boardsResponse.json();
      
      for (const board of boards) {
        // Get cards from board
        const cardsResponse = await fetch(`https://api.trello.com/1/boards/${board.id}/cards?key=${process.env.TRELLO_API_KEY}&token=${token}`);
        
        if (!cardsResponse.ok) continue;
        
        const cards = await cardsResponse.json();
        
        for (const card of cards) {
          const existingTasks = await this.getTasks(userId);
          const existingTask = existingTasks.find(t => t.sourceId === card.id && t.source === 'trello');
          
          if (!existingTask) {
            const task: Task = {
              id: crypto.randomUUID(),
              userId,
              title: card.name,
              description: card.desc || '',
              status: card.closed ? 'done' : 'todo',
              priority: 'medium',
              source: 'trello',
              sourceId: card.id,
              isMarkdown: false,
              tags: card.labels.map((l: any) => l.name).filter(Boolean),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            await this.addTask(task);
          }
        }
      }
    } catch (error) {
      console.error('Trello sync error:', error);
      throw error;
    }
  }

  async pushTaskToGitHub(task: Task, token: string, repoOwner: string, repoName: string): Promise<void> {
    try {
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: task.title,
          body: task.description,
          labels: task.tags,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create GitHub issue');
      }

      const issue = await response.json();
      
      // Update task with GitHub source info
      await this.updateTask(task.id, {
        source: 'github',
        sourceId: issue.id.toString(),
      });
    } catch (error) {
      console.error('GitHub create issue error:', error);
      throw error;
    }
  }
}

export const dataService = new DataService();