import React, { useEffect, useRef, useState } from 'react';
import Layout from '../Components/Layout';
import { Send, RefreshCw, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function ChatPane({ channel }){
  const [convos, setConvos] = useState([]);
  const [q, setQ] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [active, setActive] = useState(null); // conversationId
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  const loadConvos = async () => {
    try {
      setLoadingConvos(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/chat/${channel}/conversations?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load conversations');
      setConvos(data.conversations || []);
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
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingMsgs(false);
      setTimeout(()=> bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  useEffect(() => { loadConvos(); }, []);
  useEffect(() => { if (active) loadMessages(active); }, [active]);

  // simple polling every 5s
  useEffect(() => {
    const id = setInterval(() => { if (active) loadMessages(active); }, 5000);
    return () => clearInterval(id);
  }, [active]);

  const send = async () => {
    const text = input.trim();
    if (!text || !active) return;
    try {
      const convo = convos.find(c => c.conversationId === active);
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/chat/${channel}/${active}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text, toUser: convo?.peerId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Send failed');
      setInput('');
      loadMessages(active);
    } catch (e) {
      toast.error(e.message);
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
              <div className="font-medium">{c.peerName}</div>
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
        <div className="border-b px-4 py-2 font-semibold">{convos.find(c=>c.conversationId===active)?.peerName || 'Select a conversation'}</div>
        <div className="flex-1 overflow-auto p-3 space-y-2 bg-neutral-50">
          {loadingMsgs ? (
            <div className="p-4 text-center text-neutral-500">Loading…</div>
          ) : (
            messages.map(m => (
              <div key={m._id} className={`max-w-[70%] px-3 py-2 rounded ${m.fromType==='support' ? 'bg-green-600 text-white ml-auto' : 'bg-white border'}`}>
                <div className="text-sm whitespace-pre-wrap">{m.message}</div>
                <div className="text-[10px] mt-1 opacity-70">{new Date(m.createdAt).toLocaleString()}</div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <div className="border-t p-2 flex items-center gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send(); }} placeholder="Type a message" className="flex-1 border px-3 py-2 bg-white" />
          <button onClick={send} className="px-3 py-2 bg-green-600 text-white flex items-center gap-2"><Send size={16}/> Send</button>
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
