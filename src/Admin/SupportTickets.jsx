import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../Components/Layout';
import { Plus, Search, Filter, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const pageSize = 20;

export default function SupportTickets(){
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium', category: 'other' });

  const load = async (pageNum = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      params.set('page', String(pageNum));
      params.set('limit', String(pageSize));
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/tickets?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load');
      setTickets(data.tickets || []);
      setTotal(data.total || 0);
      setPage(pageNum);
    } catch (e) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const createTicket = async () => {
    if (!form.subject?.trim() || !form.description?.trim()) {
      toast.error('Subject and description required');
      return;
    }
    try {
      setCreating(true);
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Create failed');
      toast.success('Ticket created');
      setShowCreate(false);
  setForm({ subject: '', description: '', priority: 'medium', category: 'other' });
      load(1);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const updateTicket = async (id, patch) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(patch)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
      setTickets(prev => prev.map(t => t._id === id ? data.ticket : t));
      toast.success('Updated');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <Layout title="Tickets">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search tickets" className="w-full pl-8 pr-3 py-2 border bg-white" />
        </div>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="border bg-white px-2 py-2">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <button onClick={()=>load(1)} className="px-3 py-2 border bg-white flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />} Refresh
        </button>
        <button onClick={()=>setShowCreate(true)} className="px-3 py-2 bg-green-600 text-white flex items-center gap-2">
          <Plus size={16} /> New Ticket
        </button>
      </div>

      <div className="bg-white border">
        <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold text-neutral-600 border-b">
          <div className="col-span-4">Subject</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {tickets.map(t => (
          <div key={t._id} className="grid grid-cols-12 px-3 py-2 border-b last:border-b-0">
            <div className="col-span-4">
              <div className="font-medium">{t.subject}</div>
              <div className="text-xs text-neutral-500 line-clamp-2">{t.description}</div>
            </div>
            <div className="col-span-2">
              <select value={t.status} onChange={e => updateTicket(t._id, { status: e.target.value })} className="border bg-white text-sm px-2 py-1">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="col-span-2">
              <select value={t.priority} onChange={e => updateTicket(t._id, { priority: e.target.value })} className="border bg-white text-sm px-2 py-1">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="col-span-2 capitalize">{t.category || 'general'}</div>
            <div className="col-span-2 text-right">
              <button onClick={()=>updateTicket(t._id, { assignedTo: null })} className="text-xs px-2 py-1 border mr-2">Unassign</button>
              <button onClick={()=>updateTicket(t._id, { slaHours: 24 })} className="text-xs px-2 py-1 border">Set SLA 24h</button>
            </div>
          </div>
        ))}
        {tickets.length === 0 && !loading && (
          <div className="p-6 text-center text-neutral-500">No tickets</div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-neutral-600">Page {page} of {pages} • {total} total</div>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={()=>load(page-1)} className="px-3 py-1 border bg-white disabled:opacity-50">Prev</button>
          <button disabled={page>=pages} onClick={()=>load(page+1)} className="px-3 py-1 border bg-white disabled:opacity-50">Next</button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg p-4 border">
            <h3 className="text-lg font-semibold mb-3">New Ticket</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm">Subject</label>
                <input value={form.subject} onChange={e=>setForm(f=>({...f, subject: e.target.value}))} className="w-full border px-3 py-2" />
              </div>
              <div>
                <label className="text-sm">Description</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f, description: e.target.value}))} rows={4} className="w-full border px-3 py-2" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm">Priority</label>
                  <select value={form.priority} onChange={e=>setForm(f=>({...f, priority: e.target.value}))} className="w-full border px-2 py-2">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f, category: e.target.value}))} className="w-full border px-2 py-2">
                    <option value="other">Other</option>
                    <option value="order">Order</option>
                    <option value="payment">Payment</option>
                    <option value="refund">Refund</option>
                    <option value="merchant">Merchant</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={()=>setShowCreate(false)} className="px-3 py-2 border bg-white">Cancel</button>
              <button onClick={createTicket} disabled={creating} className="px-3 py-2 bg-green-600 text-white disabled:opacity-50">
                {creating ? 'Creating…' : 'Create Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
