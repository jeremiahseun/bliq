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
  selectedRepos?: Array<{ owner: string; name: string; id: number; full_name: string; }>;
  createdAt: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string;
  html_url: string;
  private: boolean;
  open_issues_count: number;
}

export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  url: string;
  closed: boolean;
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

  async fetchGitHubRepositories(token: string): Promise<GitHubRepo[]> {
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

      const repos = await response.json();
      return repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
        },
        description: repo.description || '',
        html_url: repo.html_url,
        private: repo.private,
        open_issues_count: repo.open_issues_count,
      }));
    } catch (error) {
      console.error('GitHub repositories fetch error:', error);
      throw error;
    }
  }

  async fetchTrelloBoards(token: string): Promise<TrelloBoard[]> {
    try {
      const response = await fetch(`https://api.trello.com/1/members/me/boards?key=${import.meta.env.VITE_TRELLO_API_KEY}&token=${token}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Trello boards');
      }

      const boards = await response.json();
      return boards.map((board: any) => ({
        id: board.id,
        name: board.name,
        desc: board.desc || '',
        url: board.url,
        closed: board.closed,
      }));
    } catch (error) {
      console.error('Trello boards fetch error:', error);
      throw error;
    }
  }

  async syncWithGitHub(userId: string, token: string): Promise<void> {
    try {
      const integration = await this.getIntegration(userId, 'github');
      if (!integration?.selectedRepos || integration.selectedRepos.length === 0) {
        console.log('No repositories selected for GitHub sync');
        return;
      }

      const existingTasks = await this.getTasks(userId);
      
      for (const repo of integration.selectedRepos) {
        try {
          const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.name}/issues?state=open&per_page=100`, {
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          });

          if (!response.ok) {
            console.error(`Failed to fetch issues for ${repo.full_name}`);
            continue;
          }

          const issues = await response.json();
          
          for (const issue of issues) {
            // Skip pull requests (they appear as issues in GitHub API)
            if (issue.pull_request) continue;
            
            const existingTask = existingTasks.find(t => 
              t.sourceId === issue.id.toString() && 
              t.source === 'github'
            );
            
            if (!existingTask) {
              const task: Task = {
                id: crypto.randomUUID(),
                userId,
                title: `[${repo.name}] ${issue.title}`,
                description: issue.body || '',
                status: 'todo',
                priority: issue.labels.some((l: any) => 
                  l.name.toLowerCase().includes('high') || 
                  l.name.toLowerCase().includes('urgent') ||
                  l.name.toLowerCase().includes('critical')
                ) ? 'high' : 
                issue.labels.some((l: any) => 
                  l.name.toLowerCase().includes('low') ||
                  l.name.toLowerCase().includes('minor')
                ) ? 'low' : 'medium',
                source: 'github',
                sourceId: issue.id.toString(),
                isMarkdown: true,
                tags: [
                  repo.name,
                  ...issue.labels.map((l: any) => l.name)
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              
              await this.addTask(task);
            }
          }
        } catch (repoError) {
          console.error(`Error syncing repository ${repo.full_name}:`, repoError);
        }
      }
    } catch (error) {
      console.error('GitHub sync error:', error);
      throw error;
    }
  }

  async syncWithTrello(userId: string, token: string): Promise<void> {
    try {
      const integration = await this.getIntegration(userId, 'trello');
      if (!integration?.selectedRepos || integration.selectedRepos.length === 0) {
        console.log('No boards selected for Trello sync');
        return;
      }

      const existingTasks = await this.getTasks(userId);
      
      for (const board of integration.selectedRepos) {
        try {
          const cardsResponse = await fetch(`https://api.trello.com/1/boards/${board.id}/cards?key=${import.meta.env.VITE_TRELLO_API_KEY}&token=${token}`);
          
          if (!cardsResponse.ok) {
            console.error(`Failed to fetch cards for board ${board.name}`);
            continue;
          }
          
          const cards = await cardsResponse.json();
          
          for (const card of cards) {
            const existingTask = existingTasks.find(t => 
              t.sourceId === card.id && 
              t.source === 'trello'
            );
            
            if (!existingTask) {
              const task: Task = {
                id: crypto.randomUUID(),
                userId,
                title: `[${board.name}] ${card.name}`,
                description: card.desc || '',
                status: card.closed ? 'done' : 'todo',
                priority: 'medium',
                source: 'trello',
                sourceId: card.id,
                isMarkdown: false,
                tags: [
                  board.name,
                  ...card.labels.map((l: any) => l.name).filter(Boolean)
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              
              await this.addTask(task);
            }
          }
        } catch (boardError) {
          console.error(`Error syncing board ${board.name}:`, boardError);
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