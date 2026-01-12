import React, { useState, useEffect } from 'react';
import { Report, Finding, Severity } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ReportsList from './pages/ReportsList';
import ReportDetail from './pages/ReportDetail';
import { Notification, NotificationItem, NotificationType } from './components/Notification';
import Login from './components/Login';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, query, where, orderBy, updateDoc } from 'firebase/firestore';

// Default templates for new users or fallback
const DEFAULT_TEMPLATES: Partial<Finding>[] = [
    { title: 'Cross-Site Scripting (XSS)', description: 'The application is vulnerable to Cross-Site Scripting...', severity: Severity.HIGH },
    { title: 'SQL Injection', description: 'The application is vulnerable to SQL Injection...', severity: Severity.CRITICAL },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<Partial<Finding>[]>([]);

  // Settings State
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Auth Listener
  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          if (currentUser && !username) {
             // Initial basic set, will be overwritten by Firestore if exists
             setUsername(currentUser.email?.split('@')[0] || 'User');
             setRole('Pentester');
          }
          setLoading(false);
      });
      return unsubscribe;
  }, []);

  // Data Listeners
  useEffect(() => {
      if (!user) {
          setReports([]);
          setTemplates([]);
          return;
      }

      // Reports Listener
      const qReports = query(collection(db, 'reports'), where('userId', '==', user.uid));
      const unsubReports = onSnapshot(qReports, (snapshot) => {
          const loadedReports = snapshot.docs.map(doc => doc.data() as Report);
          setReports(loadedReports.length > 0 ? loadedReports : []);
      });

      // User Data Listener (Templates + Profile)
      const unsubUserData = onSnapshot(doc(db, 'user_data', user.uid), (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.templates) setTemplates(data.templates);
              
              // Update Profile Info
              if (data.displayName) setUsername(data.displayName);
              if (data.jobTitle) setRole(data.jobTitle);
          } else {
              setTemplates(DEFAULT_TEMPLATES);
              // Defaults if no doc exists
              setUsername(user.email?.split('@')[0] || 'User');
              setRole('Pentester');
          }
      });

      return () => {
          unsubReports();
          unsubUserData();
      }
  }, [user]);


  const notify = (type: NotificationType, message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleCreateReport = async () => {
    if (!user) return;
    const newReport: Report & { userId: string } = {
        id: `rep-${Date.now()}`,
        userId: user.uid,
        name: 'New Penetration Test',
        client: 'Client Name',
        date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        findings: []
    };
    
    try {
        await setDoc(doc(db, 'reports', newReport.id), newReport);
        setSelectedReportId(newReport.id);
        setCurrentView('reports');
        notify('success', 'New report created.');
    } catch (e) {
        console.error(e);
        notify('error', 'Failed to create report.');
    }
  };

  const handleUpdateReport = async (updatedReport: Report) => {
    if (!user) return;
    try {
        await updateDoc(doc(db, 'reports', updatedReport.id), { ...updatedReport });
        // State update happens automatically via onSnapshot
    } catch (e) {
        console.error(e);
        notify('error', 'Failed to save changes.');
    }
  };

  const handleSaveSettings = async () => {
      if (!user) return;
      try {
          await setDoc(doc(db, 'user_data', user.uid), {
              displayName: username,
              jobTitle: role
          }, { merge: true });
          notify('success', 'Profile settings saved');
      } catch (e) {
          console.error(e);
          notify('error', 'Failed to save settings');
      }
  };

  const handleTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const content = e.target?.result as string;
            const imported = JSON.parse(content);
            let newTemplates = [...templates];

            if (Array.isArray(imported)) {
                newTemplates = [...newTemplates, ...imported];
            } else {
                newTemplates.push(imported);
            }

            await setDoc(doc(db, 'user_data', user.uid), { templates: newTemplates }, { merge: true });
            notify('success', 'Templates imported successfully.');
        } catch (error) {
            console.error(error);
            notify('error', 'Failed to parse JSON template file.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleRemoveTemplate = async (index: number) => {
      if(!user) return;
      const newTemplates = [...templates];
      newTemplates.splice(index, 1);
      try {
          await setDoc(doc(db, 'user_data', user.uid), { templates: newTemplates }, { merge: true });
          notify('info', 'Template removed');
      } catch (e) {
          notify('error', 'Failed to remove template');
      }
  };

  if (loading) {
      return (
          <div className="h-screen bg-pwn-dark flex items-center justify-center">
              <i className="fa-solid fa-circle-notch fa-spin text-pwn-accent text-4xl"></i>
          </div>
      );
  }

  if (!user) {
      return (
        <div className="h-screen bg-pwn-dark text-pwn-text font-sans">
            <Login notify={notify} />
             {/* Notification Container */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {notifications.map(n => (
                    <Notification key={n.id} notification={n} onDismiss={dismissNotification} />
                ))}
            </div>
        </div>
      );
  }

  const renderContent = () => {
    if (selectedReportId) {
        const report = reports.find(r => r.id === selectedReportId);
        if (!report) return null;
        return (
            <ReportDetail 
                report={report} 
                onUpdateReport={handleUpdateReport}
                onBack={() => setSelectedReportId(null)}
                notify={notify}
                templates={templates}
            />
        );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard reports={reports} />;
      case 'reports':
        return (
            <ReportsList 
                reports={reports} 
                onSelectReport={setSelectedReportId}
                onCreateReport={handleCreateReport}
            />
        );
      case 'templates':
        return (
             <div className="p-8 animate-fade-in">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-white">Finding Templates</h2>
                    <div className="relative">
                        <input 
                            type="file" 
                            accept=".json" 
                            onChange={handleTemplateUpload}
                            className="hidden" 
                            id="template-upload"
                        />
                        <label 
                            htmlFor="template-upload"
                            className="bg-pwn-accent hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
                        >
                            <i className="fa-solid fa-file-import"></i>
                            Import JSON
                        </label>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((t, i) => (
                        <div key={i} className="bg-pwn-panel p-6 rounded-xl border border-gray-800 hover:border-pwn-accent cursor-pointer group transition-all relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveTemplate(i);
                                    }}
                                    className="text-gray-500 hover:text-red-500"
                                >
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                             </div>
                             <div className="text-pwn-accent mb-4 text-2xl"><i className="fa-solid fa-file-code"></i></div>
                             <h3 className="text-lg font-bold text-white group-hover:text-pwn-accent transition-colors line-clamp-1" title={t.title}>{t.title || 'Untitled'}</h3>
                             <p className="text-sm text-gray-500 mt-2 line-clamp-2">{t.description || 'No description available.'}</p>
                             <div className="mt-4 flex gap-2">
                                {t.severity && (
                                    <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300">{t.severity}</span>
                                )}
                             </div>
                        </div>
                    ))}
                 </div>
             </div>
        );
      case 'settings':
        return (
            <div className="p-8 animate-fade-in">
                <h2 className="text-3xl font-bold text-white mb-8">Settings</h2>
                <div className="bg-pwn-panel p-8 rounded-xl border border-gray-800 max-w-2xl">
                    <h3 className="text-xl font-bold text-white mb-6">User Profile</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pwn-accent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Job Title</label>
                            <input 
                                type="text" 
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pwn-accent outline-none"
                            />
                        </div>
                        <div className="pt-4">
                            <button 
                                onClick={handleSaveSettings}
                                className="bg-pwn-accent hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all"
                            >
                                Save Changes
                            </button>
                            <button 
                                onClick={() => auth.signOut()}
                                className="ml-4 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-all"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
      default:
        return <Dashboard reports={reports} />;
    }
  };

  return (
    <div className="flex h-screen bg-pwn-dark text-pwn-text font-sans selection:bg-pwn-accent selection:text-white overflow-hidden">
      <Sidebar 
        currentView={selectedReportId ? 'reports' : currentView} 
        setCurrentView={(view) => {
            setCurrentView(view);
            setSelectedReportId(null);
        }} 
        userProfile={{
            name: username,
            role: role,
            email: user?.email || ''
        }}
      />
      
      <main className="ml-64 flex-1 h-screen overflow-hidden relative flex flex-col">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none z-0" 
             style={{ 
                 backgroundImage: 'radial-gradient(#414868 1px, transparent 1px)', 
                 backgroundSize: '20px 20px' 
             }}>
        </div>
        
        <div className="relative z-10 flex-1 overflow-hidden">
            {renderContent()}
        </div>

        {/* Notification Container */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {notifications.map(n => (
                <Notification key={n.id} notification={n} onDismiss={dismissNotification} />
            ))}
        </div>
      </main>
    </div>
  );
};

export default App;