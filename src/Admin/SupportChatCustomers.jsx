import React, { useEffect, useRef, useState } from 'react';
import Layout from '../Components/Layout';
import { Send, RefreshCw, Search, Loader2, CheckCircle2, XCircle, LifeBuoy } from 'lucide-react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

export function ChatPane({ channel }){
  const [convos, setConvos] = useState([]);
  const [q, setQ] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [active, setActive] = useState(null); // conversationId
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [input, setInput] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState('open');
  const [ticketId, setTicketId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [feedbackView, setFeedbackView] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const activeRef = useRef(active);
  useEffect(() => { activeRef.current = active; }, [active]);

  const loadConvos = async () => {
    try {
      setLoadingConvos(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/chat/${channel}/conversations?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load conversations');
      // Use peer name or fallback
      const convos = (data.conversations || []).map(c => ({
        ...c,
        displayName: c.peerName || c.peerPhone || c.peerId
      }));
      setConvos(convos);
      // Fallback: hydrate missing names/phones from admin users API (only for customers)
      try {
        const missing = convos.filter(c => c.displayName === c.peerId).slice(0, 8);
        const updates = await Promise.all(missing.map(async (c) => {
          try {
            const ur = await fetch(`${import.meta.env.VITE_SERVER}/admin/users/${c.peerId}`, { credentials: 'include' });
            const ud = await ur.json();
            if (ur.ok && ud?.success) {
              const u = ud.user;
              const name = u?.personalInfo?.name;
              const phone = u?.personalInfo?.phone;
              return { id: c.peerId, displayName: name || phone || c.peerId };
            }
          } catch {}
          return null;
        }));
        const map = new Map(updates.filter(Boolean).map(u => [u.id, u.displayName]));
        if (map.size) {
          setConvos(prev => prev.map(c => map.has(c.peerId) ? { ...c, displayName: map.get(c.peerId) } : c));
        }
      } catch {}
      if (!active && data.conversations?.length) setActive(data.conversations[0].conversationId);
    } catch (e) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setLoadingConvos(false);
    }
  };

  const loadMessages = async (conversationId = active) => {
    if (!conversationId) return;
    try {
      setLoadingMsgs(true);
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/chat/${channel}/${conversationId}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load messages');
      setMessages(data.messages || []);
      // Fetch status
      try {
        const sr = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/chat/${channel}/${conversationId}/status`, { credentials: 'include' });
        const sd = await sr.json();
        if (sr.ok && sd.success) {
          setChatStatus(sd.status || 'open');
          setTicketId(sd.ticketId || null);
        }
      } catch {}
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingMsgs(false);
      setTimeout(()=> bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  const createOrOpenTicket = async () => {
    try {
      setTicketLoading(true);
      const convo = convos.find(c => c.conversationId === active);
      if (!convo) return;
      const key = channel === 'customer' ? 'customer' : 'merchant';
      // Try to find existing open ticket for this customer
      const params = new URLSearchParams({ page: '1', limit: '1', status: 'open' });
      params.set(key, convo.peerId);
      const resList = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/tickets?${params.toString()}`, { credentials: 'include' });
      const dataList = await resList.json();
      if (dataList?.tickets?.length) {
        toast.success('Found existing open ticket');
        return;
      }
      // Create a minimal ticket linked to this customer
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject: 'Live chat support', description: `Auto-created from chat ${active}`, category: 'other', priority: 'medium', [key]: convo.peerId, conversationId: active })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Ticket create failed');
      toast.success('Ticket opened');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTicketLoading(false);
    }
  };

  const setTicketStatus = async (status) => {
    try {
      setTicketLoading(true);
      const convo = convos.find(c => c.conversationId === active);
      if (!convo) return;
      // Find latest ticket for this customer
      const params = new URLSearchParams({ page: '1', limit: '1' });
      const key = channel === 'customer' ? 'customer' : 'merchant';
      params.set(key, convo.peerId);
      const resList = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/tickets?${params.toString()}`, { credentials: 'include' });
      const dataList = await resList.json();
      const ticket = dataList?.tickets?.[0];
      if (!ticket) { toast.error('No ticket found for this conversation'); return; }
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/tickets/${ticket._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');
      toast.success(`Ticket ${status.replace('_',' ')}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTicketLoading(false);
    }
  };

  const closeTicket = async () => {
    try {
      setTicketLoading(true);
      const convo = convos.find(c => c.conversationId === active);
      if (!convo) return;
      const params = new URLSearchParams({ page: '1', limit: '1' });
      const key = channel === 'customer' ? 'customer' : 'merchant';
      params.set(key, convo.peerId);
      const resList = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/tickets?${params.toString()}`, { credentials: 'include' });
      const dataList = await resList.json();
      const ticket = dataList?.tickets?.[0];
      if (!ticket) { toast.error('No ticket found for this conversation'); return; }
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/tickets/${ticket._id}/close`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ note: 'Closed from chat' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Close failed');
      setChatStatus('closed');
      toast.success('Ticket closed');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTicketLoading(false);
    }
  };

  useEffect(() => { loadConvos(); }, []);
  useEffect(() => { if (active) loadMessages(active); }, [active]);

  // Persistent Socket.IO connection + real-time updates
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_SERVER, { withCredentials: true });
      const onNew = (payload) => {
        const msg = payload?.message;
        if (!msg || msg.channel !== channel) return;
        // Update messages if this is the active conversation
        if (msg.conversationId === activeRef.current) {
          setMessages(prev => [...prev, msg]);
          // scroll to bottom
          setTimeout(()=> bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
        // Update conversations list preview and reorder to top
        setConvos(prev => {
          const idx = prev.findIndex(c => c.conversationId === msg.conversationId);
          if (idx === -1) return prev; // unknown convo: keep as-is (user can refresh)
          const updated = { ...prev[idx], lastMessage: { _id: msg._id, message: msg.message, createdAt: msg.createdAt, fromType: msg.fromType } };
          const arr = [...prev];
          arr.splice(idx, 1);
          return [updated, ...arr];
        });
      };
      socketRef.current.on('chat:new', onNew);
      let typingTimer;
      const onTyping = () => {
        setIsTyping(true);
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => setIsTyping(false), 1500);
      };
      socketRef.current.on('chat:typing', onTyping);
    }
    return () => {
      // don't disconnect here to keep the socket alive across re-renders
    };
  }, [channel]);

  // Join the room for the active conversation
  useEffect(() => {
    if (socketRef.current && active) {
      socketRef.current.emit('join', { channel, conversationId: active });
    }
  }, [active, channel]);

  const send = async () => {
    const text = input.trim();
    if (!text || !active) return;
    try {
      const convo = convos.find(c => c.conversationId === active);
  // Optimistic UI update for smoothness
  const tempId = `tmp-${Date.now()}`;
  const optimistic = { _id: tempId, message: text, createdAt: new Date().toISOString(), fromType: 'support', conversationId: active, channel };
  setMessages(prev => [...prev, optimistic]);
  setInput('');
  setTimeout(()=> bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 20);
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/chat/${channel}/${active}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text, toUser: convo?.peerId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Send failed');
  // Server will emit socket event; optionally replace temp message by reloading if needed
    } catch (e) {
      toast.error(e.message);
  // Fallback: reload messages on error and revert optimistic add
  loadMessages(active);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] border bg-white">
      {/* Conversations list */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-2 border-b flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search" className="w-full pl-7 pr-2 py-1.5 border" />
          </div>
          <button onClick={loadConvos} className="px-2 py-1 border bg-white text-xs flex items-center gap-1">
            {loadingConvos ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14} />} Refresh
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {convos.map(c => (
            <button key={c.conversationId} onClick={()=>setActive(c.conversationId)} className={`w-full text-left px-3 py-2 border-b hover:bg-neutral-50 ${active===c.conversationId ? 'bg-neutral-100' : ''}`}>
              <div className="font-medium">{c.displayName}</div>
              <div className="text-xs text-neutral-500 truncate">{c.lastMessage?.message}</div>
            </button>
          ))}
          {convos.length===0 && !loadingConvos && (
            <div className="p-4 text-sm text-neutral-500">No conversations</div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col">
        <div className="border-b px-4 py-2 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>{convos.find(c=>c.conversationId===active)?.displayName || 'Select a conversation'}</span>
            {ticketId && <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 border">Ticket #{String(ticketId).slice(-6)}</span>}
            {isTyping && <span className="text-xs text-neutral-500">typing…</span>}
          </div>
          {active && (
            <div className="flex items-center gap-2">
              <button onClick={createOrOpenTicket} disabled={ticketLoading} className="px-2 py-1 text-xs border bg-white flex items-center gap-1"><LifeBuoy size={14}/> Open Ticket</button>
              <button onClick={()=>setTicketStatus('resolved')} disabled={ticketLoading} className="px-2 py-1 text-xs border bg-white flex items-center gap-1"><CheckCircle2 size={14}/> Resolve</button>
              <button onClick={closeTicket} disabled={ticketLoading} className="px-2 py-1 text-xs border bg-white flex items-center gap-1"><XCircle size={14}/> Close</button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-2 bg-neutral-50">
          {chatStatus === 'closed' && !feedbackView && (
            <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded mx-auto max-w-md text-center">
              Chat closed. Waiting for customer feedback…
            </div>
          )}
          {loadingMsgs ? (
            <div className="p-4 text-center text-neutral-500">Loading…</div>
          ) : (
            feedbackView ? (
              <div className="mx-auto max-w-md text-center text-neutral-500 text-sm">Feedback submitted. Chat history hidden.</div>
            ) : messages.map(m => (
              <div key={m._id} className={`max-w-[70%] px-3 py-2 rounded ${m.fromType==='support' ? 'bg-green-600 text-white ml-auto' : 'bg-white border'}`}>
                <div className="text-sm whitespace-pre-wrap">{m.message}</div>
                <div className="text-[10px] mt-1 opacity-70">{new Date(m.createdAt).toLocaleString()}</div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <div className="border-t p-2 flex items-center gap-2">
          <input
            value={input}
            onChange={e=>{
              setInput(e.target.value);
              if (socketRef.current && active) socketRef.current.emit('typing', { channel, conversationId: active });
            }}
            onKeyDown={e=>{ if(e.key==='Enter') send(); }}
            placeholder="Type a message"
            className="flex-1 border px-3 py-2 bg-white"
            disabled={chatStatus==='closed'}
          />
          <button onClick={send} disabled={chatStatus==='closed'} className="px-3 py-2 bg-green-600 text-white flex items-center gap-2 disabled:opacity-50"><Send size={16}/> Send</button>
        </div>
      </div>
    </div>
  );
}

export default function SupportChatCustomers(){
  return (
    <Layout title="Live Chat - Customers">
      <ChatPane channel="customer" />
    </Layout>
  );
}
