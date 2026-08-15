import { AISettings } from '../types';

// ============================================================
// AI প্রোভাইডার ক্লায়েন্ট
// ⚠️ এই অ্যাপে কোনো ব্যাকএন্ড সার্ভার নেই — তাই AI API key ব্রাউজার
// থেকেই সরাসরি কল করা হয় (এই প্রজেক্টের বাকি সব ফিচারও একইভাবে
// Supabase-এ সরাসরি ব্রাউজার থেকে কানেক্ট করে)। এটি শুধুমাত্র স্কুলের
// ভেতরের/বিশ্বস্ত ব্যবহারের জন্য উপযুক্ত। সত্যিকারের প্রোডাকশন
// নিরাপত্তার জন্য ভবিষ্যতে একটি সার্ভার/Edge Function এর মাধ্যমে key
// লুকিয়ে রাখা উচিত।
// ============================================================

export const PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI (GPT)',
  anthropic: 'Anthropic (Claude)',
  gemini: 'Google Gemini',
  custom: 'কাস্টম (OpenAI-compatible)',
};

export const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-5',
  gemini: 'gemini-2.5-flash',
  custom: '',
};

// ছবির data URL থেকে "data:image/jpeg;base64," অংশ আলাদা করে
function splitDataUrl(dataUrl: string): { mediaType: string; base64: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/s);
  if (!match) return { mediaType: 'image/jpeg', base64: dataUrl };
  return { mediaType: match[1], base64: match[2] };
}

async function callOpenAILike(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string | undefined,
  prompt: string,
  imageDataUrl?: string
): Promise<string> {
  const content: any[] = [{ type: 'text', text: prompt }];
  if (imageDataUrl) {
    content.push({ type: 'image_url', image_url: { url: imageDataUrl } });
  }
  const messages: any[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: 1500 }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `API ত্রুটি (${res.status})`);
  }
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('AI থেকে কোনো উত্তর পাওয়া যায়নি।');
  return text as string;
}

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string | undefined,
  prompt: string,
  imageDataUrl?: string
): Promise<string> {
  const content: any[] = [{ type: 'text', text: prompt }];
  if (imageDataUrl) {
    const { mediaType, base64 } = splitDataUrl(imageDataUrl);
    content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } });
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content }],
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `API ত্রুটি (${res.status})`);
  }
  const text = data?.content?.find((c: any) => c.type === 'text')?.text;
  if (!text) throw new Error('AI থেকে কোনো উত্তর পাওয়া যায়নি।');
  return text as string;
}

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string | undefined,
  prompt: string,
  imageDataUrl?: string
): Promise<string> {
  const parts: any[] = [{ text: prompt }];
  if (imageDataUrl) {
    const { mediaType, base64 } = splitDataUrl(imageDataUrl);
    parts.push({ inline_data: { mime_type: mediaType, data: base64 } });
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `API ত্রুটি (${res.status})`);
  }
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('');
  if (!text) throw new Error('AI থেকে কোনো উত্তর পাওয়া যায়নি।');
  return text as string;
}

export async function askAI(settings: AISettings, prompt: string, imageDataUrl?: string): Promise<string> {
  if (!settings.apiKey) {
    throw new Error('AI এখনো সেট আপ করা হয়নি। অ্যাডমিনকে AI সেটিংস থেকে API key যোগ করতে বলুন।');
  }
  const model = settings.model || DEFAULT_MODELS[settings.provider] || '';

  switch (settings.provider) {
    case 'openai':
      return callOpenAILike(
        'https://api.openai.com/v1/chat/completions',
        settings.apiKey,
        model,
        settings.systemPrompt,
        prompt,
        imageDataUrl
      );
    case 'anthropic':
      return callAnthropic(settings.apiKey, model, settings.systemPrompt, prompt, imageDataUrl);
    case 'gemini':
      return callGemini(settings.apiKey, model, settings.systemPrompt, prompt, imageDataUrl);
    case 'custom': {
      if (!settings.baseUrl) throw new Error('কাস্টম প্রোভাইডারের জন্য Base URL দিতে হবে।');
      return callOpenAILike(settings.baseUrl, settings.apiKey, model, settings.systemPrompt, prompt, imageDataUrl);
    }
    default:
      throw new Error('অজানা AI প্রোভাইডার।');
  }
}

// ছবি পাঠানোর আগে ছোট করে (max ১০০০px চওড়া, jpeg quality 0.7)
export function resizeImageFile(file: File): Promise<string> {
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
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
