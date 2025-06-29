import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, List, Grid3X3, Settings, LogOut, Github, Trello, Sun, Moon, Wifi, WifiOff, FolderSync as Sync, MessageCircle, ChevronDown, ChevronRight, Home } from 'lucide-react';
import Logo from '../components/Logo';
import TaskCard from '../components/TaskCard';
import TaskDetailModal from '../components/TaskDetailModal';
import IntegrationModal from '../components/IntegrationModal';
import GitHubRepoSelectionModal from '../components/GitHubRepoSelectionModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { dataService, type Task } from '../services/dataService';

const Dashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showIntegration, setShowIntegration] = useState<'github' | 'trello' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showGitHubRepos, setShowGitHubRepos] = useState(false);
  const [isSync, setIsSync] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [collapsedSources, setCollapsedSources] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'local' | 'github' | 'trello'>('all');
  const [integrationStatus, setIntegrationStatus] = useState<{
    github: { connected: boolean; repoCount?: number };
    trello: { connected: boolean };
  }>({
    github: { connected: false },
    trello: { connected: false },
  });
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  
  // New task form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: '',
  });

  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { tasks, addTask, updateTask, deleteTask, syncTasks, isLoading, isOnline } = useData();

  useEffect(() => {
    if (user && showSettings) {
      loadIntegrationStatus();
    }
  }, [user, showSettings]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || task.status === filterStatus;
    const matchesCategory = selectedCategory === 'all' || task.source === selectedCategory;
    return matchesSearch && matchesFilter && matchesCategory;
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    await addTask({
      title: newTask.title,
      description: newTask.description,
      status: 'todo',
      priority: newTask.priority,
      source: 'local',
      isMarkdown: false,
      tags: newTask.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    });

    setNewTask({ title: '', description: '', priority: 'medium', tags: '' });
    setShowAddTask(false);
  };

  const handleSync = async () => {
    setIsSync(true);
    await syncTasks();
    setIsSync(false);
  };

  const handleViewTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleUpdateTaskFromModal = async (id: string, updates: Partial<Task>) => {
    await updateTask(id, updates);
    // Update the selected task if it's the one being updated
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ ...selectedTask, ...updates });
    }
  };

  const handlePushToGitHub = async (task: any) => {
    // In a real app, you'd have a modal to select repo
    console.log('Push to GitHub:', task);
    // For demo, just update to github source
    await updateTask(task.id, { source: 'github' });
  };

  const loadIntegrationStatus = async () => {
    if (!user) return;

    try {
      const githubIntegration = await dataService.getIntegration(user.id, 'github');
      const trelloIntegration = await dataService.getIntegration(user.id, 'trello');

      setIntegrationStatus({
        github: {
          connected: !!githubIntegration,
          repoCount: githubIntegration?.connectedRepos?.length || 0,
        },
        trello: {
          connected: !!trelloIntegration,
        },
      });
    } catch (error) {
      console.error('Error loading integration status:', error);
    }
  };

  const handleGitHubIntegration = async () => {
    if (!user) return;

    const githubIntegration = await dataService.getIntegration(user.id, 'github');
    if (githubIntegration) {
      setGithubToken(githubIntegration.token);
      setShowGitHubRepos(true);
      setShowSettings(false);
    } else {
      setShowIntegration('github');
      setShowSettings(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: 'todo' | 'in-progress' | 'done') => {
    e.preventDefault();
    
    if (!draggedTask) return;
    
    const task = tasks.find(t => t.id === draggedTask);
    if (!task || task.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    // Update task status locally
    await updateTask(draggedTask, { status: newStatus });
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const toggleSourceCollapse = (source: string) => {
    const newCollapsed = new Set(collapsedSources);
    if (newCollapsed.has(source)) {
      newCollapsed.delete(source);
    } else {
      newCollapsed.add(source);
    }
    setCollapsedSources(newCollapsed);
  };

  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    done: filteredTasks.filter(task => task.status === 'done'),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex">
      {/* Rest of the component JSX */}
    </div>
  );
};

export default Dashboard;