import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, List, Grid3X3, Settings, LogOut, Github, Trello, Sun, Moon, Wifi, WifiOff, FolderSync as Sync, MessageCircle, ChevronDown, ChevronRight, Home, Layers, Menu, X } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'local' | 'github' | 'trello'>('all');
  const [collapsedSources, setCollapsedSources] = useState<Set<string>>(new Set());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showIntegration, setShowIntegration] = useState<'github' | 'trello' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showGitHubRepos, setShowGitHubRepos] = useState(false);
  const [isSync, setIsSync] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [githubToken, setGithubToken] = useState('');
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

  const toggleSourceCollapse = (source: string) => {
    const newCollapsed = new Set(collapsedSources);
    if (newCollapsed.has(source)) {
      newCollapsed.delete(source);
    } else {
      newCollapsed.add(source);
    }
    setCollapsedSources(newCollapsed);
  };

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

  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    done: filteredTasks.filter(task => task.status === 'done'),
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'github':
        return <Github className="w-4 h-4" />;
      case 'trello':
        return <Trello className="w-4 h-4" />;
      case 'local':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return tasks.length;
    return tasks.filter(task => task.source === category).length;
  };

  const sidebarCategories = [
    { id: 'all', name: 'All Tasks', icon: Home },
    { id: 'local', name: 'Local', icon: MessageCircle },
    { id: 'github', name: 'GitHub', icon: Github },
    { id: 'trello', name: 'Trello', icon: Trello },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col">
      {/* Sync Loader Overlay */}
      <AnimatePresence>
        {isSync && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-sm w-full mx-4 text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Sync className="w-8 h-8 text-primary-500 animate-spin" />
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  Syncing Tasks
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Fetching your latest tasks from GitHub and Trello...
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 py-4">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="sm" />
              
              {/* Sidebar toggle button */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  <span className="hidden lg:inline text-sm">
                    {isSidebarCollapsed ? 'Expand' : 'Menu'}
                  </span>
                </div>
              </button>
              
              {/* Desktop Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg w-80 focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Online/Offline indicator */}
              <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white px-2">
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400 hidden lg:inline">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 dark:text-red-400 hidden lg:inline">Offline</span>
                  </>
                )}
              </div>

              {/* Sync button */}
              <button
                onClick={handleSync}
                disabled={!isOnline || isSync}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-gray-600 dark:text-gray-300"
                title="Sync with integrations"
              >
                <Sync className={`w-4 h-4 ${isSync ? 'animate-spin' : ''}`} />
                <span className="hidden lg:inline text-sm">Sync</span>
              </button>

              {/* View mode toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors flex items-center gap-1 ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden lg:inline text-sm">List</span>
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-2 rounded transition-colors flex items-center gap-1 ${
                    viewMode === 'kanban' 
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                  title="Kanban view"
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span className="hidden lg:inline text-sm">Board</span>
                </button>
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-300"
                title="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span className="hidden lg:inline text-sm">
                  {theme === 'light' ? 'Dark' : 'Light'}
                </span>
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative flex items-center gap-2 text-gray-600 dark:text-gray-300"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden lg:inline text-sm">Settings</span>
              </button>

              {/* User menu */}
              <div className="flex items-center gap-3 ml-2">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-red-500 flex items-center gap-2"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden">
            {isSearchActive ? (
              /* Mobile Search Mode */
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSearchActive(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-colors text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              /* Mobile Default Mode */
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowMobileMenu(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <Logo size="sm" />
                
                <button
                  onClick={() => setIsSearchActive(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            )}
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
                onClick={handleGitHubIntegration}
                className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Github className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <div className="flex-1">
                  <span className="text-gray-900 dark:text-white">
                    {integrationStatus.github.connected ? 'Manage GitHub' : 'Connect GitHub'}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      integrationStatus.github.connected 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {integrationStatus.github.connected ? 'Connected' : 'Not Connected'}
                    </span>
                    {integrationStatus.github.connected && integrationStatus.github.repoCount! > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {integrationStatus.github.repoCount} repos
                      </span>
                    )}
                  </div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowIntegration('trello');
                  setShowSettings(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Trello className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <span className="text-gray-900 dark:text-white">
                    {integrationStatus.trello.connected ? 'Manage Trello' : 'Connect Trello'}
                  </span>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      integrationStatus.trello.connected 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {integrationStatus.trello.connected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className={`hidden md:flex ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col transition-all duration-300`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`font-semibold text-gray-900 dark:text-white flex items-center gap-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <Layers className="w-5 h-5" />
              {!isSidebarCollapsed && 'Categories'}
            </h2>
          </div>
          
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {sidebarCategories.map((category) => {
                const Icon = category.icon;
                const count = getCategoryCount(category.id);
                const isActive = selectedCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id as any)}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                    title={isSidebarCollapsed ? category.name : ''}
                  >
                    <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                      <Icon className="w-4 h-4" />
                      {!isSidebarCollapsed && <span className="font-medium">{category.name}</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
              onClick={() => setShowMobileMenu(false)}
            >
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "tween", duration: 0.3 }}
                className="bg-white dark:bg-gray-800 w-80 h-full p-6 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between mb-8">
                  <Logo size="sm" />
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>

                {/* User Info */}
                <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>

                {/* Categories */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h3>
                  <div className="space-y-2">
                    {sidebarCategories.map((category) => {
                      const Icon = category.icon;
                      const count = getCategoryCount(category.id);
                      const isActive = selectedCategory === category.id;
                      
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id as any);
                            setShowMobileMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            isActive
                              ? 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                  
                  {/* Online Status */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {isOnline ? (
                      <>
                        <Wifi className="w-5 h-5 text-green-500" />
                        <span className="text-green-600 dark:text-green-400 font-medium">Online</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-5 h-5 text-red-500" />
                        <span className="text-red-600 dark:text-red-400 font-medium">Offline</span>
                      </>
                    )}
                  </div>

                  {/* Sync */}
                  <button
                    onClick={() => {
                      handleSync();
                      setShowMobileMenu(false);
                    }}
                    disabled={!isOnline || isSync}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 text-gray-700 dark:text-gray-300"
                  >
                    <Sync className={`w-5 h-5 ${isSync ? 'animate-spin' : ''}`} />
                    <span className="font-medium">Sync Tasks</span>
                  </button>

                  {/* View Mode */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">View Mode</span>
                    </div>
                    <div className="flex bg-white dark:bg-gray-600 rounded-lg p-1">
                      <button
                        onClick={() => {
                          setViewMode('list');
                          setShowMobileMenu(false);
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 p-2 rounded transition-colors ${
                          viewMode === 'list' 
                            ? 'bg-primary-500 text-white shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-500'
                        }`}
                      >
                        <List className="w-4 h-4" />
                        <span className="text-sm font-medium">List</span>
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('kanban');
                          setShowMobileMenu(false);
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 p-2 rounded transition-colors ${
                          viewMode === 'kanban' 
                            ? 'bg-primary-500 text-white shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-500'
                        }`}
                      >
                        <Grid3X3 className="w-4 h-4" />
                        <span className="text-sm font-medium">Board</span>
                      </button>
                    </div>
                  </div>

                  {/* Theme Toggle */}
                  <button
                    onClick={() => {
                      toggleTheme();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                  >
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    <span className="font-medium">
                      Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
                    </span>
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => {
                      setShowSettings(!showSettings);
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Settings</span>
                  </button>

                  {/* Add Task */}
                  <button
                    onClick={() => {
                      setShowAddTask(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900 hover:bg-primary-100 dark:hover:bg-primary-800 rounded-lg transition-colors text-primary-700 dark:text-primary-300"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Add New Task</span>
                  </button>

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      logout();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors text-red-600 dark:text-red-400"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col pb-16 md:pb-0 min-w-0">
          <div className="p-4 md:p-6 flex-1 overflow-y-auto">
            <div className="w-full max-w-none md:max-w-7xl mx-auto">
              {/* Filters and Add Task */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
                  
                  <div className="hidden sm:block">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm text-gray-900 dark:text-white"
                    >
                      <option value="all">All Tasks</option>
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  
                  <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
                    {filteredTasks.length} tasks
                  </span>
                </div>

                <button
                  onClick={() => setShowAddTask(true)}
                  className="btn-primary flex items-center gap-2 hidden md:flex"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>

              {/* Mobile Filter - Only show on mobile */}
              <div className="sm:hidden mb-6">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm text-gray-900 dark:text-white"
                >
                  <option value="all">All Tasks ({filteredTasks.length})</option>
                  <option value="todo">To Do ({tasksByStatus.todo.length})</option>
                  <option value="in-progress">In Progress ({tasksByStatus['in-progress'].length})</option>
                  <option value="done">Done ({tasksByStatus.done.length})</option>
                </select>
              </div>

              {/* Tasks Content */}
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading tasks...</div>
                </div>
              ) : viewMode === 'list' ? (
                <div>
                  {/* Group by source if not filtering by specific status and showing all categories */}
                  {!['todo', 'in-progress', 'done'].includes(filterStatus) && selectedCategory === 'all' ? (
                    <div className="space-y-8">
                      {['local', 'github', 'trello'].map(source => {
                        const sourceTasks = filteredTasks.filter(task => task.source === source);
                        if (sourceTasks.length === 0) return null;
                        
                        const isCollapsed = collapsedSources.has(source);
                        
                        return (
                          <div key={source} className="space-y-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleSourceCollapse(source)}
                                className="flex items-center gap-2 group"
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                                )}
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize flex items-center gap-2">
                                  {getCategoryIcon(source)}
                                  {source} Tasks
                                </h3>
                              </button>
                              <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-sm">
                                {sourceTasks.length}
                              </span>
                            </div>
                            
                            <AnimatePresence>
                              {!isCollapsed && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="space-y-3"
                                >
                                  {sourceTasks.map(task => (
                                    <TaskCard
                                      key={task.id}
                                      task={task}
                                      onUpdate={updateTask}
                                      onDelete={deleteTask}
                                      onPushToGitHub={handlePushToGitHub}
                                      onViewDetails={handleViewTaskDetails}
                                    />
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
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
                            onViewDetails={handleViewTaskDetails}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
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
                    <div className="flex overflow-x-auto md:grid md:grid-cols-3 md:gap-6 pb-4 snap-x snap-mandatory scroll-smooth -mx-4 md:mx-0">
                      {(['todo', 'in-progress', 'done'] as const).map(status => (
                        <div 
                          key={status} 
                          className={`flex-shrink-0 w-full sm:w-1/2 md:w-auto min-w-[280px] max-w-[320px] md:max-w-none space-y-4 min-h-[400px] p-4 mx-4 md:mx-0 rounded-lg transition-colors snap-center ${
                            draggedTask ? 'bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600' : ''
                          }`}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, status)}
                        >
                          <h2 className="font-semibold text-gray-900 dark:text-white capitalize flex items-center gap-2 sticky top-0 bg-gray-50 dark:bg-gray-900 py-2 -mx-4 px-4 rounded-t-lg border-b border-gray-200 dark:border-gray-700 mb-4">
                            {status.replace('-', ' ')}
                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                              {tasksByStatus[status].length}
                            </span>
                          </h2>
                          
                          <div className="space-y-3">
                            {tasksByStatus[status].map(task => (
                              <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                onDragEnd={handleDragEnd}
                                className={`transition-opacity ${draggedTask === task.id ? 'opacity-50' : ''}`}
                              >
                                <TaskCard
                                  task={task}
                                  onUpdate={updateTask}
                                  onDelete={deleteTask}
                                  onPushToGitHub={handlePushToGitHub}
                                  onViewDetails={handleViewTaskDetails}
                                />
                              </div>
                            ))}
                            
                            {/* Add task placeholder for empty columns */}
                            {tasksByStatus[status].length === 0 && (
                              <div className="text-center py-8">
                                <div className="text-gray-400 dark:text-gray-500 mb-2">
                                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                    <Plus className="w-6 h-6" />
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                  No {status.replace('-', ' ')} tasks
                                </p>
                                {status === 'todo' && (
                                  <button
                                    onClick={() => setShowAddTask(true)}
                                    className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                                  >
                                    Add your first task
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Mobile Kanban Instructions */}
              {viewMode === 'kanban' && (
                <div className="md:hidden mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                    💡 Swipe left and right to navigate between columns
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Floating Action Button - Mobile */}
      <button
        onClick={() => setShowAddTask(true)}
        className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30">
        <div className="flex items-center justify-around py-2">
          {sidebarCategories.map((category) => {
            const Icon = category.icon;
            const count = getCategoryCount(category.id);
            const isActive = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as any)}
                className={`flex flex-col items-center gap-1 px-3 py-2 min-w-0 flex-1 transition-colors ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium truncate">{category.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

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
          }}
          service={showIntegration}
          onSuccess={() => {
            console.log(`${showIntegration} integration successful`);
            loadIntegrationStatus();
          }}
        />
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={showTaskDetail}
        onClose={() => {
          setShowTaskDetail(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onUpdateTask={handleUpdateTaskFromModal}
      />

      {/* GitHub Repository Selection Modal */}
      {showGitHubRepos && user && githubToken && (
        <GitHubRepoSelectionModal
          isOpen={true}
          onClose={() => setShowGitHubRepos(false)}
          userId={user.id}
          githubToken={githubToken}
          onSuccess={() => {
            console.log('GitHub repositories updated');
            loadIntegrationStatus();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;