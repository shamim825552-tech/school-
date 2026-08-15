import { useRef, useState } from 'react';
import { User, ParentVerification, VerificationStatus } from '../types';
import { getVerifications, saveVerifications, getStudents } from '../data';
import { fileToResizedDataUrl } from '../utils/imageFile';
import {
  BadgeCheck, ShieldAlert, Clock3, UploadCloud, IdCard, FileText, CheckCircle2,
} from 'lucide-react';

const STATUS_LABEL: Record<VerificationStatus, string> = {
  pending: 'পর্যালোচনাধীন — অ্যাডমিন শীঘ্রই যাচাই করবেন', verified: 'ভেরিফাইড', rejected: 'প্রত্যাখ্যাত',
};
const STATUS_COLOR: Record<VerificationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

interface Props {
  user: User;
}

export default function ParentVerificationForm({ user }: Props) {
  const existing = getVerifications().find(v => v.parentId === user.id) || null;
  const [nidNumber, setNidNumber] = useState(existing?.nidNumber ?? '');
  const [birthRegNumber, setBirthRegNumber] = useState(existing?.birthRegNumber ?? '');
  const [nidImage, setNidImage] = useState<string | undefined>(existing?.nidImage);
  const [birthRegImage, setBirthRegImage] = useState<string | undefined>(existing?.birthRegImage);
  const [record, setRecord] = useState<ParentVerification | null>(existing);
  const [uploading, setUploading] = useState<'nid' | 'birth' | null>(null);
  const [success, setSuccess] = useState('');
  const nidInputRef = useRef<HTMLInputElement>(null);
  const birthInputRef = useRef<HTMLInputElement>(null);

  const child = user.childId ? getStudents().find(s => s.id === user.childId) : undefined;

  const handleUpload = async (type: 'nid' | 'birth', file: File) => {
    setUploading(type);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      if (type === 'nid') setNidImage(dataUrl); else setBirthRegImage(dataUrl);
    } catch {
      alert('ছবি আপলোড করা যায়নি, আবার চেষ্টা করুন।');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = () => {
    if (!nidImage && !birthRegImage) {
      alert('অন্তত একটি ডকুমেন্ট (NID বা জন্ম নিবন্ধন) ছবি আপলোড করুন।');
      return;
    }
    const now = Date.now();
    const items = getVerifications();
    const updatedRecord: ParentVerification = {
      id: user.id,
      parentId: user.id,
      parentName: user.name,
      parentPhone: user.phone,
      childId: user.childId,
      childName: child?.name,
      nidNumber: nidNumber.trim() || undefined,
      nidImage,
      birthRegNumber: birthRegNumber.trim() || undefined,
      birthRegImage,
      status: 'pending',
      submittedAt: existing?.submittedAt ?? now,
      updatedAt: now,
      verifiedBy: undefined,
      verifiedByName: undefined,
      verifiedAt: undefined,
      rejectionReason: undefined,
    };
    const updated = existing ? items.map(v => v.id === user.id ? updatedRecord : v) : [...items, updatedRecord];
    saveVerifications(updated);
    setRecord(updatedRecord);
    setSuccess('আপনার ডকুমেন্ট জমা দেওয়া হয়েছে, অ্যাডমিন যাচাই করার পর ভেরিফাই ব্যাজ পাবেন।');
    setTimeout(() => setSuccess(''), 4000);
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-700 to-purple-900 p-5 text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><IdCard size={22} /></div>
          <div>
            <h2 className="font-bold">ডকুমেন্ট ভেরিফিকেশন</h2>
            <p className="text-xs text-white/70">আপনার NID ও সন্তানের জন্ম নিবন্ধন যোগ করুন</p>
          </div>
        </div>

        {record && (
          <div className={`mx-5 mt-5 border rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-medium ${STATUS_COLOR[record.status]}`}>
            {record.status === 'verified' && <BadgeCheck size={18} />}
            {record.status === 'rejected' && <ShieldAlert size={18} />}
            {record.status === 'pending' && <Clock3 size={18} />}
            <span>{STATUS_LABEL[record.status]}</span>
          </div>
        )}
        {record?.status === 'rejected' && record.rejectionReason && (
          <p className="mx-5 mt-2 text-xs text-red-500">কারণ: {record.rejectionReason} — সংশোধন করে আবার জমা দিন</p>
        )}

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">আপনার জাতীয় পরিচয়পত্র নম্বর (NID)</label>
            <input type="text" value={nidNumber} onChange={e => setNidNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm" placeholder="যেমন: ১২৩৪৫৬৭৮৯০" />
            <input ref={nidInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleUpload('nid', e.target.files[0])} />
            <button onClick={() => nidInputRef.current?.click()}
              className="mt-2 w-full border-2 border-dashed border-gray-300 rounded-xl py-4 flex flex-col items-center gap-1 text-gray-500 hover:border-purple-400 hover:text-purple-600 transition text-sm">
              {nidImage ? <img src={nidImage} className="h-20 rounded-lg object-cover" /> : <UploadCloud size={22} />}
              <span>{uploading === 'nid' ? 'আপলোড হচ্ছে...' : nidImage ? 'ছবি পরিবর্তন করুন' : 'NID কার্ডের ছবি আপলোড করুন'}</span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">সন্তানের জন্ম নিবন্ধন নম্বর</label>
            <input type="text" value={birthRegNumber} onChange={e => setBirthRegNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm" placeholder="জন্ম নিবন্ধন নম্বর" />
            <input ref={birthInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && handleUpload('birth', e.target.files[0])} />
            <button onClick={() => birthInputRef.current?.click()}
              className="mt-2 w-full border-2 border-dashed border-gray-300 rounded-xl py-4 flex flex-col items-center gap-1 text-gray-500 hover:border-purple-400 hover:text-purple-600 transition text-sm">
              {birthRegImage ? <img src={birthRegImage} className="h-20 rounded-lg object-cover" /> : <FileText size={22} />}
              <span>{uploading === 'birth' ? 'আপলোড হচ্ছে...' : birthRegImage ? 'ছবি পরিবর্তন করুন' : 'জন্ম নিবন্ধনের ছবি আপলোড করুন'}</span>
            </button>
          </div>

          {success && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
              <CheckCircle2 size={18} /> {success}
            </div>
          )}

          <button onClick={handleSubmit}
            className="w-full py-3 rounded-xl text-white font-bold bg-gradient-to-r from-purple-700 to-purple-900 hover:shadow-lg transform hover:-translate-y-0.5 transition-all">
            জমা দিন
          </button>
          <p className="text-xs text-gray-400 text-center">জমা দেওয়ার পর অ্যাডমিন আপনার তথ্য যাচাই করে ভেরিফাই ব্যাজ দেবেন।</p>
        </div>
      </div>
    </div>
  );
}
