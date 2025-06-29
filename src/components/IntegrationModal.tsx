import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, Trello, ExternalLink } from 'lucide-react';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: 'github' | 'trello';
  onSuccess: () => void;
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({ isOpen, onClose, service, onSuccess }) => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Test the token
      const testUrl = service === 'github' 
        ? 'https://api.github.com/user'
        : `https://api.trello.com/1/members/me?key=${import.meta.env.VITE_TRELLO_API_KEY}&token=${token}`;

      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };

      if (service === 'github') {
        headers['Authorization'] = `token ${token}`;
      }

      const response = await fetch(testUrl, { headers });

      if (!response.ok) {
        throw new Error(`Invalid ${service} token`);
      }

      const userData = await response.json();

      // Save integration
      const integration = {
        id: crypto.randomUUID(),
        userId: user.id,
        service,
        token,
        metadata: userData,
        createdAt: new Date().toISOString(),
      };

      await dataService.addIntegration(integration);
      onSuccess();
      onClose();
      setToken('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Integration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const serviceConfig = {
    github: {
      name: 'GitHub',
      icon: Github,
      color: 'text-gray-900',
      instructions: 'Go to GitHub Settings > Developer settings > Personal access tokens > Generate new token',
      tokenUrl: 'https://github.com/settings/tokens',
      scopes: 'Required scopes: repo, read:user',
    },
    trello: {
      name: 'Trello',
      icon: Trello,
      color: 'text-blue-600',
      instructions: 'Get your Trello token from the developer portal',
      tokenUrl: `https://trello.com/1/authorize?expiration=never&name=Bliq&scope=read,write&response_type=token&key=${import.meta.env.VITE_TRELLO_API_KEY}`,
      scopes: 'Required permissions: read, write',
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
            className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${config.color}`} />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Connect {config.name}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Testing...' : 'Connect'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
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
  );
};

export default IntegrationModal;