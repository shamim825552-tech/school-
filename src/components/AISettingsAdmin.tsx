import { useEffect, useState } from 'react';
import { AISettings, AIProvider } from '../types';
import { supabase } from '../lib/supabaseClient';
import { askAI, PROVIDER_LABELS, DEFAULT_MODELS } from '../lib/aiClient';
import { Bot, Eye, EyeOff, CheckCircle2, Loader2, Sparkles, ListChecks } from 'lucide-react';

const PROVIDERS: AIProvider[] = ['openai', 'anthropic', 'gemini', 'custom'];

interface LogRow {
  id: string;
  user_name: string;
  user_role: string;
  role: string;
  message: string | null;
  image_url: string | null;
  is_error: boolean;
  timestamp: number;
}

export default function AISettingsAdmin() {
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [logs, setLogs] = useState<LogRow[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: l }] = await Promise.all([
        supabase.from('ai_settings').select('*').eq('id', 'default').maybeSingle(),
        supabase.from('ai_chat_messages').select('*').order('timestamp', { ascending: false }).limit(30),
      ]);
      if (s) {
        setProvider(s.provider);
        setApiKey(s.api_key || '');
        setModel(s.model || '');
        setBaseUrl(s.base_url || '');
        setSystemPrompt(s.system_prompt || '');
        setEnabled(s.enabled);
      }
      if (l) setLogs(l as LogRow[]);
      setLoading(false);
    })();
  }, []);

  const buildSettings = (): AISettings => ({
    id: 'default',
    enabled,
    provider,
    apiKey: apiKey.trim(),
    model: model.trim() || DEFAULT_MODELS[provider],
    baseUrl: provider === 'custom' ? baseUrl.trim() : undefined,
    systemPrompt: systemPrompt.trim() || undefined,
    updatedAt: Date.now(),
  });

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const s = buildSettings();
    const { error } = await supabase.from('ai_settings').upsert({
      id: s.id,
      enabled: s.enabled,
      provider: s.provider,
      api_key: s.apiKey,
      model: s.model,
      base_url: s.baseUrl ?? null,
      system_prompt: s.systemPrompt ?? null,
      updated_at: s.updatedAt,
    });
    setSaving(false);
    if (error) {
      alert('সংরক্ষণ করতে সমস্যা হয়েছে: ' + error.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const reply = await askAI(buildSettings(), 'শুধু এক লাইনে বাংলায় লেখো: "সংযোগ সফল হয়েছে।"');
      setTestResult({ ok: true, text: reply });
    } catch (err: any) {
      setTestResult({ ok: false, text: err?.message || 'অজানা ত্রুটি' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
        <Loader2 size={20} className="animate-spin" /> লোড হচ্ছে...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-5 text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="font-bold">AI সেটিংস</h2>
            <p className="text-xs text-white/70">সবাই AI সহকারী ব্যবহার করতে পারবে — এখান থেকে শুধু আপনি (অ্যাডমিন) key সেট করবেন</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <div>
              <p className="font-medium text-gray-800 text-sm">AI সহকারী চালু রাখুন</p>
              <p className="text-xs text-gray-500">বন্ধ করলে সবার জন্য AI সহকারী পেজে অস্থায়ীভাবে বন্ধ দেখাবে</p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`w-12 h-7 rounded-full transition relative ${enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition ${enabled ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI প্রোভাইডার</label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setProvider(p); if (!model) setModel(DEFAULT_MODELS[p]); }}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition text-left ${
                    provider === p ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {PROVIDER_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-... / AIza... / আপনার API key পেস্ট করুন"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition pr-12 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">মডেল</label>
            <input
              type="text"
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder={DEFAULT_MODELS[provider] || 'মডেলের নাম'}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
            />
          </div>

          {provider === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base URL (OpenAI-compatible endpoint)</label>
              <input
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://.../v1/chat/completions"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">সিস্টেম প্রম্পট (ঐচ্ছিক)</label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="যেমন: তুমি একজন বন্ধুত্বপূর্ণ স্কুল সহকারী, বাংলায় সহজভাবে উত্তর দেবে।"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>

          {testResult && (
            <div className={`px-4 py-3 rounded-xl text-sm font-medium ${testResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {testResult.ok ? '✅ ' : '⚠️ '} {testResult.text}
            </div>
          )}
          {saved && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
              <CheckCircle2 size={18} /> সেটিংস সংরক্ষণ করা হয়েছে।
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !apiKey.trim()}
              className="flex-1 py-3 rounded-xl font-bold border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {testing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              সংযোগ পরীক্ষা করুন
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-60"
            >
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <ListChecks size={18} className="text-indigo-600" />
          <h3 className="font-bold text-gray-800 text-sm">সাম্প্রতিক প্রশ্ন-উত্তর (সবার)</h3>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
          {logs.length === 0 && <p className="p-4 text-sm text-gray-400">এখনো কোনো প্রশ্ন করা হয়নি।</p>}
          {logs.map(l => (
            <div key={l.id} className="p-3 text-sm">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <span className="font-semibold text-gray-600">{l.user_name}</span>
                <span>•</span>
                <span>{l.role === 'user' ? 'প্রশ্ন' : 'AI উত্তর'}</span>
                <span>•</span>
                <span>{new Date(l.timestamp).toLocaleString('bn-BD')}</span>
              </div>
              <p className={`whitespace-pre-wrap break-words ${l.is_error ? 'text-red-600' : 'text-gray-700'}`}>
                {l.message || (l.image_url ? '[ছবি পাঠানো হয়েছে]' : '')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
