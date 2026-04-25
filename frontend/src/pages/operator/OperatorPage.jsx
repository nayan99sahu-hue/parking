import React, { useState, useEffect, useRef } from 'react';
import { parchiTypesAPI, ticketsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TicketReceipt = ({ ticket, onClose }) => {
  const printRef = useRef();
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm ticket-pop">
        {/* Printable ticket */}
        <div ref={printRef} className="print-ticket">
          <div className="p-6 text-center border-b-2 border-dashed border-slate-200">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3" style={{ backgroundColor: ticket.parchiTypeId?.color || '#0d9488' }}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">ParkiPro</div>
            <div className="text-xl font-extrabold text-slate-800">Parking Ticket</div>
          </div>

          <div className="p-6 space-y-4">
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Serial Number</p>
              <p className="text-3xl font-extrabold font-mono tracking-wider" style={{ color: ticket.parchiTypeId?.color || '#0d9488' }}>{ticket.serialNumber}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Type</p>
                <p className="font-bold text-slate-700">{ticket.parchiTypeName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Amount</p>
                <p className="font-extrabold text-green-700 text-xl">₹{ticket.amount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Operator</p>
                <p className="font-semibold text-slate-600 text-sm">{ticket.operatorName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Time</p>
                <p className="font-semibold text-slate-600 text-sm">{new Date(ticket.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-6 flex gap-3 no-print">
          <button onClick={handlePrint} className="btn-secondary flex-1 justify-center py-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print
          </button>
          <button onClick={onClose} className="btn-primary flex-1 justify-center py-3">
            Next Ticket →
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OperatorPage() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [parchiTypes, setParchiTypes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastTicket, setLastTicket] = useState(null);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    parchiTypesAPI.getAll()
      .then(r => setParchiTypes(r.data.data))
      .catch(() => toast.error('Failed to load ticket types'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleSubmit = async () => {
    if (!selected) return toast.error('Please select a parchi type');
    setSubmitting(true);
    try {
      const res = await ticketsAPI.create({ parchiTypeId: selected._id });
      const ticket = res.data.data;
      // Attach color info
      ticket.parchiTypeId = selected;
      setLastTicket(ticket);
      setTodayCount(c => c + 1);
      setSelected(null);
      toast.success(`Ticket #${ticket.serialNumber} generated!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${dark ? 'bg-slate-900' : 'bg-slate-50'} flex flex-col`}>
      {/* Header */}
      <header className={`${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} border-b shadow-sm no-print`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            </div>
            <div>
              <h1 className={`font-extrabold text-lg ${dark ? 'text-white' : 'text-slate-800'}`}>ParkiPro</h1>
              <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Parchi Cutter Station</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className={`font-semibold text-sm ${dark ? 'text-white' : 'text-slate-800'}`}>{user?.name}</p>
              <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Today: {todayCount} tickets</p>
            </div>
            <button onClick={toggle} className={`p-2 rounded-lg ${dark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'} transition-colors`}>
              {dark ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            </button>
            <button onClick={handleLogout} className="btn-secondary py-2 px-3 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="text-center mb-8 fade-in">
          <h2 className={`text-2xl font-extrabold ${dark ? 'text-white' : 'text-slate-800'}`}>Select Parchi Type</h2>
          <p className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Click a ticket type below, then press Generate</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent" /></div>
        ) : parchiTypes.length === 0 ? (
          <div className="text-center py-20">
            <p className={`text-lg font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>No active parchi types available</p>
            <p className={`text-sm mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Contact your admin to enable ticket types</p>
          </div>
        ) : (
          <>
            {/* Parchi Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mb-8 fade-in">
              {parchiTypes.map((t, idx) => {
                const isSelected = selected?._id === t._id;
                return (
                  <button
                    key={t._id}
                    onClick={() => setSelected(isSelected ? null : t)}
                    className={`parchi-box border-2 transition-all text-left ${isSelected ? 'border-opacity-100 ring-4 ring-offset-2 selected' : 'border-opacity-20 hover:border-opacity-60'} ${dark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-white hover:bg-slate-50'}`}
                    style={{
                      borderColor: t.color,
                      boxShadow: isSelected ? `0 0 0 3px ${t.color}40, 0 12px 30px ${t.color}30` : undefined,
                      animationDelay: `${idx * 60}ms`
                    }}>
                    {/* Amount badge */}
                    <div className="w-full flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: t.color }}>
                        <span className="font-extrabold text-2xl">₹</span>
                      </div>
                      <div className="text-center">
                        <p className={`font-extrabold text-3xl ${dark ? 'text-white' : 'text-slate-800'}`} style={{ color: isSelected ? t.color : undefined }}>
                          {t.amount}
                        </p>
                        <p className={`text-sm font-semibold mt-0.5 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{t.name}</p>
                        {t.prefix && <p className="text-xs font-mono mt-1 px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: t.color + '20', color: t.color }}>{t.prefix}</p>}
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: t.color }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected indicator + Submit */}
            <div className={`card max-w-md mx-auto text-center fade-in ${dark ? 'bg-slate-800 border-slate-700' : ''}`}>
              {selected ? (
                <div className="mb-4">
                  <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'} mb-1`}>Selected:</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selected.color }} />
                    <p className={`font-bold text-lg ${dark ? 'text-white' : 'text-slate-800'}`}>{selected.name} — ₹{selected.amount}</p>
                  </div>
                </div>
              ) : (
                <p className={`text-sm mb-4 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>No parchi type selected</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={!selected || submitting}
                className={`w-full py-4 rounded-2xl font-extrabold text-lg transition-all duration-200 flex items-center justify-center gap-3
                  ${selected && !submitting
                    ? 'text-white shadow-teal hover:shadow-teal-lg hover:-translate-y-0.5 active:translate-y-0'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                style={selected && !submitting ? { backgroundColor: selected.color } : {}}>
                {submitting
                  ? <><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />Generating...</>
                  : <><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>Generate Parchi</>}
              </button>
            </div>
          </>
        )}
      </main>

      {/* Ticket Receipt Modal */}
      {lastTicket && <TicketReceipt ticket={lastTicket} onClose={() => setLastTicket(null)} />}
    </div>
  );
}
