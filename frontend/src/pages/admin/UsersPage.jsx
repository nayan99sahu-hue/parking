import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md scale-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'operator' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    usersAPI.getAll().then(r => setUsers(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ name: '', email: '', password: '', role: 'operator' }); setEditing(null); setModal(true); };
  const openEdit = (u) => { setForm({ name: u.name, email: u.email, password: '', role: u.role }); setEditing(u); setModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email required');
    if (!editing && !form.password) return toast.error('Password required for new user');
    setSaving(true);
    try {
      const data = { name: form.name, email: form.email, role: form.role };
      if (form.password) data.password = form.password;
      if (editing) {
        await usersAPI.update(editing._id, data);
        toast.success('User updated!');
      } else {
        await usersAPI.create({ ...data, password: form.password });
        toast.success('User created!');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (u) => {
    try {
      await usersAPI.update(u._id, { isActive: !u.isActive });
      toast.success(u.isActive ? 'User deactivated' : 'User activated');
      load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.name}"?`)) return;
    try {
      await usersAPI.delete(u._id);
      toast.success('Deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const roleColor = (role) => role === 'admin' ? 'badge-blue' : 'badge-green';

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">Operators & Users</h1>
          <p className="text-slate-500 text-sm mt-1">Manage system users and access</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add User
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-500 border-t-transparent" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{u.name}</p>
                          {u._id === me?._id && <p className="text-xs text-teal-600">You</p>}
                        </div>
                      </div>
                    </td>
                    <td className="table-td text-slate-500">{u.email}</td>
                    <td className="table-td"><span className={roleColor(u.role)}>{u.role}</span></td>
                    <td className="table-td"><span className={u.isActive ? 'badge-green' : 'badge-red'}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="table-td text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(u)} className="text-teal-600 hover:text-teal-800 font-semibold text-xs px-2 py-1 rounded-lg hover:bg-teal-50 transition-colors">Edit</button>
                        {u._id !== me?._id && (
                          <>
                            <button onClick={() => handleToggle(u)} className={`text-xs px-2 py-1 rounded-lg font-semibold transition-colors ${u.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}>
                              {u.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button onClick={() => handleDelete(u)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition-colors font-semibold">Delete</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="table-td text-center text-slate-400 py-12">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={editing ? 'Edit User' : 'Create User'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" placeholder="John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" placeholder="user@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Password {editing ? '(leave blank to keep current)' : '*'}</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : null}
                {editing ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
