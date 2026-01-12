import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { NotificationType } from './Notification';

interface LoginProps {
    notify: (type: NotificationType, message: string) => void;
}

const Login: React.FC<LoginProps> = ({ notify }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                notify('success', 'Logged in successfully');
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                notify('success', 'Account created successfully');
            }
        } catch (error: any) {
            console.error(error);
            notify('error', error.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-pwn-dark p-4 relative overflow-hidden">
             {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none z-0" 
                style={{ 
                    backgroundImage: 'radial-gradient(#414868 1px, transparent 1px)', 
                    backgroundSize: '20px 20px' 
                }}>
            </div>

            <div className="bg-pwn-panel p-8 rounded-xl border border-gray-800 shadow-2xl w-full max-w-md relative z-10 animate-fade-in-up">
                <div className="text-center mb-8">
                    <i className="fa-solid fa-shield-halved text-pwn-accent text-4xl mb-4"></i>
                    <h1 className="text-2xl font-bold text-white tracking-wider">PTDocAI</h1>
                    <p className="text-gray-400 mt-2">Next-Gen Pentest Reporting</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pwn-accent outline-none transition-all"
                            placeholder="you@company.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pwn-accent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-pwn-accent hover:bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all flex justify-center items-center gap-2"
                    >
                        {loading && <i className="fa-solid fa-circle-notch fa-spin"></i>}
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;