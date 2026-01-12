import React from 'react';
import { Report } from '../types';

interface ReportsListProps {
  reports: Report[];
  onSelectReport: (id: string) => void;
  onCreateReport: () => void;
}

const ReportsList: React.FC<ReportsListProps> = ({ reports, onSelectReport, onCreateReport }) => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Reports</h2>
        <button 
          onClick={onCreateReport}
          className="bg-pwn-accent hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <i className="fa-solid fa-plus"></i>
          New Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div 
            key={report.id} 
            onClick={() => onSelectReport(report.id)}
            className="bg-pwn-panel border border-gray-800 rounded-xl p-6 hover:border-pwn-accent hover:shadow-xl hover:shadow-pwn-accent/10 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-lg bg-gray-800 group-hover:bg-pwn-accent/20 flex items-center justify-center transition-colors">
                <i className="fa-solid fa-file-shield text-xl text-gray-500 group-hover:text-pwn-accent"></i>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                report.status === 'Draft' ? 'bg-gray-700 text-gray-300' :
                report.status === 'Review' ? 'bg-pwn-warning/20 text-pwn-warning' :
                'bg-pwn-success/20 text-pwn-success'
              }`}>
                {report.status}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-pwn-accent transition-colors">{report.name}</h3>
            <p className="text-gray-400 text-sm mb-4">
                <i className="fa-regular fa-building mr-2"></i>
                {report.client}
            </p>

            <div className="border-t border-gray-800 pt-4 mt-4 flex justify-between items-center text-sm text-gray-500">
                <span className="flex items-center gap-2">
                     <i className="fa-solid fa-calendar-days"></i>
                     {report.date}
                </span>
                <span className="flex items-center gap-2">
                    <i className="fa-solid fa-bug"></i>
                    {report.findings.length} findings
                </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsList;
