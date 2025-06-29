import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Smartphone, Github, Trello, CheckCircle } from 'lucide-react';
import Logo from '../components/Logo';
import { useTheme } from '../context/ThemeContext';

const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Offline-first architecture with instant sync when online. Your workflow never stops.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Local-first data storage with end-to-end encryption. Your data stays yours.'
    },
    {
      icon: Smartphone,
      title: 'Works Everywhere',
      description: 'Progressive Web App that works seamlessly across all your devices.'
    }
  ];

  const integrations = [
    { name: 'GitHub', icon: Github, description: 'Sync issues and pull requests' },
    { name: 'Trello', icon: Trello, description: 'Import boards and cards' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Logo size="sm" />
            
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Logo size="lg" className="mb-8" />
            
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Your developer workflow, unified
            </p>
            
            <p className="text-lg text-gray-500 dark:text-gray-500 mb-12 max-w-2xl mx-auto">
              Seamlessly manage tasks across GitHub, Trello, and local projects. 
              Work offline, sync online, stay productive everywhere.
            </p>
            
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 btn-primary text-lg px-8 py-4"
            >
              Start Building
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Built for Developers
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to streamline your development workflow in one beautiful, fast app.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-8 text-center hover:shadow-lg transition-all duration-300"
              >
                <feature.icon className="w-12 h-12 text-primary-500 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Seamless Integrations
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Connect your favorite tools and keep everything in sync.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-8 flex items-center gap-6 hover:shadow-lg transition-all duration-300"
              >
                <integration.icon className="w-12 h-12 text-gray-700 dark:text-gray-300" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {integration.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {integration.description}
                  </p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-500 ml-auto" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to unify your workflow?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join developers who've streamlined their productivity with Bliq.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-white text-primary-600 font-semibold py-4 px-8 rounded-lg hover:bg-primary-50 transition-all duration-200 text-lg"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo size="sm" />
            <div className="flex items-center gap-6 mt-4 md:mt-0 text-sm text-gray-600 dark:text-gray-400">
              <a href="#" className="hover:text-primary-500 transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary-500 transition-colors">Terms</a>
              <a href="#" className="hover:text-primary-500 transition-colors">Support</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
            © 2025 Bliq. Built with ❤️ for developers.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;