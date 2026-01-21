import React, { useState, useEffect } from 'react';
import { Report, Finding, Severity } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ReportsList from './pages/ReportsList';
import ReportDetail from './pages/ReportDetail';
import Login from './components/Login';
import { Notification, NotificationItem, NotificationType } from './components/Notification';
import { auth, db, isFirebaseEnabled } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

const DEFAULT_TEMPLATES: Partial<Finding>[] = [
    { title: 'Cross-Site Scripting (XSS)', description: 'The application is vulnerable to Cross-Site Scripting...', severity: Severity.HIGH },
    { title: 'SQL Injection', description: 'The application is vulnerable to SQL Injection...', severity: Severity.CRITICAL },
];

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Data States
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<Partial<Finding>[]>([]);
  const [username, setUsername] = useState('Lead Pentester');
  const [role, setRole] = useState('Senior Security Consultant');

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // 1. Auth & Mode Initialization
  useEffect(() => {
    if (!isFirebaseEnabled) {
      // DEV MODE
      setUser({ uid: 'dev-user', email: 'dev@ptdoc.ai', displayName: 'Lead Pentester' });
      setLoading(false);
      loadLocalData();
    } else {
      // PROD MODE
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          syncWithFirestore(firebaseUser.uid);
        } else {
          setUser(null);
          setReports([]);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  const loadLocalData = () => {
    const savedReports = localStorage.getItem('ptdoc_reports');
    if (savedReports) setReports(JSON.parse(savedReports));

    const savedTemplates = localStorage.getItem('ptdoc_templates');
    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));

    const savedProfile = localStorage.getItem('ptdoc_profile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setUsername(profile.username || 'Lead Pentester');
      setRole(profile.role || 'Senior Security Consultant');
    }
  };

  const syncWithFirestore = (uid: string) => {
    // Sync Reports
    const q = query(collection(db, `users/${uid}/reports`));
    const unsubReports = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({ ...doc.data() } as Report));
      setReports(reportsData);
    });

    // Sync Templates
    const tq = query(collection(db, `users/${uid}/templates`));
    const unsubTemplates = onSnapshot(tq, (snapshot) => {
      const templatesData = snapshot.docs.map(doc => ({ ...doc.data() } as Partial<Finding>));
      setTemplates(templatesData.length > 0 ? templatesData : DEFAULT_TEMPLATES);
    });

    return () => { unsubReports(); unsubTemplates(); };
  };

  // 2. Data Persistence Hook
  useEffect(() => {
    if (!user) return;
    if (!isFirebaseEnabled) {
      localStorage.setItem('ptdoc_reports', JSON.stringify(reports));
      localStorage.setItem('ptdoc_templates', JSON.stringify(templates));
      localStorage.setItem('ptdoc_profile', JSON.stringify({ username, role }));
    }
  }, [reports, templates, username, role, user]);

  const notify = (type: NotificationType, message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleCreateReport = async () => {
    const newReport: Report = {
        id: `rep-${Date.now()}`,
        name: 'New Penetration Test',
        client: 'Client Name',
        date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        findings: []
    };
    
    if (isFirebaseEnabled && user) {
        await setDoc(doc(db, `users/${user.uid}/reports`, newReport.id), newReport);
    } else {
        setReports(prev => [newReport, ...prev]);
    }
    
    setSelectedReportId(newReport.id);
    setCurrentView('reports');
    notify('success', 'New report created.');
  };

  const handleUpdateReport = async (updatedReport: Report) => {
    if (isFirebaseEnabled && user) {
        await setDoc(doc(db, `users/${user.uid}/reports`, updatedReport.id), updatedReport);
    } else {
        setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
    }
  };

  const handleLogout = async () => {
    if (isFirebaseEnabled) await signOut(auth);
    else {
        localStorage.clear();
        window.location.reload();
    }
  };

  if (loading) {
      return (
          <div className="h-screen bg-pwn-dark flex items-center justify-center">
              <i className="fa-solid fa-circle-notch fa-spin text-pwn-accent text-4xl"></i>
          </div>
      );
  }

  if (isFirebaseEnabled && !user) {
      return <Login notify={notify} />;
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
        return <ReportsList reports={reports} onSelectReport={setSelectedReportId} onCreateReport={handleCreateReport} />;
      case 'templates':
        return (
             <div className="p-8 animate-fade-in">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-white">Finding Templates</h2>
                    <input type="file" accept=".json" onChange={(e) => {/* ... handle upload ... */}} className="hidden" id="template-upload"/>
                    <label htmlFor="template-upload" className="bg-pwn-accent hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg cursor-pointer flex items-center gap-2"><i className="fa-solid fa-file-import"></i>Import JSON</label>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((t, i) => (
                        <div key={i} className="bg-pwn-panel p-6 rounded-xl border border-gray-800 hover:border-pwn-accent cursor-pointer group transition-all relative">
                             <h3 className="text-lg font-bold text-white group-hover:text-pwn-accent">{t.title || 'Untitled'}</h3>
                             <p className="text-sm text-gray-500 mt-2 line-clamp-2">{t.description || 'No description available.'}</p>
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
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-pwn-accent"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Job Title</label>
                            <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-pwn-accent"/>
                        </div>
                        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-all">
                            {isFirebaseEnabled ? 'Sign Out' : 'Clear All Local Data'}
                        </button>
                    </div>
                </div>
            </div>
        );
      default:
        return <Dashboard reports={reports} />;
    }
  };

  return (
    <div className="flex h-screen bg-pwn-dark text-pwn-text overflow-hidden">
      <Sidebar 
        currentView={selectedReportId ? 'reports' : currentView} 
        setCurrentView={(view) => { setCurrentView(view); setSelectedReportId(null); }} 
        userProfile={{ name: username, role: role, email: user?.email || 'dev@ptdoc.ai' }}
      />
      <main className="ml-64 flex-1 h-screen overflow-hidden relative flex flex-col">
        <div className="absolute inset-0 opacity-5 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#414868 1px, transparent 1px)', backgroundSize: '20px 20px' }}/>
        <div className="relative z-10 flex-1 overflow-hidden">{renderContent()}</div>
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {notifications.map(n => <Notification key={n.id} notification={n} onDismiss={dismissNotification} />)}
        </div>
      </main>
    </div>
  );
};

export default App;