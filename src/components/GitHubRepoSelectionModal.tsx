import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, Check, Loader2, AlertCircle } from 'lucide-react';
import { dataService } from '../services/dataService';

interface GitHubRepoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  githubToken: string;
  onSuccess: () => void;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  description: string | null;
  private: boolean;
  updated_at: string;
}

const GitHubRepoSelectionModal: React.FC<GitHubRepoSelectionModalProps> = ({
  isOpen,
  onClose,
  userId,
  githubToken,
  onSuccess,
}) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadRepositories();
      loadCurrentSelection();
    }
  }, [isOpen, userId]);

  const loadRepositories = async () => {
    try {
      setIsLoading(true);
      setError('');
      const repos = await dataService.getGitHubRepos(githubToken);
      setRepositories(repos);
    } catch (error) {
      setError('Failed to load repositories. Please check your connection.');
      console.error('Error loading repositories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentSelection = async () => {
    try {
      const integration = await dataService.getIntegration(userId, 'github');
      if (integration?.connectedRepos) {
        const currentIds = new Set(integration.connectedRepos.map(repo => repo.id));
        setSelectedRepos(currentIds);
      }
    } catch (error) {
      console.error('Error loading current selection:', error);
    }
  };

  const toggleRepository = (repoId: number) => {
    const newSelection = new Set(selectedRepos);
    if (newSelection.has(repoId)) {
      newSelection.delete(repoId);
    } else {
      newSelection.add(repoId);
    }
    setSelectedRepos(newSelection);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');

      const integration = await dataService.getIntegration(userId, 'github');
      if (!integration) {
        throw new Error('GitHub integration not found');
      }

      const connectedRepos = repositories
        .filter(repo => selectedRepos.has(repo.id))
        .map(repo => ({
          id: repo.id,
          name: repo.name,
          owner: repo.owner.login,
          fullName: repo.full_name,
        }));

      await dataService.updateIntegration(integration.id, {
        connectedRepos,
      });

      onSuccess();
      onClose();
    } catch (error) {
      setError('Failed to save repository selection. Please try again.');
      console.error('Error saving selection:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Github className="w-6 h-6 text-gray-900 dark:text-white" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Select GitHub Repositories
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading repositories...
                  </div>
                </div>
              ) : error ? (
                <div className="p-6">
                  <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Select the repositories you want to sync issues from:
                  </p>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {repositories.map((repo) => (
                      <div
                        key={repo.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                        onClick={() => toggleRepository(repo.id)}
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={selectedRepos.has(repo.id)}
                            onChange={() => toggleRepository(repo.id)}
                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                          />
                          {selectedRepos.has(repo.id) && (
                            <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5 pointer-events-none" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {repo.full_name}
                            </h3>
                            {repo.private && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                Private
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {repo.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {repositories.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        No repositories found
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedRepos.size} repositories selected
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || isLoading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Selection'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GitHubRepoSelectionModal;