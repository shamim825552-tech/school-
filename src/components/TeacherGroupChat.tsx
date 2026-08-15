import { useEffect, useRef, useState } from 'react';
import { User, TeacherMessage } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Send, Image as ImageIcon, X, Users, Loader2, Mic, Square, Play, Pause, Trash2, SmilePlus } from 'lucide-react';

interface Props {
  user: User;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '👏', '🙏'];

const fromDb = (r: any): TeacherMessage => ({
  id: r.id,
  senderId: r.sender_id,
  senderName: r.sender_name,
  message: r.message ?? undefined,
  imageUrl: r.image_url ?? undefined,
  audioUrl: r.audio_url ?? undefined,
  reactions: r.reactions ?? {},
  timestamp: r.timestamp,
});

// ছবি পাঠানোর আগে ছোট করে (max ১০০০px চওড়া, jpeg quality 0.7) — Blob হিসেবে,
// যাতে Supabase Storage-এ আপলোড করা যায় (ডেটাবেজে বড় base64 টেক্সট রাখলে
// অনেক সময় আপলোড ব্যর্থ হয়/ধীর হয়ে যায়, তাই ছবি/অডিও Storage-এ রাখা হয়)
function resizeImageToBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const maxW = 1000;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas error'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          blob => (blob ? resolve(blob) : reject(new Error('ছবি প্রসেস করা যায়নি।'))),
          'image/jpeg',
          0.7
        );
      };
      img.onerror = () => reject(new Error('ছবিটি পড়া যায়নি — ফাইলটি হয়তো নষ্ট বা অসমর্থিত।'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('ছবি ফাইল পড়তে সমস্যা হয়েছে।'));
    reader.readAsDataURL(file);
  });
}

// Supabase Storage-এর 'chat-media' bucket-এ ফাইল আপলোড করে পাবলিক URL রিটার্ন করে
async function uploadChatMedia(blob: Blob, folder: string, ext: string): Promise<string> {
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('chat-media').upload(path, blob, {
    contentType: blob.type || (ext === 'webm' ? 'audio/webm' : 'image/jpeg'),
    upsert: false,
  });
  if (error) {
    throw new Error(
      `ফাইল আপলোড ব্যর্থ হয়েছে (${error.message}). অ্যাডমিনকে Supabase-এ 'chat-media' নামে একটি পাবলিক Storage bucket তৈরি করতে বলুন (supabase_schema.sql ফাইলে নির্দেশনা আছে)।`
    );
  }
  const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
  return data.publicUrl;
}

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
}

function dateLabel(ts: number) {
  return new Date(ts).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function VoiceBubblePlayer({ src, tint }: { src: string; tint: 'mine' | 'theirs' }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); } else { a.play(); }
  };

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration || 0)}
        onTimeUpdate={e => setProgress((e.target as HTMLAudioElement).currentTime || 0)}
      />
      <button
        type="button"
        onClick={toggle}
        className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${
          tint === 'mine' ? 'bg-white/25' : 'bg-green-600 text-white'
        }`}
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <div className={`flex-1 h-1.5 rounded-full ${tint === 'mine' ? 'bg-white/30' : 'bg-gray-200'}`}>
        <div
          className={`h-full rounded-full ${tint === 'mine' ? 'bg-white' : 'bg-green-600'}`}
          style={{ width: duration ? `${(progress / duration) * 100}%` : '0%' }}
        />
      </div>
      <span className={`text-[10px] ${tint === 'mine' ? 'text-white/80' : 'text-gray-400'}`}>
        {formatDuration(duration || 0)}
      </span>
    </div>
  );
}

export default function TeacherGroupChat({ user }: Props) {
  const [messages, setMessages] = useState<TeacherMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [pendingImage, setPendingImage] = useState<{ url: string; blob: Blob } | null>(null);
  const [pendingAudio, setPendingAudio] = useState<{ url: string; blob: Blob; duration: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('teacher_messages')
        .select('*')
        .order('timestamp', { ascending: true })
        .limit(500);
      if (active) {
        if (!error && data) setMessages(data.map(fromDb));
        setLoading(false);
      }
    })();

    // রিয়েলটাইম — অন্য শিক্ষক মেসেজ পাঠালে/মুছলে/রিঅ্যাক্ট করলে সাথে সাথে আপডেট হবে
    const channel = supabase
      .channel('teacher_messages_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'teacher_messages' }, payload => {
        const msg = fromDb(payload.new);
        setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teacher_messages' }, payload => {
        const msg = fromDb(payload.new);
        setMessages(prev => prev.map(m => (m.id === msg.id ? msg : m)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'teacher_messages' }, payload => {
        const id = payload.old.id as string;
        setMessages(prev => prev.filter(m => m.id !== id));
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('শুধুমাত্র ছবি ফাইল দেওয়া যাবে।'); return; }
    if (file.size > 15 * 1024 * 1024) { alert('ছবিটি অনেক বড় (সর্বোচ্চ ১৫MB)। একটু ছোট ছবি বেছে নিন।'); return; }
    try {
      const blob = await resizeImageToBlob(file);
      if (pendingImage) URL.revokeObjectURL(pendingImage.url);
      setPendingImage({ url: URL.createObjectURL(blob), blob });
      setPendingAudio(null);
    } catch (err: any) {
      alert(err?.message || 'ছবি প্রসেস করতে সমস্যা হয়েছে।');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (pendingAudio) URL.revokeObjectURL(pendingAudio.url);
        setPendingAudio({ url: URL.createObjectURL(blob), blob, duration: recordSeconds });
        setPendingImage(null);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch {
      alert('মাইক্রোফোন ব্যবহারের অনুমতি পাওয়া যায়নি।');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
  };

  const cancelRecording = () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
    }
    audioChunksRef.current = [];
    if (pendingAudio) URL.revokeObjectURL(pendingAudio.url);
    setPendingAudio(null);
  };

  const handleSend = async () => {
    if (!text.trim() && !pendingImage && !pendingAudio) return;
    setSending(true);

    let imageUrl: string | undefined;
    let audioUrl: string | undefined;
    try {
      setUploading(true);
      if (pendingImage) {
        imageUrl = await uploadChatMedia(pendingImage.blob, 'teacher-images', 'jpg');
      }
      if (pendingAudio) {
        audioUrl = await uploadChatMedia(pendingAudio.blob, 'teacher-audio', 'webm');
      }
    } catch (err: any) {
      setUploading(false);
      setSending(false);
      alert(err?.message || 'ফাইল আপলোড করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ যাচাই করুন।');
      return;
    }
    setUploading(false);

    const newMsg: TeacherMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      senderId: user.id,
      senderName: user.name,
      message: text.trim() || undefined,
      imageUrl,
      audioUrl,
      reactions: {},
      timestamp: Date.now(),
    };
    // আশাবাদী UI: সাথে সাথে দেখানো হচ্ছে
    setMessages(prev => [...prev, newMsg]);
    setText('');
    if (pendingImage) URL.revokeObjectURL(pendingImage.url);
    if (pendingAudio) URL.revokeObjectURL(pendingAudio.url);
    setPendingImage(null);
    setPendingAudio(null);

    const { error } = await supabase.from('teacher_messages').insert({
      id: newMsg.id,
      sender_id: newMsg.senderId,
      sender_name: newMsg.senderName,
      message: newMsg.message ?? null,
      image_url: newMsg.imageUrl ?? null,
      audio_url: newMsg.audioUrl ?? null,
      reactions: {},
      timestamp: newMsg.timestamp,
    });
    if (error) {
      console.error('বার্তা পাঠাতে ব্যর্থ:', error.message);
      alert('বার্তা পাঠাতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ যাচাই করুন।');
      setMessages(prev => prev.filter(m => m.id !== newMsg.id));
    }
    setSending(false);
  };

  const handleDelete = async (msg: TeacherMessage) => {
    if (msg.senderId !== user.id) return;
    if (!confirm('এই বার্তাটি মুছে ফেলতে চান?')) return;
    const prevMessages = messages;
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    const { error } = await supabase.from('teacher_messages').delete().eq('id', msg.id);
    if (error) {
      console.error('মুছতে ব্যর্থ:', error.message);
      alert('বার্তাটি মুছতে সমস্যা হয়েছে।');
      setMessages(prevMessages);
    }
  };

  const handleReact = async (msg: TeacherMessage, emoji: string) => {
    setReactionPickerFor(null);
    const current = msg.reactions ?? {};
    const nextReactions: Record<string, string[]> = {};
    // এক ইউজার একটামাত্র রিঅ্যাকশন রাখবে — আগেরটা সরিয়ে নতুনটা বসবে
    Object.entries(current).forEach(([emo, ids]) => {
      const filtered = ids.filter(id => id !== user.id);
      if (filtered.length) nextReactions[emo] = filtered;
    });
    const alreadyHadThis = (current[emoji] || []).includes(user.id);
    if (!alreadyHadThis) {
      nextReactions[emoji] = [...(nextReactions[emoji] || []), user.id];
    }

    setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, reactions: nextReactions } : m)));
    const { error } = await supabase.from('teacher_messages').update({ reactions: nextReactions }).eq('id', msg.id);
    if (error) console.error('রিঅ্যাকশন সংরক্ষণে ব্যর্থ:', error.message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // তারিখ অনুযায়ী গ্রুপ করা
  const grouped: { date: string; items: TeacherMessage[] }[] = [];
  messages.forEach(m => {
    const label = dateLabel(m.timestamp);
    const last = grouped[grouped.length - 1];
    if (last && last.date === label) last.items.push(m);
    else grouped.push({ date: label, items: [m] });
  });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-green-700 to-green-900 p-4 text-white flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          <Users size={20} />
        </div>
        <div>
          <h2 className="font-bold">শিক্ষক গ্রুপ</h2>
          <p className="text-xs text-white/70">মেসেজ, ছবি ও ভয়েস — সবার সাথে শেয়ার করুন</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" onClick={() => setReactionPickerFor(null)}>
        {loading && (
          <div className="flex items-center justify-center h-full text-gray-400 gap-2">
            <Loader2 size={20} className="animate-spin" /> লোড হচ্ছে...
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400">
            এখনো কোনো বার্তা নেই। প্রথম বার্তাটি আপনিই পাঠান!
          </div>
        )}
        {grouped.map(group => (
          <div key={group.date} className="space-y-3">
            <div className="flex justify-center">
              <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full">{group.date}</span>
            </div>
            {group.items.map(m => {
              const isMine = m.senderId === user.id;
              const reactionEntries = Object.entries(m.reactions || {}).filter(([, ids]) => ids.length > 0);
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col group relative`}>
                    {!isMine && (
                      <span className="text-xs font-semibold text-green-700 mb-0.5 px-1">{m.senderName}</span>
                    )}
                    <div className="relative flex items-center gap-1">
                      {isMine && (
                        <div className="hidden group-hover:flex items-center gap-0.5">
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(m); }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-3 py-2 shadow-sm ${
                          isMine ? 'bg-green-600 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
                        }`}
                      >
                        {m.imageUrl && (
                          <img
                            src={m.imageUrl}
                            alt="শেয়ার করা ছবি"
                            className="rounded-xl max-w-full max-h-72 object-contain mb-1"
                          />
                        )}
                        {m.audioUrl && (
                          <VoiceBubblePlayer src={m.audioUrl} tint={isMine ? 'mine' : 'theirs'} />
                        )}
                        {m.message && <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>}
                      </div>
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <button
                          onClick={e => { e.stopPropagation(); setReactionPickerFor(reactionPickerFor === m.id ? null : m.id); }}
                          className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition"
                          title="রিঅ্যাক্ট করুন"
                        >
                          <SmilePlus size={14} />
                        </button>
                      </div>

                      {reactionPickerFor === m.id && (
                        <div
                          onClick={e => e.stopPropagation()}
                          className={`absolute z-10 -top-11 ${isMine ? 'right-0' : 'left-0'} bg-white shadow-lg border border-gray-100 rounded-full px-2 py-1 flex gap-1`}
                        >
                          {REACTION_EMOJIS.map(emo => (
                            <button
                              key={emo}
                              onClick={() => handleReact(m, emo)}
                              className="text-lg hover:scale-125 transition-transform"
                            >
                              {emo}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {reactionEntries.length > 0 && (
                      <div className={`flex gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'} px-1`}>
                        {reactionEntries.map(([emo, ids]) => (
                          <button
                            key={emo}
                            onClick={() => handleReact(m, emo)}
                            className={`text-xs px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
                              ids.includes(user.id) ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
                            }`}
                          >
                            <span>{emo}</span>
                            <span className="text-gray-500">{ids.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="text-[10px] text-gray-400 mt-0.5 px-1">{timeLabel(m.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 p-3 bg-white">
        {pendingImage && (
          <div className="relative inline-block mb-2">
            <img src={pendingImage.url} alt="preview" className="h-20 rounded-lg border border-gray-200" />
            <button
              onClick={() => { URL.revokeObjectURL(pendingImage.url); setPendingImage(null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow"
            >
              <X size={12} />
            </button>
          </div>
        )}
        {pendingAudio && (
          <div className="flex items-center gap-2 mb-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 max-w-xs">
            <VoiceBubblePlayer src={pendingAudio.url} tint="theirs" />
            <button onClick={() => { URL.revokeObjectURL(pendingAudio.url); setPendingAudio(null); }} className="p-1 text-gray-400 hover:text-red-500">
              <X size={14} />
            </button>
          </div>
        )}
        {recording && (
          <div className="flex items-center gap-2 mb-2 bg-red-50 rounded-xl px-3 py-2 border border-red-200 max-w-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-red-600 font-medium">রেকর্ড হচ্ছে... {formatDuration(recordSeconds)}</span>
            <button onClick={cancelRecording} className="p-1 text-gray-400 hover:text-red-500 ml-1" title="বাতিল">
              <X size={14} />
            </button>
            <button onClick={stopRecording} className="p-1.5 bg-red-500 text-white rounded-full" title="রেকর্ডিং শেষ করুন">
              <Square size={12} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImagePick}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition"
            title="ছবি সংযুক্ত করুন"
            disabled={recording || uploading}
          >
            <ImageIcon size={20} />
          </button>
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            className={`p-2.5 rounded-xl transition ${recording ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            title="ভয়েস মেসেজ"
            disabled={uploading}
          >
            <Mic size={20} />
          </button>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="আপনার মতামত লিখুন..."
            rows={1}
            className="flex-1 resize-none px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none max-h-28"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || recording || (!text.trim() && !pendingImage && !pendingAudio)}
            className="p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
