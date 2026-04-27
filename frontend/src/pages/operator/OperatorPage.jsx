import React, { useState, useEffect } from 'react';
import { parchiTypesAPI, membershipTypesAPI, membershipsAPI, ticketsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const SHIFTS = ['Morning', 'Afternoon', 'Evening', 'Night'];

const SHIFT_COLORS = {
  Morning: { bg: 'from-amber-400 to-orange-400', icon: '🌅', text: 'text-amber-700', light: 'bg-amber-50 border-amber-200' },
  Afternoon: { bg: 'from-yellow-400 to-amber-400', icon: '☀️', text: 'text-yellow-700', light: 'bg-yellow-50 border-yellow-200' },
  Evening: { bg: 'from-orange-500 to-rose-500', icon: '🌆', text: 'text-orange-700', light: 'bg-orange-50 border-orange-200' },
  Night: { bg: 'from-indigo-600 to-violet-700', icon: '🌙', text: 'text-indigo-700', light: 'bg-indigo-50 border-indigo-200' },
};

function ShiftSelector({ onSelect, defaultShift }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-teal-500/20 border border-teal-400/30 mb-5">
            <span className="text-4xl">🎫</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Parchi System</h1>
          <p className="text-teal-300 text-sm font-medium tracking-wide uppercase">Select Your Shift to Begin</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {SHIFTS.map(shift => {
            const sc = SHIFT_COLORS[shift];
            return (
              <button
                key={shift}
                onClick={() => onSelect(shift)}
                className={`relative group p-6 rounded-2xl bg-gradient-to-br ${sc.bg} text-white font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col items-center gap-2 border border-white/20`}
              >
                <span className="text-4xl">{sc.icon}</span>
                <span>{shift}</span>
                {defaultShift === shift && (
                  <span className="absolute top-2 right-2 text-xs bg-white/30 rounded-full px-2 py-0.5">Default</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MembershipModal({ shift, onClose, onSuccess }) {
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({
    memberName: '', contactNumber: '', vehicleNumber: '',
    vehicleType: '2-wheeler', membershipTypeId: '', startDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    membershipTypesAPI.getAll().then(r => setTypes(r.data.data || []));
  }, []);

  const handleSubmit = async () => {
    if (!form.memberName || !form.contactNumber || !form.vehicleNumber || !form.membershipTypeId) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      await membershipsAPI.create({ ...form, shift });
      toast.success('Membership saved!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving membership');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 scale-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-xl">🎫</div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">New Membership</h2>
            <p className="text-xs text-slate-500">Shift: {shift}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Membership Type *</label>
            <select className="input" value={form.membershipTypeId} onChange={e => setForm(f => ({ ...f, membershipTypeId: e.target.value }))}>
              <option value="">Select type...</option>
              {types.map(t => (
                <option key={t._id} value={t._id}>{t.name} — ₹{t.amount} / {t.durationDays}d</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Member Name *</label>
              <input className="input" placeholder="Full name" value={form.memberName} onChange={e => setForm(f => ({ ...f, memberName: e.target.value }))} />
            </div>
            <div>
              <label className="label">Contact Number *</label>
              <input className="input" placeholder="10-digit mobile" value={form.contactNumber} onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Vehicle Number *</label>
              <input className="input" placeholder="MP09XX1234" value={form.vehicleNumber} onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label className="label">Vehicle Type *</label>
              <div className="flex gap-2 mt-1">
                {['2-wheeler', '4-wheeler'].map(vt => (
                  <button
                    key={vt}
                    onClick={() => setForm(f => ({ ...f, vehicleType: vt }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${form.vehicleType === vt ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:border-teal-300'}`}
                  >
                    {vt === '2-wheeler' ? '🏍️ 2W' : '🚗 4W'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="label">Start Date</label>
            <input type="date" className="input" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? 'Saving...' : 'Save Membership'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ParchiEntryRow({ parchiType, entry, onChange, onRemove }) {
  const from = Number(entry.fromSerial) || 0;
  const to = Number(entry.toSerial) || 0;
  const count = from && to && to >= from ? to - from + 1 : 0;
  const total = count * parchiType.amount;

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl border-2 border-slate-100 bg-slate-50 fade-in">
      <div className="flex items-center gap-2 w-36 shrink-0">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: parchiType.color }} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-700 truncate">{parchiType.name}</p>
          <p className="text-xs text-slate-400">₹{parchiType.amount} each</p>
        </div>
      </div>
      <div className="flex-1">
        <label className="text-xs text-slate-400 font-semibold block mb-1">From Serial</label>
        <input type="number" className="input text-center" placeholder="1001" value={entry.fromSerial} onChange={e => onChange({ ...entry, fromSerial: e.target.value })} min="0" />
      </div>
      <span className="text-slate-300 text-xl font-light shrink-0">→</span>
      <div className="flex-1">
        <label className="text-xs text-slate-400 font-semibold block mb-1">To Serial</label>
        <input type="number" className="input text-center" placeholder="1010" value={entry.toSerial} onChange={e => onChange({ ...entry, toSerial: e.target.value })} min="0" />
      </div>
      <div className="text-right shrink-0 w-28">
        <p className="text-xs text-slate-400 font-semibold">Count × Total</p>
        <p className="text-sm font-bold text-teal-700">{count > 0 ? `${count} × ₹${total}` : '—'}</p>
      </div>
      <button onClick={onRemove} className="text-slate-300 hover:text-red-400 text-xl leading-none shrink-0 transition-colors">×</button>
    </div>
  );
}

export default function OperatorPage() {
  const { user, logout } = useAuth();
  const [shift, setShift] = useState(null);
  const [parchiTypes, setParchiTypes] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showMembership, setShowMembership] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastBatch, setLastBatch] = useState(null);

  useEffect(() => {
    if (shift) {
      parchiTypesAPI.getAll().then(r => setParchiTypes(r.data.data || []));
    }
  }, [shift]);

  const toggleParchiType = (pt) => {
    setSelectedTypes(prev => {
      const exists = prev.find(s => s.parchiType._id === pt._id);
      if (exists) return prev.filter(s => s.parchiType._id !== pt._id);
      return [...prev, { parchiType: pt, entry: { fromSerial: '', toSerial: '' } }];
    });
  };

  const updateEntry = (id, entry) => {
    setSelectedTypes(prev => prev.map(s => s.parchiType._id === id ? { ...s, entry } : s));
  };

  const removeEntry = (id) => {
    setSelectedTypes(prev => prev.filter(s => s.parchiType._id !== id));
  };

  const grandTotal = selectedTypes.reduce((sum, s) => {
    const from = Number(s.entry.fromSerial) || 0;
    const to = Number(s.entry.toSerial) || 0;
    const count = from && to && to >= from ? to - from + 1 : 0;
    return sum + count * s.parchiType.amount;
  }, 0);

  const totalTickets = selectedTypes.reduce((sum, s) => {
    const from = Number(s.entry.fromSerial) || 0;
    const to = Number(s.entry.toSerial) || 0;
    const count = from && to && to >= from ? to - from + 1 : 0;
    return sum + count;
  }, 0);

  const handleSubmit = async () => {
    if (selectedTypes.length === 0) { toast.error('Select at least one parchi type'); return; }
    for (const s of selectedTypes) {
      const from = Number(s.entry.fromSerial);
      const to = Number(s.entry.toSerial);
      if (!from || !to) { toast.error(`Fill serial numbers for ${s.parchiType.name}`); return; }
      if (from > to) { toast.error(`From serial must be ≤ To serial for ${s.parchiType.name}`); return; }
    }
    setSubmitting(true);
    try {
      const entries = selectedTypes.map(s => ({
        parchiTypeId: s.parchiType._id,
        fromSerial: Number(s.entry.fromSerial),
        toSerial: Number(s.entry.toSerial),
      }));
      const res = await ticketsAPI.createBatch({ entries, shift });
      toast.success(`✅ ${res.data.totalTickets} tickets saved!`);
      setLastBatch(res.data);
      setSelectedTypes([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving tickets');
    } finally {
      setSubmitting(false);
    }
  };

  if (!shift) return <ShiftSelector onSelect={setShift} defaultShift={user?.shift} />;

  const sc = SHIFT_COLORS[shift];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className={`bg-gradient-to-r ${sc.bg} text-white shadow-lg`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{sc.icon}</span>
            <div>
              <h1 className="font-bold text-lg leading-none">Parchi Entry</h1>
              <p className="text-white/70 text-xs">{user?.name} · {shift} Shift</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMembership(true)} className="bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5">
              🎫 Membership
            </button>
            <button onClick={() => setShift(null)} className="bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-all">
              Change Shift
            </button>
            <button onClick={logout} className="bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-all">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {lastBatch && (
          <div className="card bg-emerald-50 border-emerald-200 p-4 fade-in">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-emerald-700 flex items-center gap-2">✅ Last Batch Saved</p>
                <p className="text-sm text-emerald-600">{lastBatch.totalTickets} tickets · ₹{lastBatch.grandTotal} total</p>
              </div>
              <button onClick={() => setLastBatch(null)} className="text-emerald-400 hover:text-emerald-600">×</button>
            </div>
            <div className="mt-3 space-y-1">
              {lastBatch.summary?.map((s, i) => (
                <div key={i} className="text-sm text-emerald-700 flex justify-between">
                  <span>{s.parchiTypeName}: {s.fromSerial} → {s.toSerial}</span>
                  <span className="font-bold">{s.count} pcs · ₹{s.totalAmount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Select Parchi Types</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {parchiTypes.map(pt => {
              const isSelected = selectedTypes.some(s => s.parchiType._id === pt._id);
              return (
                <button
                  key={pt._id}
                  onClick={() => toggleParchiType(pt)}
                  className={`parchi-box border-2 transition-all ${isSelected ? 'selected shadow-lg' : 'border-slate-200 hover:border-slate-300'}`}
                  style={isSelected ? { borderColor: pt.color, background: pt.color + '15' } : {}}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm mb-2" style={{ background: pt.color }}>
                    ₹{pt.amount}
                  </div>
                  <p className="font-bold text-slate-700 text-sm text-center">{pt.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{pt.prefix}</p>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: pt.color }}>✓</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedTypes.length > 0 && (
          <div className="card slide-down">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Enter Serial Ranges</h2>
            <div className="space-y-3">
              {selectedTypes.map(s => (
                <ParchiEntryRow
                  key={s.parchiType._id}
                  parchiType={s.parchiType}
                  entry={s.entry}
                  onChange={entry => updateEntry(s.parchiType._id, entry)}
                  onRemove={() => removeEntry(s.parchiType._id)}
                />
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200">
              <div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-wide">Total Summary</p>
                <p className="text-2xl font-bold text-teal-800">₹{grandTotal.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-teal-600">{totalTickets} Tickets</p>
                <p className="text-xs text-teal-500">{selectedTypes.length} Types</p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || totalTickets === 0}
              className={`btn-primary w-full justify-center mt-4 py-3 text-base ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {submitting ? '⏳ Saving...' : `💾 Save ${totalTickets} Tickets · ₹${grandTotal.toLocaleString('en-IN')}`}
            </button>
          </div>
        )}

        {selectedTypes.length === 0 && parchiTypes.length > 0 && (
          <div className="text-center py-12 text-slate-400">
            <div className="text-5xl mb-3">☝️</div>
            <p className="font-medium">Select one or more parchi types above to begin entry</p>
          </div>
        )}
      </div>

      {showMembership && (
        <MembershipModal shift={shift} onClose={() => setShowMembership(false)} onSuccess={() => {}} />
      )}
    </div>
  );
}