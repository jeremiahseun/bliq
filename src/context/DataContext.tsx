import React, { createContext, useContext, useEffect, useState } from 'react';
import { dataService, type Task } from '../services/dataService';
import { useAuth } from './AuthContext';

interface DataContextType {
  tasks: Task[];
  isLoading: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  syncTasks: () => Promise<void>;
  isOnline: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user } = useAuth();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadTasks();
      // Set up sync interval
      const syncInterval = setInterval(syncTasks, 10 * 60 * 1000); // 10 minutes
      return () => clearInterval(syncInterval);
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userTasks = await dataService.getTasks(user.id);
      setTasks(userTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      userId: user.id,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks(prev => [...prev, newTask]);
    await dataService.addTask(newTask);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updatedTask = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updatedTask } : task
    ));

    await dataService.updateTask(id, updatedTask);
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    await dataService.deleteTask(id);
  };

  const syncTasks = async () => {
    if (!user || !isOnline) return;

    try {
      // Sync GitHub issues
      const githubIntegration = await dataService.getIntegration(user.id, 'github');
      if (githubIntegration?.token) {
        await dataService.syncWithGitHub(user.id, githubIntegration.token);
      }

      // Sync Trello cards
      const trelloIntegration = await dataService.getIntegration(user.id, 'trello');
      if (trelloIntegration?.token) {
        await dataService.syncWithTrello(user.id, trelloIntegration.token);
      }

      // Reload tasks after sync
      await loadTasks();
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  return (
    <DataContext.Provider value={{
      tasks,
      isLoading,
      addTask,
      updateTask,
      deleteTask,
      syncTasks,
      isOnline,
    }}>
      {children}
    </DataContext.Provider>
  );
};