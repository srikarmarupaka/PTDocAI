import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Severity, Report } from '../types';
import { SEVERITY_COLORS } from '../constants';

interface DashboardProps {
  reports: Report[];
}

const Dashboard: React.FC<DashboardProps> = ({ reports }) => {
  // Aggregate finding stats across all reports
  const allFindings = reports.flatMap(r => r.findings);
  
  const stats = Object.values(Severity).map(sev => ({
    name: sev,
    value: allFindings.filter(f => f.severity === sev).length,
    color: SEVERITY_COLORS[sev]
  }));

  const totalFindings = stats.reduce((acc, curr) => acc + curr.value, 0);

  // Dynamic Remediation Rate
  const closedOrFixedCount = allFindings.filter(f => f.status === 'Fixed' || f.status === 'Closed').length;
  const remediationRate = totalFindings > 0 ? Math.round((closedOrFixedCount / totalFindings) * 100) : 0;

  // Dynamic Reports this Month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const newReportsThisMonth = reports.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // Dynamic Trend Data (Last 6 Months)
  const getLast6Months = () => {
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('default', { month: 'short' }),
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        findings: 0
      });
    }
    return months;
  };

  const trendData = getLast6Months();

  reports.forEach(report => {
    if (!report.date) return;
    const repDate = new Date(report.date);
    const repMonth = repDate.getMonth();
    const repYear = repDate.getFullYear();

    // Map findings to the specific month bucket
    const period = trendData.find(p => p.monthIndex === repMonth && p.year === repYear);
    if (period) {
      period.findings += report.findings.length;
    }
  });

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-6">Security Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-pwn-panel p-6 rounded-xl border border-gray-800 shadow-lg">
          <div className="text-gray-400 text-sm mb-1">Total Reports</div>
          <div className="text-3xl font-bold text-white">{reports.length}</div>
          <div className="text-xs text-pwn-success mt-2 flex items-center gap-1">
             <i className="fa-solid fa-arrow-trend-up"></i> +{newReportsThisMonth} this month
          </div>
        </div>
        <div className="bg-pwn-panel p-6 rounded-xl border border-gray-800 shadow-lg">
          <div className="text-gray-400 text-sm mb-1">Total Findings</div>
          <div className="text-3xl font-bold text-white">{totalFindings}</div>
           <div className="text-xs text-pwn-danger mt-2 flex items-center gap-1">
             <i className="fa-solid fa-triangle-exclamation"></i> {allFindings.filter(f => f.status === 'Open').length} Open
          </div>
        </div>
        <div className="bg-pwn-panel p-6 rounded-xl border border-gray-800 shadow-lg">
          <div className="text-gray-400 text-sm mb-1">Critical Issues</div>
          <div className="text-3xl font-bold text-pwn-danger">
            {stats.find(s => s.name === Severity.CRITICAL)?.value || 0}
          </div>
          <div className="text-xs text-gray-500 mt-2">Across all reports</div>
        </div>
        <div className="bg-pwn-panel p-6 rounded-xl border border-gray-800 shadow-lg">
          <div className="text-gray-400 text-sm mb-1">Remediation Rate</div>
          <div className={`text-3xl font-bold ${remediationRate >= 75 ? 'text-pwn-success' : remediationRate >= 50 ? 'text-pwn-warning' : 'text-pwn-danger'}`}>
              {remediationRate}%
          </div>
          <div className="text-xs text-gray-500 mt-2">Fixed or Closed</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Severity Distribution */}
        <div className="bg-pwn-panel p-6 rounded-xl border border-gray-800 shadow-lg min-h-[400px]">
          <h3 className="text-xl font-semibold text-white mb-6">Findings by Severity</h3>
          {totalFindings > 0 ? (
            <>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={stats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        >
                        {stats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1b26', border: '1px solid #414868', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                    </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 flex-wrap mt-4">
                    {stats.map((stat) => (
                        <div key={stat.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }}></div>
                            <span className="text-sm text-gray-400">{stat.name}: <span className="text-white font-bold">{stat.value}</span></span>
                        </div>
                    ))}
                </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500 flex-col">
                <i className="fa-solid fa-chart-pie text-4xl mb-3 opacity-30"></i>
                <p>No findings available to display.</p>
            </div>
          )}
        </div>

        {/* Findings Trend */}
        <div className="bg-pwn-panel p-6 rounded-xl border border-gray-800 shadow-lg min-h-[400px]">
          <h3 className="text-xl font-semibold text-white mb-6">Findings Trend (6 Months)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3b" vertical={false} />
                <XAxis dataKey="name" stroke="#565f89" />
                <YAxis stroke="#565f89" allowDecimals={false} />
                <Tooltip 
                     cursor={{fill: '#2a2e3b'}}
                     contentStyle={{ backgroundColor: '#1a1b26', border: '1px solid #414868', borderRadius: '8px' }}
                     itemStyle={{ color: '#7aa2f7' }}
                />
                <Bar dataKey="findings" fill="#7aa2f7" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;