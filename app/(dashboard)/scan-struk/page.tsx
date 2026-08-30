'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, Button } from '@/components/ui';
import { FiCamera, FiCheckCircle, FiRefreshCw, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '@/store';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/utils/helpers';

const CATEGORIES = ['Operasional', 'Perlengkapan', 'Gaji', 'Sewa', 'Marketing', 'Lainnya'];

async function runGeminiOCR(file: File): Promise<{
  amount: number;
  description: string;
  category: string;
  date: string;
  merchant: string | null;
}> {
  // Konversi file ke base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Hapus prefix "data:image/...;base64,"
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? 'Gagal menganalisis struk');
  }

  return data;
}

export default function ScanStrukPage() {
  const { user, businessId } = useAuth({ requireAuth: true });
  const { addNotification } = useNotificationStore();
  const router = useRouter();

  const [step, setStep] = useState<'upload' | 'scanning' | 'review' | 'done'>('upload');
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [scanSteps, setScanSteps] = useState<string[]>([]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      addNotification('Hanya file gambar yang diperbolehkan', 'error');
      return;
    }

    setSelectedFile(file);
    setOcrError(null);
    setScanSteps([]);

    // Tampilkan preview
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setStep('scanning');

    // Animasi step scanning
    const steps = ['Mendeteksi teks', 'Ekstrak jumlah', 'Klasifikasi kategori'];
    steps.forEach((s, i) => {
      setTimeout(() => setScanSteps(prev => [...prev, s]), i * 700);
    });

    try {
      const result = await runGeminiOCR(file);
      setParsed(result);
      setStep('review');
    } catch (err: any) {
      setOcrError(err.message ?? 'Gagal menganalisis struk');
      setStep('review');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSave = async () => {
    if (!businessId || !parsed || !user) return;
    setSaving(true);
    try {
      let receipt_url = null;

      // Upload foto struk ke Supabase Storage
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${businessId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, selectedFile, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);

        receipt_url = publicUrl;
      }

      const { error } = await supabase.from('transactions').insert({
        business_id: businessId,
        created_by: user.id,
        type: 'expense',
        amount: parsed.amount,
        description: parsed.description,
        category: parsed.category,
        date: new Date(parsed.date).toISOString(),
        payment_method: 'cash',
        receipt_url,
      });

      if (error) throw error;
      addNotification('Transaksi dari struk berhasil disimpan!', 'success');
      setStep('done');
    } catch (err: any) {
      addNotification(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setPreview(null);
    setParsed(null);
    setSelectedFile(null);
    setOcrError(null);
    setScanSteps([]);
  };

  const steps = ['Upload', 'Analisis', 'Review', 'Selesai'];
  const stepKeys = ['upload', 'scanning', 'review', 'done'];

  return (
    <DashboardLayout title="Scan Struk  Smart OCR">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          {steps.map((s, i) => {
            const active = stepKeys.indexOf(step) >= i;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${active ? 'bg-primary text-darker' : 'bg-white/10 text-white/40'}`}>{i + 1}</div>
                <span className={`text-xs ${active ? 'text-white' : 'text-white/40'}`}>{s}</span>
                {i < 3 && <div className="w-6 h-px bg-white/10" />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card hover={false}>
                <div
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => document.getElementById('struk-file')?.click()}
                  className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-primary/50 hover:bg-white/5 transition-smooth cursor-pointer"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiCamera size={32} className="text-white/30" />
                  </div>
                  <p className="font-semibold text-lg mb-2">Upload Foto Struk</p>
                  <p className="text-white/50 text-sm mb-4">Drag & drop atau klik untuk pilih foto</p>
                  <p className="text-xs text-white/30">Mendukung JPG, PNG, WEBP</p>
                  <input id="struk-file" type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                </div>
                <div className="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-xl">
                  <p className="text-sm text-accent font-semibold mb-1">💡 Tips untuk hasil terbaik:</p>
                  <ul className="text-xs text-white/60 space-y-1 list-disc list-inside">
                    <li>Pastikan struk tidak terlipat dan pencahayaan cukup</li>
                    <li>Foto dari atas dengan posisi lurus</li>
                    <li>Seluruh teks struk terlihat jelas</li>
                  </ul>
                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 2: Scanning  Gemini sedang proses */}
          {step === 'scanning' && (
            <motion.div key="scanning" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <Card hover={false}>
                {preview && <img src={preview} alt="struk" className="w-full max-h-48 object-contain rounded-xl mb-6 opacity-70" />}
                <div className="text-center py-8">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
                    <FiCamera size={22} className="absolute inset-0 m-auto text-primary" />
                  </div>
                  <p className="font-semibold text-lg">Menganalisis struk...</p>
                  <p className="text-white/50 text-sm mt-2">Gemini AI sedang membaca dan mengekstrak data</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {scanSteps.map((t) => (
                      <motion.span key={t} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        className="text-xs px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary/80">
                        ✓ {t}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 3: Review */}
          {step === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card hover={false}>
                {/* Error state */}
                {ocrError ? (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                      <FiAlertCircle className="text-red-400 shrink-0" size={18} />
                      <div>
                        <p className="font-semibold text-sm text-red-400">Gagal menganalisis struk</p>
                        <p className="text-xs text-white/50 mt-0.5">{ocrError}</p>
                      </div>
                    </div>
                    {preview && <img src={preview} alt="struk" className="w-full max-h-36 object-contain rounded-xl mb-4 opacity-60" />}
                    <p className="text-sm text-white/60 mb-4">Isi data transaksi secara manual:</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <FiCheckCircle className="text-green-400" size={16} />
                    </div>
                    <div>
                      <p className="font-semibold">Data berhasil diekstrak!</p>
                      <p className="text-xs text-white/50">Periksa dan sesuaikan sebelum menyimpan</p>
                    </div>
                  </div>
                )}

                {!ocrError && preview && (
                  <img src={preview} alt="struk" className="w-full max-h-36 object-contain rounded-xl mb-4 opacity-60" />
                )}

                {/* Form  pakai nilai dari OCR atau kosong jika error */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Deskripsi</label>
                    <input type="text" className="input-field" value={parsed?.description ?? ''}
                      onChange={e => setParsed((p: any) => ({ ...(p ?? {}), description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Merchant / Toko</label>
                    <input type="text" className="input-field" placeholder="Opsional"
                      value={parsed?.merchant ?? ''}
                      onChange={e => setParsed((p: any) => ({ ...(p ?? {}), merchant: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1">Jumlah (Rp)</label>
                      <input type="number" className="input-field" value={parsed?.amount ?? ''}
                        onChange={e => setParsed((p: any) => ({ ...(p ?? {}), amount: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1">Tanggal</label>
                      <input type="date" className="input-field" value={parsed?.date ?? new Date().toISOString().split('T')[0]}
                        onChange={e => setParsed((p: any) => ({ ...(p ?? {}), date: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Kategori</label>
                    <select className="input-field" value={parsed?.category ?? 'Lainnya'}
                      onChange={e => setParsed((p: any) => ({ ...(p ?? {}), category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Preview jumlah */}
                {parsed?.amount > 0 && (
                  <div className="mt-4 p-3 bg-white/5 rounded-xl flex justify-between items-center">
                    <span className="text-sm text-white/50">Total yang akan dicatat</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(parsed.amount)}</span>
                  </div>
                )}

                <div className="flex gap-2 mt-5">
                  <Button type="button" variant="secondary" onClick={reset}>
                    <FiRefreshCw size={14} /> Scan Ulang
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="flex-1 justify-center"
                    onClick={handleSave}
                    disabled={saving || !parsed?.amount}
                  >
                    {saving ? 'Menyimpan...' : <><FiCheckCircle size={14} /> Simpan Transaksi</>}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* STEP 4: Done */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Card hover={false}>
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle size={40} className="text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Transaksi Tersimpan!</h3>
                  <p className="text-white/50 text-sm mb-2">Data dari struk berhasil ditambahkan ke riwayat transaksi.</p>
                  {parsed?.merchant && (
                    <p className="text-xs text-white/40 mb-6">📍 {parsed.merchant}</p>
                  )}
                  <div className="flex gap-3 justify-center">
                    <Button variant="secondary" onClick={reset}><FiCamera size={14} /> Scan Lagi</Button>
                    <Button variant="primary" onClick={() => router.push('/transactions')}>
                      Lihat Transaksi <FiArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
