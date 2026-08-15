import { useEffect, useRef, useState } from 'react';
import { User, AIChatMessage, AISettings } from '../types';
import { supabase } from '../lib/supabaseClient';
import { askAI, resizeImageFile } from '../lib/aiClient';
import { Send, Image as ImageIcon, X, Bot, Loader2, Trash2, Sparkles, AlertTriangle } from 'lucide-react';

interface Props {
  user: User;
}

const fromDb = (r: any): AIChatMessage => ({
  id: r.id,
  userId: r.user_id,
  userName: r.user_name,
  userRole: r.user_role,
  role: r.role,
  message: r.message ?? undefined,
  imageUrl: r.image_url ?? undefined,
  isError: r.is_error ?? false,
  timestamp: r.timestamp,
});

const toDb = (m: AIChatMessage) => ({
  id: m.id,
  user_id: m.userId,
  user_name: m.userName,
  user_role: m.userRole,
  role: m.role,
  message: m.message ?? null,
  image_url: m.imageUrl ?? null,
  is_error: m.isError ?? false,
  timestamp: m.timestamp,
});

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
}

export default function AIAssistant({ user }: Props) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: msgData }, { data: settingsData }] = await Promise.all([
        supabase.from('ai_chat_messages').select('*').eq('user_id', user.id).order('timestamp', { ascending: true }).limit(300),
        supabase.from('ai_settings').select('*').eq('id', 'default').maybeSingle(),
      ]);
      if (!active) return;
      if (msgData) setMessages(msgData.map(fromDb));
      if (settingsData) {
        setSettings({
          id: settingsData.id,
          enabled: settingsData.enabled,
          provider: settingsData.provider,
          apiKey: settingsData.api_key,
          model: settingsData.model,
          baseUrl: settingsData.base_url ?? undefined,
          systemPrompt: settingsData.system_prompt ?? undefined,
          updatedAt: settingsData.updated_at,
        });
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('শুধুমাত্র ছবি ফাইল দেওয়া যাবে।'); return; }
    try {
      const dataUrl = await resizeImageFile(file);
      setPendingImage(dataUrl);
    } catch {
      alert('ছবি প্রসেস করতে সমস্যা হয়েছে।');
    }
  };

  const handleSend = async () => {
    if (sending) return;
    if (!text.trim() && !pendingImage) return;
    if (!settings || !settings.apiKey || !settings.enabled) {
      alert('AI এখনো সেট আপ করা হয়নি। অ্যাডমিনের সাথে যোগাযোগ করুন।');
      return;
    }

    const questionText = text.trim();
    const questionImage = pendingImage;
    setText('');
    setPendingImage(null);
    setSending(true);

    const userMsg: AIChatMessage = {
      id: `aim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      role: 'user',
      message: questionText || undefined,
      imageUrl: questionImage || undefined,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    await supabase.from('ai_chat_messages').insert(toDb(userMsg));

    try {
      const answer = await askAI(settings, questionText || 'এই ছবিটি ব্যাখ্যা করো।', questionImage || undefined);
      const aiMsg: AIChatMessage = {
        id: `aim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        role: 'assistant',
        message: answer,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
      await supabase.from('ai_chat_messages').insert(toDb(aiMsg));
    } catch (err: any) {
      const errMsg: AIChatMessage = {
        id: `aim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        role: 'assistant',
        message: err?.message || 'দুঃখিত, উত্তর দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        isError: true,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
      await supabase.from('ai_chat_messages').insert(toDb(errMsg));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('আপনার সব প্রশ্ন-উত্তরের ইতিহাস মুছে ফেলতে চান?')) return;
    setMessages([]);
    await supabase.from('ai_chat_messages').delete().eq('user_id', user.id);
  };

  const notConfigured = !loading && (!settings || !settings.apiKey || !settings.enabled);

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-4 text-white flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Bot size={22} />
        </div>
        <div className="flex-1">
          <h2 className="font-bold">AI সহকারী</h2>
          <p className="text-xs text-white/70">যেকোনো প্রশ্ন লিখুন বা ছবি পাঠান — AI উত্তর দেবে</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
            title="ইতিহাস মুছুন"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {notConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-2 text-amber-700 text-sm">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <span>
            AI এখনো চালু করা হয়নি।
            {user.role === 'admin' ? ' "AI সেটিংস" মেনু থেকে API key যোগ করুন।' : ' অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।'}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading && (
          <div className="flex items-center justify-center h-full text-gray-400 gap-2">
            <Loader2 size={20} className="animate-spin" /> লোড হচ্ছে...
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 text-center px-6">
            <Sparkles size={28} />
            <p>যেকোনো বিষয়ে প্রশ্ন করুন — যেমন পড়াশোনা, হোমওয়ার্ক বা অংক সমাধান। প্রয়োজনে ছবি তুলেও পাঠাতে পারেন।</p>
          </div>
        )}
        {messages.map(m => {
          const isMine = m.role === 'user';
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                {!isMine && (
                  <span className="text-xs font-semibold text-indigo-700 mb-0.5 px-1 flex items-center gap-1">
                    <Bot size={12} /> AI সহকারী
                  </span>
                )}
                <div
                  className={`rounded-2xl px-3 py-2 shadow-sm ${
                    isMine
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : m.isError
                      ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                  }`}
                >
                  {m.imageUrl && (
                    <img src={m.imageUrl} alt="পাঠানো ছবি" className="rounded-xl max-w-full max-h-72 object-contain mb-1" />
                  )}
                  {m.message && <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>}
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 px-1">{timeLabel(m.timestamp)}</span>
              </div>
            </div>
          );
        })}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 size={16} className="animate-spin" /> AI উত্তর লিখছে...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 p-3 bg-white">
        {pendingImage && (
          <div className="relative inline-block mb-2">
            <img src={pendingImage} alt="preview" className="h-20 rounded-lg border border-gray-200" />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition"
            title="ছবি সংযুক্ত করুন"
            disabled={sending}
          >
            <ImageIcon size={20} />
          </button>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="আপনার প্রশ্ন লিখুন..."
            rows={1}
            className="flex-1 resize-none px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none max-h-28"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || (!text.trim() && !pendingImage)}
            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
