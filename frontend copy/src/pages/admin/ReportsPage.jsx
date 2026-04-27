import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [operatorStats, setOperatorStats] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    Promise.all([
      reportsAPI.getOperators(),
      reportsAPI.getDaily()
    ]).then(([ops, daily]) => {
      setOperatorStats(ops.data.data);
      setDailyData(daily.data.data.slice(0, 30).reverse());
    }).catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  const loadDaily = () => {
    reportsAPI.getDaily(dateRange).then(r => setDailyData(r.data.data.reverse())).catch(() => toast.error('Failed'));
  };

  const totalRevenue = operatorStats.reduce((s, o) => s + o.revenue, 0);
  const totalTickets = operatorStats.reduce((s, o) => s + o.count, 0);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Reports & Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Comprehensive system performance insights</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Total Tickets', value: totalTickets.toLocaleString(), color: 'text-teal-700', bg: 'bg-teal-50' },
          { label: 'Active Operators', value: operatorStats.length, color: 'text-blue-700', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className={`card ${s.bg}`}>
            <p className="text-slate-500 text-sm">{s.label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Daily revenue chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-bold text-slate-700 dark:text-slate-200">Daily Revenue Trend</h3>
          <div className="flex items-center gap-2">
            <input type="date" className="input py-1.5 text-xs w-36" value={dateRange.startDate} onChange={e => setDateRange(r => ({ ...r, startDate: e.target.value }))} />
            <span className="text-slate-400 text-sm">to</span>
            <input type="date" className="input py-1.5 text-xs w-36" value={dateRange.endDate} onChange={e => setDateRange(r => ({ ...r, endDate: e.target.value }))} />
            <button onClick={loadDaily} className="btn-primary py-1.5 px-3 text-sm">Apply</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(val, name) => [name === 'revenue' ? `₹${val}` : val, name === 'revenue' ? 'Revenue' : 'Tickets']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Plus Jakarta Sans' }} />
            <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2.5} dot={{ fill: '#0d9488', r: 3 }} name="revenue" />
            <Line type="monotone" dataKey="count" stroke="#0891b2" strokeWidth={2.5} dot={{ fill: '#0891b2', r: 3 }} name="count" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Operator breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Revenue by Operator</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={operatorStats} layout="vertical" barSize={20}>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip formatter={(val) => [`₹${val}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', fontFamily: 'Plus Jakarta Sans' }} />
              <Bar dataKey="revenue" fill="#0d9488" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Operator Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Operator', 'Tickets', 'Revenue', 'Avg'].map(h => <th key={h} className="table-th">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {operatorStats.map((o, i) => (
                  <tr key={o._id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">{o.name?.[0]?.toUpperCase()}</div>
                        <span className="font-medium">{o.name}</span>
                      </div>
                    </td>
                    <td className="table-td font-mono font-semibold">{o.count.toLocaleString()}</td>
                    <td className="table-td font-semibold text-green-700">₹{o.revenue.toLocaleString('en-IN')}</td>
                    <td className="table-td text-slate-500">₹{o.count ? Math.round(o.revenue / o.count) : 0}</td>
                  </tr>
                ))}
                {operatorStats.length === 0 && (
                  <tr><td colSpan={4} className="table-td text-center text-slate-400 py-8">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily summary table */}
      <div className="card">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Daily Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Date', 'Tickets', 'Revenue'].map(h => <th key={h} className="table-th">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...dailyData].reverse().map(d => (
                <tr key={d._id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <td className="table-td font-medium">{new Date(d._id).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="table-td font-mono font-semibold">{d.count.toLocaleString()}</td>
                  <td className="table-td font-semibold text-green-700">₹{d.revenue.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {dailyData.length === 0 && (
                <tr><td colSpan={3} className="table-td text-center text-slate-400 py-8">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
