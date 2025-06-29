import { dbService } from './dbService';

export interface Comment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  source?: 'local' | 'github' | 'trello';
  sourceId?: string;
}

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
  comments: Comment[];
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
  connectedRepos?: Array<{
    id: number;
    name: string;
    owner: string;
    fullName: string;
  }>;
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

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<void> {
    await dbService.updateIntegration(id, updates);
  }

  async getGitHubRepos(token: string): Promise<any[]> {
    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch GitHub repositories');
      }

      return await response.json();
    } catch (error) {
      console.error('GitHub repos fetch error:', error);
      throw error;
    }
  }

  async syncWithGitHub(userId: string, token: string): Promise<void> {
    try {
      const integration = await this.getIntegration(userId, 'github');
      if (!integration?.connectedRepos || integration.connectedRepos.length === 0) {
        return; // No repos selected for sync
      }

      const existingTasks = await this.getTasks(userId);

      for (const repo of integration.connectedRepos) {
        const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}/issues?state=open`, {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) {
          console.warn(`Failed to fetch issues for ${repo.fullName}`);
          continue;
        }

        const issues = await response.json();
        
        for (const issue of issues) {
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
              comments: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            await this.addTask(task);
          }
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
      const boardsResponse = await fetch(`https://api.trello.com/1/members/me/boards?key=${import.meta.env.VITE_TRELLO_API_KEY}&token=${token}`);
      
      if (!boardsResponse.ok) {
        throw new Error('Failed to fetch Trello boards');
      }

      const boards = await boardsResponse.json();
      
      for (const board of boards) {
        // Get cards from board
        const cardsResponse = await fetch(`https://api.trello.com/1/boards/${board.id}/cards?key=${import.meta.env.VITE_TRELLO_API_KEY}&token=${token}`);
        
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
              comments: [],
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

  async updateGitHubIssueStatus(task: Task, token: string, newStatus: 'todo' | 'in-progress' | 'done'): Promise<void> {
    if (!task.sourceId) return;

    try {
      const integration = await this.getIntegration(task.userId, 'github');
      if (!integration?.connectedRepos) return;

      // Find the repo this task belongs to
      const repo = integration.connectedRepos.find(r => {
        // For now, we'll use the first connected repo
        // In a real app, we'd store repo info with each task
        return true;
      });

      if (!repo) return;

      // Update issue state and labels based on status
      const state = newStatus === 'done' ? 'closed' : 'open';
      const labels = task.tags.filter(tag => !['in-progress', 'todo', 'done'].includes(tag));
      
      if (newStatus === 'in-progress') {
        labels.push('in-progress');
      }

      // Update the issue
      const updateResponse = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}/issues/${task.sourceId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state,
          labels,
        }),
      });

      if (!updateResponse.ok) {
        console.warn('Failed to update GitHub issue state');
      }

      // Add a comment about the status change
      const statusMessage = {
        'todo': 'moved back to Todo',
        'in-progress': 'started working on this',
        'done': 'completed this task',
      }[newStatus];

      const commentResponse = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}/issues/${task.sourceId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: `Status updated: ${statusMessage} 🔄`,
        }),
      });

      if (!commentResponse.ok) {
        console.warn('Failed to add comment to GitHub issue');
      }
    } catch (error) {
      console.error('Error updating GitHub issue status:', error);
    }
  }

  async addTrelloCardComment(task: Task, token: string, newStatus: 'todo' | 'in-progress' | 'done'): Promise<void> {
    if (!task.sourceId) return;

    try {
      const statusMessage = {
        'todo': 'moved back to Todo',
        'in-progress': 'started working on this',
        'done': 'completed this task',
      }[newStatus];

      const response = await fetch(`https://api.trello.com/1/cards/${task.sourceId}/actions/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Status updated: ${statusMessage} 🔄`,
          key: import.meta.env.VITE_TRELLO_API_KEY,
          token: token,
        }),
      });

      if (!response.ok) {
        console.warn('Failed to add comment to Trello card');
      }
    } catch (error) {
      console.error('Error adding Trello card comment:', error);
    }
  }
}

export const dataService = new DataService();