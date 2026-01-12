import React from 'react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  userProfile: {
    name: string;
    role: string;
    email: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, userProfile }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'reports', label: 'Reports', icon: 'fa-file-lines' },
    { id: 'templates', label: 'Templates', icon: 'fa-copy' },
    { id: 'settings', label: 'Settings', icon: 'fa-cog' },
  ];

  const getInitials = (name: string, email: string) => {
      if (name) {
          return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      }
      return email ? email.substring(0, 2).toUpperCase() : 'U';
  };

  return (
    <div className="w-64 h-screen bg-pwn-dark border-r border-gray-800 flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-b border-gray-800">
        <i className="fa-solid fa-shield-halved text-pwn-accent text-2xl"></i>
        <h1 className="text-xl font-bold text-white tracking-wider">PTDocAI</h1>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                  currentView === item.id 
                    ? 'bg-pwn-accent/20 text-pwn-accent border-l-4 border-pwn-accent' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <i className={`fa-solid ${item.icon} w-5`}></i>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="bg-pwn-panel rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pwn-accent to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
            {getInitials(userProfile.name, userProfile.email)}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm text-white font-semibold truncate">{userProfile.name || 'User'}</div>
            <div className="text-xs text-gray-500 truncate">{userProfile.role || 'Pentester'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;