import React, { useState } from 'react';
import { Report } from '../types';

interface ReportMetadataEditorProps {
    report: Report;
    onSave: (data: Partial<Report>) => void;
    onCancel: () => void;
}

const ReportMetadataEditor: React.FC<ReportMetadataEditorProps> = ({ report, onSave, onCancel }) => {
    const [name, setName] = useState(report.name);
    const [client, setClient] = useState(report.client);
    const [date, setDate] = useState(report.date);
    const [status, setStatus] = useState(report.status);

    const handleSave = () => {
        onSave({ name, client, date, status });
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
             <div className="bg-pwn-panel w-full max-w-lg rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-pwn-dark/50">
                    <h2 className="text-xl font-bold text-white">Edit Report Details</h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-white">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Report Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-pwn-accent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Client Name</label>
                        <input 
                            type="text" 
                            value={client} 
                            onChange={(e) => setClient(e.target.value)}
                            className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-pwn-accent outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                            <input 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-pwn-accent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                            <select 
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-pwn-accent outline-none"
                            >
                                <option value="Draft">Draft</option>
                                <option value="Review">Review</option>
                                <option value="Final">Final</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-700 bg-pwn-dark/50 flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-pwn-accent text-white hover:bg-blue-600">Save Changes</button>
                </div>
             </div>
        </div>
    );
};

export default ReportMetadataEditor;
