import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Edit3, Trash2, ExternalLink, Github } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Task } from '../services/dataService';

interface TaskCardProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onPushToGitHub?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, onDelete, onPushToGitHub }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isMarkdownMode, setIsMarkdownMode] = useState(task.isMarkdown);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [showMenu, setShowMenu] = useState(false);

  const handleSave = () => {
    onUpdate(task.id, {
      title: editTitle,
      description: editDescription,
      isMarkdown: isMarkdownMode,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setIsMarkdownMode(task.isMarkdown);
    setIsEditing(false);
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const statusColors = {
    todo: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  return (
    <motion.div
      layout
      className="card p-6 hover:shadow-md transition-all duration-200"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input font-semibold text-lg mb-2"
              placeholder="Task title..."
            />
          ) : (
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
              {task.title}
            </h3>
          )}
          
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
              {task.status.replace('-', ' ')}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            {task.source !== 'local' && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                {task.source}
              </span>
            )}
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
              
              {task.source === 'local' && onPushToGitHub && (
                <button
                  onClick={() => {
                    onPushToGitHub(task);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  Push to GitHub
                </button>
              )}
              
              {task.sourceId && task.source === 'github' && (
                <a
                  href={`https://github.com/${task.tags[0]}/issues/${task.sourceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on GitHub
                </a>
              )}
              
              {task.sourceId && task.source === 'trello' && (
                <a
                  href={`https://trello.com/c/${task.sourceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Trello
                </a>
              )}
              
              <button
                onClick={() => {
                  onDelete(task.id);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        {isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isMarkdownMode}
                  onChange={(e) => setIsMarkdownMode(e.target.checked)}
                  className="rounded"
                />
                Markdown mode
              </label>
            </div>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="input min-h-[100px] resize-y"
              placeholder="Task description..."
            />
            <div className="flex gap-2">
              <button onClick={handleSave} className="btn-primary text-sm">
                Save
              </button>
              <button onClick={handleCancel} className="btn-secondary text-sm">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-600 dark:text-gray-300">
            {task.description ? (
              task.isMarkdown ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {task.description}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{task.description}</p>
              )
            ) : (
              <p className="text-gray-400 italic">No description</p>
            )}
          </div>
        )}
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default TaskCard;