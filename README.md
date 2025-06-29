# Bliq - Your Developer Workflow, Unified

A beautiful, modern Progressive Web Application that seamlessly manages tasks across GitHub, Trello, and local projects. Work offline, sync online, stay productive everywhere.

![Bliq Screenshot](https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=600&fit=crop&crop=top)

## ✨ Features

- **🚀 Lightning Fast**: Offline-first architecture with instant sync
- **🔒 Secure & Private**: Local-first data storage with encryption
- **📱 Works Everywhere**: Progressive Web App for all devices
- **🔄 Smart Sync**: GitHub issues & Trello cards integration
- **🎨 Beautiful UI**: Modern design with dark/light themes
- **📋 Kanban Board**: Drag-and-drop task management
- **💬 Comments**: Rich commenting system with Markdown support

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: React Context + Hooks
- **Database**: IndexedDB (via idb)
- **Build Tool**: Vite
- **PWA**: Workbox Service Worker
- **UI Components**: Lucide React Icons
- **Animations**: Framer Motion

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Trello API Key (optional, for Trello integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bliq-pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Trello API key:
   ```env
   VITE_TRELLO_API_KEY=your_trello_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### Trello Integration

1. Get your API key from [Trello Developer Portal](https://trello.com/app-key)
2. Add it to your `.env` file as `VITE_TRELLO_API_KEY`

### GitHub Integration

No additional setup required - users connect their GitHub accounts via personal access tokens through the app interface.

## 📦 Building for Production

```bash
# Build the application
npm run build

# Preview the build locally
npm run preview

# Lint the code
npm run lint
```

The build output will be in the `dist/` folder.

## 🚀 Deployment

### Netlify (Recommended)

1. **Connect your repository** to Netlify
2. **Set build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Add environment variables** in Netlify dashboard:
   - `VITE_TRELLO_API_KEY`: Your Trello API key
4. **Deploy**!

### Vercel

1. **Connect your repository** to Vercel
2. **Framework preset**: Vite
3. **Add environment variables**:
   - `VITE_TRELLO_API_KEY`: Your Trello API key
4. **Deploy**!

### Manual Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Upload the `dist/` folder** to your web server

3. **Configure environment variables** on your hosting platform

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── BoltBadge.tsx   # Bolt.new attribution badge
│   ├── Logo.tsx        # App logo component
│   ├── TaskCard.tsx    # Individual task card
│   └── ...
├── context/            # React Context providers
│   ├── AuthContext.tsx # Authentication state
│   ├── DataContext.tsx # Task data management
│   └── ThemeContext.tsx # Theme switching
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── LandingPage.tsx # Landing page
│   └── ...
├── services/           # Data layer services
│   ├── authService.ts  # Authentication logic
│   ├── dataService.ts  # Task CRUD operations
│   └── dbService.ts    # IndexedDB interface
└── types/              # TypeScript type definitions
```

## 🔒 Privacy & Security

- **Local-first**: All data is stored locally in your browser
- **No tracking**: We don't collect or store personal data
- **Secure tokens**: API tokens are encrypted and stored locally
- **Offline capable**: Works completely offline

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Bolt.new](https://bolt.new) ⚡
- Icons by [Lucide React](https://lucide.dev)
- UI inspiration from modern productivity apps

---

**Made with ❤️ for developers who value productivity and beautiful design.**