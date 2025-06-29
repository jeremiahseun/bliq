import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, List, Grid3X3, Settings, LogOut, Github, Trello, Sun, Moon, Wifi, WifiOff, FolderSync as Sync } from 'lucide-react';
import Logo from '../components/Logo';
import TaskCard from '../components/TaskCard';
import IntegrationModal from '../components/IntegrationModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

const Dashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showIntegration, setShowIntegration] = useState<'github' | 'trello' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isSync, setIsSync] = useState(false);
  
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

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesFilter;
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

  const handlePushToGitHub = async (task: any) => {
    // Get GitHub integration
    const githubIntegration = await dataService.getIntegration(user!.id, 'github');
    if (!githubIntegration?.selectedRepos || githubIntegration.selectedRepos.length === 0) {
      alert('Please connect GitHub and select repositories first');
      return;
    }

    // For demo, use the first selected repository
    const repo = githubIntegration.selectedRepos[0];
    try {
      await dataService.pushTaskToGitHub(task, githubIntegration.token, repo.owner, repo.name);
      alert(`Task pushed to ${repo.full_name} successfully!`);
    } catch (error) {
      console.error('Error pushing to GitHub:', error);
      alert('Failed to push task to GitHub. Please check your permissions.');
    }
  };

  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    done: filteredTasks.filter(task => task.status === 'done'),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Top Bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Logo size="sm" />
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg w-80 focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Online/Offline indicator */}
              <div className="flex items-center gap-2 text-sm">
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 dark:text-red-400">Offline</span>
                  </>
                )}
              </div>

              {/* Sync button */}
              <button
                onClick={handleSync}
                disabled={!isOnline || isSync}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                title="Sync with integrations"
              >
                <Sync className={`w-4 h-4 ${isSync ? 'animate-spin' : ''}`} />
              </button>

              {/* View mode toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-gray-600 shadow-sm' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'kanban' 
                      ? 'bg-white dark:bg-gray-600 shadow-sm' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* User menu */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-red-500"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Settings dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-16 right-6 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Integrations</h3>
            </div>
            <div className="p-2">
              <button
                onClick={() => setShowIntegration('github')}
                className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Github className="w-5 h-5" />
                <span>Connect GitHub</span>
              </button>
              <button
                onClick={() => setShowIntegration('trello')}
                className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Trello className="w-5 h-5" />
                <span>Connect Trello</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Filters and Add Task */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="all">All Tasks</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filteredTasks.length} tasks
              </span>
            </div>

            <button
              onClick={() => setShowAddTask(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          {/* Tasks Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading tasks...</div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No tasks found</p>
                  <button
                    onClick={() => setShowAddTask(true)}
                    className="btn-primary"
                  >
                    Create your first task
                  </button>
                </div>
              ) : (
                filteredTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                    onPushToGitHub={handlePushToGitHub}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['todo', 'in-progress', 'done'] as const).map(status => (
                <div key={status} className="space-y-4">
                  <h2 className="font-semibold text-gray-900 dark:text-white capitalize flex items-center gap-2">
                    {status.replace('-', ' ')}
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                      {tasksByStatus[status].length}
                    </span>
                  </h2>
                  
                  <div className="space-y-3">
                    {tasksByStatus[status].map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onUpdate={updateTask}
                        onDelete={deleteTask}
                        onPushToGitHub={handlePushToGitHub}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Add New Task</h2>
              
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="input"
                    placeholder="Enter task title..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    className="input min-h-[100px] resize-y"
                    placeholder="Enter task description..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newTask.tags}
                    onChange={(e) => setNewTask(prev => ({ ...prev, tags: e.target.value }))}
                    className="input"
                    placeholder="bug, feature, urgent..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Add Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTask(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Integration Modals */}
      {showIntegration && (
        <IntegrationModal
          isOpen={true}
          onClose={() => {
            setShowIntegration(null);
            setShowSettings(false);
          }}
          service={showIntegration}
          onSuccess={() => {
            console.log(`${showIntegration} integration successful`);
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;