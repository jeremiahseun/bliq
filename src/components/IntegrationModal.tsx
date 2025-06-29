import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, Trello, ExternalLink, Check, ChevronRight, ArrowLeft, Search } from 'lucide-react';
import { dataService, type GitHubRepo, type TrelloBoard } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: 'github' | 'trello';
  onSuccess: () => void;
}

type Step = 'token' | 'selection';

const IntegrationModal: React.FC<IntegrationModalProps> = ({ isOpen, onClose, service, onSuccess }) => {
  const [step, setStep] = useState<Step>('token');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [boards, setBoards] = useState<TrelloBoard[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number | string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Test the token and fetch repositories/boards
      if (service === 'github') {
        const response = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) {
          throw new Error('Invalid GitHub token');
        }

        const userData = await response.json();
        const repositories = await dataService.fetchGitHubRepositories(token);
        setRepos(repositories);
        setStep('selection');
      } else {
        const testUrl = `https://api.trello.com/1/members/me?key=${import.meta.env.VITE_TRELLO_API_KEY}&token=${token}`;
        const response = await fetch(testUrl, {
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Invalid Trello token');
        }

        const userData = await response.json();
        const trelloBoards = await dataService.fetchTrelloBoards(token);
        setBoards(trelloBoards.filter(board => !board.closed));
        setStep('selection');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Integration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionSubmit = async () => {
    if (!user || selectedItems.size === 0) return;

    setIsLoading(true);
    setError('');

    try {
      let selectedRepos;
      
      if (service === 'github') {
        selectedRepos = repos
          .filter(repo => selectedItems.has(repo.id))
          .map(repo => ({
            id: repo.id,
            owner: repo.owner.login,
            name: repo.name,
            full_name: repo.full_name,
          }));
      } else {
        selectedRepos = boards
          .filter(board => selectedItems.has(board.id))
          .map(board => ({
            id: board.id,
            owner: 'trello',
            name: board.name,
            full_name: board.name,
          }));
      }

      // Check if integration already exists
      const existingIntegration = await dataService.getIntegration(user.id, service);
      
      if (existingIntegration) {
        // Update existing integration
        await dataService.updateIntegration(existingIntegration.id, {
          token,
          selectedRepos,
        });
      } else {
        // Create new integration
        const integration = {
          id: crypto.randomUUID(),
          userId: user.id,
          service,
          token,
          metadata: {},
          selectedRepos,
          createdAt: new Date().toISOString(),
        };

        await dataService.addIntegration(integration);
      }

      onSuccess();
      handleClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Integration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('token');
    setToken('');
    setRepos([]);
    setBoards([]);
    setSelectedItems(new Set());
    setSearchQuery('');
    setError('');
    onClose();
  };

  const toggleSelection = (id: number | string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const filteredItems = service === 'github' 
    ? repos.filter(repo => 
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : boards.filter(board =>
        board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        board.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const serviceConfig = {
    github: {
      name: 'GitHub',
      icon: Github,
      color: 'text-gray-900',
      instructions: 'Go to GitHub Settings > Developer settings > Personal access tokens > Generate new token',
      tokenUrl: 'https://github.com/settings/tokens',
      scopes: 'Required scopes: repo, read:user',
      itemName: 'repositories',
    },
    trello: {
      name: 'Trello',
      icon: Trello,
      color: 'text-blue-600',
      instructions: 'Get your Trello token from the developer portal',
      tokenUrl: `https://trello.com/1/authorize?expiration=never&name=Bliq&scope=read,write&response_type=token&key=${import.meta.env.VITE_TRELLO_API_KEY}`,
      scopes: 'Required permissions: read, write',
      itemName: 'boards',
    },
  };

  const config = serviceConfig[service];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {step === 'selection' && (
                  <button
                    onClick={() => setStep('token')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <Icon className={`w-6 h-6 ${config.color}`} />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {step === 'token' ? `Connect ${config.name}` : `Select ${config.itemName}`}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              {step === 'token' ? (
                <div className="p-6">
                  <div className="mb-6">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {config.instructions}
                    </p>
                    
                    <a
                      href={config.tokenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Get Token
                    </a>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {config.scopes}
                    </p>
                  </div>

                  <form onSubmit={handleTokenSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Access Token
                      </label>
                      <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="input"
                        placeholder={`Enter your ${config.name} token`}
                        required
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
                        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={isLoading || !token.trim()}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Connecting...' : 'Next'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="p-6">
                  <div className="mb-6">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Select the {config.itemName} you want to sync with Bliq. Issues/cards from selected {config.itemName} will be imported as tasks.
                    </p>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder={`Search ${config.itemName}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 max-h-80 overflow-y-auto">
                    {filteredItems.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                          {searchQuery ? 'No matching items found' : `No ${config.itemName} found`}
                        </p>
                      </div>
                    ) : (
                      filteredItems.map((item) => {
                        const id = service === 'github' ? (item as GitHubRepo).id : (item as TrelloBoard).id;
                        const isSelected = selectedItems.has(id);
                        
                        return (
                          <div
                            key={id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => toggleSelection(id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                    {service === 'github' 
                                      ? (item as GitHubRepo).full_name 
                                      : (item as TrelloBoard).name
                                    }
                                  </h3>
                                  {service === 'github' && (item as GitHubRepo).private && (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs rounded-full">
                                      Private
                                    </span>
                                  )}
                                </div>
                                
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {service === 'github' 
                                    ? (item as GitHubRepo).description || 'No description'
                                    : (item as TrelloBoard).desc || 'No description'
                                  }
                                </p>
                                
                                {service === 'github' && (
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{(item as GitHubRepo).open_issues_count} open issues</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className={`w-5 h-5 border-2 rounded transition-colors ${
                                isSelected
                                  ? 'bg-primary-500 border-primary-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-white m-auto" />}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg mb-4">
                      <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedItems.size} {config.itemName} selected
                    </p>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleSelectionSubmit}
                        disabled={isLoading || selectedItems.size === 0}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Saving...' : 'Connect'}
                      </button>
                      <button
                        onClick={handleClose}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default IntegrationModal;