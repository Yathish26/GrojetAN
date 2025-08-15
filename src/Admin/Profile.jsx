import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Calendar, Edit3, Save, X, Eye, EyeOff, Lock, Settings as SettingsIcon, AlertCircle, ScanFace } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changingPin, setChangingPin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', department: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pinForm, setPinForm] = useState({ newPin: '', confirmPin: '' });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const local = localStorage.getItem('adminUser');
      if (local) {
        const data = JSON.parse(local);
        setProfile(data);
        setEditForm({ name: data.name||'', email: data.email||'', phone: data.phone||'', department: data.department||'' });
      } else {
        const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfile(data.admin);
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
        setEditForm({ name: data.admin.name||'', email: data.admin.email||'', phone: data.admin.phone||'', department: data.admin.department||'' });
      }
    } catch(err){ toast.error('Failed to load profile'); } finally { setLoading(false); }
  };

  const handleUpdateProfile = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(editForm) });
      if(!res.ok){ const er = await res.json(); throw new Error(er.message||'Failed'); }
      const data = await res.json();
      setProfile(data.admin); localStorage.setItem('adminUser', JSON.stringify(data.admin)); setEditing(false); toast.success('Profile updated');
    } catch(err){ toast.error(err.message); }
  };

  const handleChangePassword = async e => {
    e.preventDefault();
    if(passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords do not match');
    if(passwordForm.newPassword.length < 6) return toast.error('Min 6 chars');
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/change-password`, { method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }) });
      if(!res.ok){ const er = await res.json(); throw new Error(er.message||'Failed'); }
      setPasswordForm({ currentPassword:'', newPassword:'', confirmPassword:'' }); setChangingPassword(false); toast.success('Password changed');
    } catch(err){ toast.error(err.message); }
  };

  const handleChangePin = async e => {
    e.preventDefault();
    if(pinForm.newPin !== pinForm.confirmPin) return toast.error('PINs do not match');
    if(pinForm.newPin.length < 4) return toast.error('PIN >= 4 digits');
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/settings/pin`, { method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ newPin: pinForm.newPin }) });
      if(!res.ok){ const er = await res.json(); throw new Error(er.message||'Failed'); }
      setPinForm({ newPin:'', confirmPin:'' }); setChangingPin(false); toast.success('Registration PIN updated');
    } catch(err){ toast.error(err.message); }
  };

  const handle2fa = async () => {
    try {
      const enable = !profile.twofactorAuth;
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/2fa`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ enable }) });
      if(!res.ok){ const er = await res.json(); throw new Error(er.message||'Failed'); }
      const data = await res.json(); toast.success(data.message || (enable?'2FA enabled':'2FA disabled')); setProfile(p=>({...p, twofactorAuth: enable}));
    } catch(err){ toast.error(err.message); }
  };

  const getRoleIcon = role => role==='super_admin'?<Shield className="w-5 h-5 text-yellow-600" />: role==='admin'?<Shield className="w-5 h-5 text-blue-600" />:<User className="w-5 h-5 text-gray-600" />;
  const getRoleName = role => ({super_admin:'Super Administrator', admin:'Administrator', delivery_manager:'Delivery Manager', inventory_manager:'Inventory Manager'})[role] || (role? role.charAt(0).toUpperCase()+role.slice(1):'Unknown');

  if(loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  if(!profile) return <div className="flex flex-col items-center justify-center min-h-screen"><AlertCircle className="w-16 h-16 text-red-500 mb-4" /><h2 className="text-xl font-semibold text-gray-800 mb-2">Profile Not Found</h2><p className="text-gray-600">Unable to load your profile information.</p></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative flex-shrink-0 self-center sm:self-auto">
              <div className="w-24 h-24 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                <User className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 break-all">{profile.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleIcon(profile.role)}
                    <span className="text-gray-600">{getRoleName(profile.role)}</span>
                  </div>
                </div>
                {!editing && (
                  <button onClick={()=>setEditing(true)} className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-700 hover:bg-green-50 transition w-full sm:w-auto">
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 break-all"><Mail className="w-5 h-5 text-gray-400" /><span className="text-gray-800">{profile.email}</span></div>
                {profile.phone && <div className="flex items-center gap-3 break-all"><Phone className="w-5 h-5 text-gray-400" /><span className="text-gray-800">{profile.phone}</span></div>}
                <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-gray-400" /><span className="text-gray-800">Joined {new Date(profile.createdAt).toLocaleDateString()}</span></div>
                {profile.department && <div className="flex items-center gap-3 break-all"><SettingsIcon className="w-5 h-5 text-gray-400" /><span className="text-gray-800">{profile.department}</span></div>}
              </div>
              {profile.lastLogin && <div className="mt-4 p-3 bg-gray-50 border border-gray-200"><div className="flex items-center gap-2"><ScanFace className="w-4 h-4 text-green-500" /><span className="text-sm text-gray-700 break-all">Last login: {new Date(profile.lastLogin).toLocaleString()}</span></div></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      {editing && (
        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Edit Profile Information</h2>
          </div>
          <form onSubmit={handleUpdateProfile} className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={e=>setEditForm({...editForm, email:e.target.value})} className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={editForm.phone} onChange={e=>setEditForm({...editForm, phone:e.target.value})} className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input type="text" value={editForm.department} onChange={e=>setEditForm({...editForm, department:e.target.value})} className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button type="button" onClick={()=>setEditing(false)} className="flex items-center gap-2 px-4 py-2 border border-gray-400 text-gray-700 hover:bg-gray-100 transition w-full sm:w-auto">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition w-full sm:w-auto">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Settings */}
      <div className="bg-white border border-gray-200 shadow-sm">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
          <div className="flex gap-2 flex-wrap">
            {!changingPassword && (
              <button onClick={()=>setChangingPassword(true)} className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-700 hover:bg-green-50 transition w-full sm:w-auto">
                <Lock className="w-4 h-4" /> Change Password
              </button>
            )}
            {profile.role === 'super_admin' && !changingPin && (
              <button onClick={()=>setChangingPin(true)} className="flex items-center gap-2 px-4 py-2 border border-yellow-600 text-yellow-700 hover:bg-yellow-50 transition w-full sm:w-auto">
                <Shield className="w-4 h-4" /> Change Admin Registration PIN
              </button>
            )}
          </div>
        </div>
        {changingPassword ? (
          <form onSubmit={handleChangePassword} className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={e=>setPasswordForm({...passwordForm, currentPassword:e.target.value})} className="w-full px-3 py-2 pr-10 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500" required />
                <button type="button" onClick={()=>setShowPassword(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input type={showNewPassword ? 'text' : 'password'} value={passwordForm.newPassword} onChange={e=>setPasswordForm({...passwordForm, newPassword:e.target.value})} className="w-full px-3 py-2 pr-10 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500" required minLength={6} />
                <button type="button" onClick={()=>setShowNewPassword(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} value={passwordForm.confirmPassword} onChange={e=>setPasswordForm({...passwordForm, confirmPassword:e.target.value})} className="w-full px-3 py-2 pr-10 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500" required />
                <button type="button" onClick={()=>setShowConfirmPassword(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button type="button" onClick={() => {setChangingPassword(false);setPasswordForm({currentPassword:'',newPassword:'',confirmPassword:''});}} className="flex items-center gap-2 px-4 py-2 border border-gray-400 text-gray-700 hover:bg-gray-100 transition w-full sm:w-auto">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition w-full sm:w-auto">
                <Save className="w-4 h-4" /> Change Password
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-100 bg-gray-50 gap-2">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Password</p>
                  <p className="text-sm text-gray-600">Last changed: {profile.passwordLastChanged ? new Date(profile.passwordLastChanged).toLocaleDateString() : 'Never'}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">••••••••</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-100 bg-gray-50 gap-2">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
              </div>
              <button onClick={handle2fa} className={profile.twofactorAuth? 'text-sm font-medium cursor-pointer text-green-700 border border-green-600 bg-white hover:bg-green-50 px-3 py-1 transition w-full sm:w-auto':'text-sm font-medium cursor-pointer text-white bg-green-600 hover:bg-green-700 px-3 py-1 transition w-full sm:w-auto'}>
                {profile.twofactorAuth ? 'Disable' : 'Enable'}
              </button>
            </div>
            {profile.role === 'super_admin' && changingPin && (
              <form onSubmit={handleChangePin} className="mt-4 p-4 border border-yellow-200 bg-yellow-50 rounded space-y-4">
                <h3 className="text-lg font-semibold text-yellow-800 flex items-center gap-2"><Shield className="w-4 h-4" /> Change Admin Registration PIN</h3>
                <div>
                  <label className="block text-sm font-medium text-yellow-700 mb-1">New PIN</label>
                  <input type="password" value={pinForm.newPin} onChange={e=>setPinForm({...pinForm,newPin:e.target.value})} className="w-full px-3 py-2 border border-yellow-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500" required minLength={4} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-yellow-700 mb-1">Confirm New PIN</label>
                  <input type="password" value={pinForm.confirmPin} onChange={e=>setPinForm({...pinForm,confirmPin:e.target.value})} className="w-full px-3 py-2 border border-yellow-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500" required minLength={4} />
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                  <button type="button" onClick={()=>{setChangingPin(false);setPinForm({newPin:'',confirmPin:''});}} className="flex items-center gap-2 px-4 py-2 border border-yellow-400 text-yellow-700 hover:bg-yellow-100 transition w-full sm:w-auto">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 transition w-full sm:w-auto">
                    <Save className="w-4 h-4" /> Save PIN
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}