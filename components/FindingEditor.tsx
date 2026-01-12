import React, { useState, useCallback } from 'react';
import { Finding, Severity, AIAnalysisResult } from '../types';
import { analyzeVulnerability } from '../services/geminiService';
import { SEVERITY_COLORS, OWASP_CATEGORIES } from '../constants';
import { NotificationType } from './Notification';

interface FindingEditorProps {
  finding: Finding;
  onSave: (finding: Finding) => void;
  onCancel: () => void;
  notify: (type: NotificationType, message: string) => void;
  templates?: Partial<Finding>[];
}

const FindingEditor: React.FC<FindingEditorProps> = ({ finding, onSave, onCancel, notify, templates = [] }) => {
  const [editedFinding, setEditedFinding] = useState<Finding>({ ...finding });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleChange = (field: keyof Finding, value: any) => {
    setEditedFinding(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const idx = parseInt(e.target.value);
      if (idx >= 0 && templates && templates[idx]) {
          const t = templates[idx];
          setEditedFinding(prev => ({
              ...prev,
              title: t.title || prev.title,
              description: t.description || prev.description,
              remediation: t.remediation || prev.remediation,
              severity: t.severity || prev.severity,
              cveId: t.cveId || prev.cveId,
              cweId: t.cweId || prev.cweId,
              owaspId: t.owaspId || prev.owaspId,
              cvssScore: t.cvssScore || prev.cvssScore,
              references: t.references || prev.references
          }));
          notify('info', 'Template applied');
      }
      e.target.value = "-1"; // Reset dropdown
  };

  const handleAIAnalysis = useCallback(async () => {
    if (!editedFinding.title) {
        notify('error', 'Please enter a vulnerability title first.');
        return;
    }
    
    setIsAnalyzing(true);
    notify('info', 'Analyzing vulnerability with AI...');

    try {
      const result: AIAnalysisResult | null = await analyzeVulnerability(
        editedFinding.title,
        editedFinding.cveId
      );

      if (result) {
        // Normalize severity from AI
        let aiSeverity = editedFinding.severity;
        if (result.severity) {
            const normalizedSev = result.severity.charAt(0).toUpperCase() + result.severity.slice(1).toLowerCase();
            if (Object.values(Severity).includes(normalizedSev as Severity)) {
                aiSeverity = normalizedSev as Severity;
            }
        }

        setEditedFinding(prev => ({
          ...prev,
          description: result.description || prev.description,
          remediation: result.remediation || prev.remediation,
          cweId: result.cweId || prev.cweId,
          owaspId: result.owaspId || prev.owaspId,
          cvssScore: result.cvssScore !== undefined ? result.cvssScore : prev.cvssScore,
          severity: aiSeverity,
          cveId: result.cveId || prev.cveId,
          references: result.references && result.references.length > 0 
            ? [...new Set([...prev.references, ...result.references])] 
            : prev.references
        }));
        notify('success', 'Finding enriched successfully!');
      } else {
        notify('error', 'AI returned no results. Please check the title/CVE or API key.');
      }
    } catch (err) {
      console.error("AI Analysis failed", err);
      notify('error', 'Failed to connect to AI service.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [editedFinding.title, editedFinding.cveId, notify, editedFinding.severity]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-pwn-panel w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col border border-gray-700 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-pwn-dark/50">
          <h2 className="text-2xl font-bold text-white">
            <i className="fa-solid fa-bug mr-3 text-pwn-danger"></i>
            {finding.id ? 'Edit Finding' : 'New Finding'}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => onSave(editedFinding)}
              className="px-6 py-2 rounded-lg bg-pwn-accent text-white font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
            >
              Save Finding
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left Column: Basic Info */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-medium text-gray-400">Vulnerability Title</label>
                    {templates && templates.length > 0 && (
                        <select 
                            onChange={handleApplyTemplate} 
                            defaultValue="-1"
                            className="bg-gray-800 border border-gray-700 text-xs text-gray-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-pwn-accent"
                        >
                            <option value="-1" disabled>Load Template...</option>
                            {templates.map((t, i) => (
                                <option key={i} value={i}>{t.title}</option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="flex gap-2">
                    <input
                    type="text"
                    value={editedFinding.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="flex-1 bg-pwn-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pwn-accent focus:border-transparent outline-none transition-all placeholder-gray-600"
                    placeholder="e.g. Stored Cross-Site Scripting (XSS)"
                    />
                    <button
                        onClick={handleAIAnalysis}
                        disabled={isAnalyzing || !editedFinding.title}
                        className={`px-4 rounded-lg flex items-center gap-2 font-medium transition-all ${
                            isAnalyzing ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/20'
                        }`}
                        title="Auto-enrich with CVE/OWASP details and description"
                    >
                        {isAnalyzing ? (
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                        ) : (
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                        )}
                        Enrich Finding (AI)
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    <i className="fa-solid fa-info-circle mr-1"></i>
                    Enter a title or CVE ID and click to auto-fill description, CWE, OWASP, and remediation.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Severity</label>
                  <select
                    value={editedFinding.severity}
                    onChange={(e) => handleChange('severity', e.target.value as Severity)}
                    className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pwn-accent outline-none appearance-none cursor-pointer"
                    style={{ color: SEVERITY_COLORS[editedFinding.severity] }}
                  >
                    {Object.values(Severity).map((sev) => (
                      <option key={sev} value={sev}>{sev}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                  <select
                    value={editedFinding.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pwn-accent outline-none appearance-none"
                  >
                    <option value="Open">Open</option>
                    <option value="Fixed">Fixed</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-400 mb-2">CVSS Score (0-10)</label>
                 <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={editedFinding.cvssScore}
                    onChange={(e) => handleChange('cvssScore', parseFloat(e.target.value))}
                    className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pwn-accent outline-none"
                 />
                 <div className="w-full bg-gray-700 h-2 rounded-full mt-3 overflow-hidden">
                    <div 
                        className="h-full transition-all duration-300"
                        style={{ 
                            width: `${editedFinding.cvssScore * 10}%`,
                            backgroundColor: editedFinding.cvssScore >= 9 ? SEVERITY_COLORS[Severity.CRITICAL] :
                                             editedFinding.cvssScore >= 7 ? SEVERITY_COLORS[Severity.HIGH] :
                                             editedFinding.cvssScore >= 4 ? SEVERITY_COLORS[Severity.MEDIUM] :
                                             SEVERITY_COLORS[Severity.LOW]
                        }}
                    ></div>
                 </div>
              </div>
            </div>

            {/* Right Column: Meta Info */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">CVE ID</label>
                <div className="relative">
                    <i className="fa-solid fa-fingerprint absolute left-4 top-3.5 text-gray-500"></i>
                    <input
                        type="text"
                        value={editedFinding.cveId || ''}
                        onChange={(e) => handleChange('cveId', e.target.value)}
                        className="w-full bg-pwn-dark border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-pwn-accent outline-none"
                        placeholder="CVE-2023-XXXX"
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">CWE ID</label>
                <input
                    type="text"
                    value={editedFinding.cweId || ''}
                    onChange={(e) => handleChange('cweId', e.target.value)}
                    className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pwn-accent outline-none"
                    placeholder="CWE-79"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">OWASP Top 10 (2021)</label>
                <select
                    value={editedFinding.owaspId || ''}
                    onChange={(e) => handleChange('owaspId', e.target.value)}
                    className="w-full bg-pwn-dark border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pwn-accent outline-none"
                >
                    <option value="">Select Category</option>
                    {OWASP_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Full Width Editors */}
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Description 
                <span className="ml-2 text-xs bg-pwn-accent/10 text-pwn-accent px-2 py-0.5 rounded">Markdown Supported</span>
              </label>
              <textarea
                value={editedFinding.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full h-64 bg-pwn-dark border border-gray-700 rounded-lg p-4 text-pwn-text-light font-mono text-sm leading-relaxed focus:ring-2 focus:ring-pwn-accent outline-none resize-none"
                placeholder="## Summary&#10;The application is vulnerable to..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Remediation</label>
              <textarea
                value={editedFinding.remediation}
                onChange={(e) => handleChange('remediation', e.target.value)}
                className="w-full h-48 bg-pwn-dark border border-gray-700 rounded-lg p-4 text-pwn-text-light font-mono text-sm leading-relaxed focus:ring-2 focus:ring-pwn-accent outline-none resize-none"
                placeholder="To mitigate this vulnerability..."
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">References</label>
                <div className="space-y-2">
                    {editedFinding.references.map((ref, idx) => (
                        <div key={idx} className="flex gap-2">
                            <input 
                                value={ref}
                                readOnly
                                className="flex-1 bg-pwn-dark border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
                            />
                            <button 
                                onClick={() => {
                                    const newRefs = [...editedFinding.references];
                                    newRefs.splice(idx, 1);
                                    handleChange('references', newRefs);
                                }}
                                className="text-red-400 hover:text-red-300 px-2"
                            >
                                <i className="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    ))}
                     <div className="flex gap-2 mt-2">
                        <input 
                            id="new-ref"
                            placeholder="Add new reference URL"
                            className="flex-1 bg-pwn-dark border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 focus:ring-1 focus:ring-pwn-accent outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value;
                                    if(val) {
                                        handleChange('references', [...editedFinding.references, val]);
                                        (e.target as HTMLInputElement).value = '';
                                    }
                                }
                            }}
                        />
                         <button 
                            onClick={() => {
                                const input = document.getElementById('new-ref') as HTMLInputElement;
                                if(input && input.value) {
                                    handleChange('references', [...editedFinding.references, input.value]);
                                    input.value = '';
                                }
                            }}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindingEditor;
