import React, { useState } from 'react';
import { LayoutList, Briefcase, CalendarRange, Settings, Timer, Menu, X, RefreshCw } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import CalendarPage from './pages/CalendarPage';
import TimerPage from './pages/TimerPage';
import SettingsModal from './components/SettingsModal';

function AppShell() {
  const { user, isSyncing } = useApp();
  const [currentPage, setCurrentPage] = useState('home');
  const [timerTask, setTimerTask] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const navigateTimer = (task) => {
    setTimerTask(task);
    setCurrentPage('timer');
  };

  const nav = [
    { id: 'home', label: 'Tasks', icon: LayoutList },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'calendar', label: 'Calendar', icon: CalendarRange },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onNavigateTimer={navigateTimer} />;
      case 'projects': return <ProjectsPage />;
      case 'calendar': return <CalendarPage />;
      case 'timer': return timerTask ? <TimerPage task={timerTask} onBack={() => setCurrentPage('home')} /> : <HomePage onNavigateTimer={navigateTimer} />;
      default: return <HomePage onNavigateTimer={navigateTimer} />;
    }
  };

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <LayoutList size={28} color="#6366f1" />
            <h1>TaskWise</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${currentPage === id ? 'active' : ''}`}
              onClick={() => { setCurrentPage(id); setSidebarOpen(false); }}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {isSyncing && (
            <div className="sync-indicator syncing">
              <RefreshCw size={14} className="spinner" /> Syncing...
            </div>
          )}
          {user ? (
            <div className={`user-card ${showSettings ? 'active' : ''}`} onClick={() => { setShowSettings(true); setSidebarOpen(false); }}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder">
                  <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 700 }}>
                    {(user.displayName || user.email || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <div className="user-name">{user.displayName || 'User'}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
          ) : (
            <button className={`nav-item ${showSettings ? 'active' : ''}`} onClick={() => { setShowSettings(true); setSidebarOpen(false); }}>
              <Settings size={20} />
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Mobile header */}
        <div className="mobile-header">
          <button className="btn-ghost" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
          <span style={{ fontWeight: 700, fontSize: 18 }}>TaskWise</span>
          <div style={{ width: 36 }} />
        </div>
        {renderPage()}
      </main>

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
