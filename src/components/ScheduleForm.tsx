/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlusCircle, Calendar, Link, MessageSquare, AlertCircle, Save, X, PhoneCall, Camera, Instagram } from 'lucide-react';
import { RegistrationSchedule, DEFAULT_TEMPLATE } from '../types';
import WaTemplatePicker from './WaTemplatePicker';

interface ScheduleFormProps {
  onSave: (schedule: Omit<RegistrationSchedule, 'id' | 'reminderSent2Days' | 'openedPostSent'>) => void;
  onCancel?: () => void;
  initialData?: RegistrationSchedule;
}

export default function ScheduleForm({ onSave, onCancel, initialData }: ScheduleFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [regLink, setRegLink] = useState(initialData?.regLink || '');
  const [openTime, setOpenTime] = useState(
    initialData ? new Date(initialData.openTime).toISOString().slice(0, 16) : ''
  );
  const [closeTime, setCloseTime] = useState(
    initialData ? new Date(initialData.closeTime).toISOString().slice(0, 16) : ''
  );
  const [waGroupLink, setWaGroupLink] = useState(initialData?.waGroupLink || '');
  const [messageTemplate, setMessageTemplate] = useState(initialData?.messageTemplate || DEFAULT_TEMPLATE);
  const [isSimulatedAuto, setIsSimulatedAuto] = useState(initialData?.isSimulatedAuto ?? true);
  const [igAccountLink, setIgAccountLink] = useState(initialData?.igAccountLink || '');

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Nama pendaftaran wajib diisi');
      return;
    }
    if (!openTime) {
      setError('Tanggal buka wajib ditentukan');
      return;
    }
    if (!closeTime) {
      setError('Tanggal tutup wajib ditentukan');
      return;
    }

    const openDate = new Date(openTime);
    const closeDate = new Date(closeTime);

    if (closeDate <= openDate) {
      setError('Tanggal tutup harus setelah tanggal buka');
      return;
    }

    // Default template variables check
    onSave({
      name,
      description,
      regLink: regLink.trim() || 'https://link-registrasi-aktif.com',
      openTime: openDate.toISOString(),
      closeTime: closeDate.toISOString(),
      waGroupLink: waGroupLink.trim() || 'https://chat.whatsapp.com/ExampleGroupCode',
      messageTemplate,
      isSimulatedAuto,
      igAccountLink: igAccountLink.trim() || undefined,
    });
  };

  const handleSetSample = () => {
    // Fill out sample values for quick demonstration
    const now = new Date();
    
    // Set opening 2 days and 5 minutes from now for demonstration, closures 5 days from now
    const dummyOpen = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000);
    const dummyClose = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    
    setName('Beasiswa Indonesia Emas 2026');
    setDescription('Program Beasiswa Tahunan untuk Mahasiswa Berprestasi Tingkat Nasional.');
    setRegLink('https://indonesiaemas.sch.id/beasiswa-2026');
    setOpenTime(dummyOpen.toISOString().slice(0, 16));
    setCloseTime(dummyClose.toISOString().slice(0, 16));
    setWaGroupLink('https://chat.whatsapp.com/JZK8s27H9k3HLkwS8HfkE7');
    setIsSimulatedAuto(true);
    setIgAccountLink('https://instagram.com/kemdikbud.ri');
  };

  const formatVariables = {
    nama_pendaftaran: name || '[Nama Kegiatan Anda]',
    link_pendaftaran: regLink || '[Link Form Pendaftaran]',
    tgl_buka: openTime ? new Date(openTime).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '[Waktu Buka]',
    tgl_tutup: closeTime ? new Date(closeTime).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : '[Waktu Tutup]',
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#161618] rounded-2xl border border-[#2A2A2D] p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#2A2A2D] gap-4">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {initialData ? '✍️ Edit Jadwal Pendaftaran' : '✨ Tambah Pengingat Pendaftaran Baru'}
          </h3>
          <p className="text-xs text-gray-450 mt-0.5">
            Atur timeline pendaftaran dan draf WhatsApp grup otomatis.
          </p>
        </div>
        {!initialData && (
          <button
            type="button"
            onClick={handleSetSample}
            className="px-3 py-1.5 text-xs font-bold text-[#00D1FF] bg-[#00D1FF]/10 hover:bg-[#00D1FF]/20 border border-[#00D1FF]/35 rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Gunakan Contoh Data
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Nama Kegiatan / Pendaftaran <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#0F0F10] border border-[#2A2A2D] text-white rounded-xl focus:ring-2 focus:ring-[#00D1FF]/20 focus:border-[#00D1FF] outline-none transition-all placeholder-gray-600 font-medium"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Seleksi Volunteer Olimpiade Merdeka"
              />
              <Calendar className="w-4 h-4 text-[#00D1FF]/80 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Deskripsi Singkat
            </label>
            <textarea
              className="w-full px-3 py-2 h-20 text-sm bg-[#0F0F10] border border-[#2A2A2D] text-white rounded-xl focus:ring-2 focus:ring-[#00D1FF]/20 focus:border-[#00D1FF] outline-none transition-all placeholder-gray-600 resize-none font-medium"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan secara ringkas info kegiatan..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Link Form/Situs Pendaftaran <span className="text-gray-500 text-xs normal-case">(Masuk ke template)</span>
            </label>
            <div className="relative">
              <input
                type="url"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#0F0F10] border border-[#2A2A2D] text-white rounded-xl focus:ring-2 focus:ring-[#00D1FF]/20 focus:border-[#00D1FF] outline-none transition-all placeholder-gray-600 font-medium"
                value={regLink}
                onChange={(e) => setRegLink(e.target.value)}
                placeholder="https://gform.com/seleksi-volunteer"
              />
              <Link className="w-4 h-4 text-[#00D1FF]/80 absolute left-3 top-3.5" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Jadwal Buka <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 text-sm bg-[#0F0F10] border border-[#2A2A2D] text-white rounded-xl focus:ring-2 focus:ring-[#00D1FF]/20 focus:border-[#00D1FF] outline-none transition-all font-semibold"
                style={{ colorScheme: 'dark' }}
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Jadwal Tutup <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 text-sm bg-[#0F0F10] border border-[#2A2A2D] text-white rounded-xl focus:ring-2 focus:ring-[#00D1FF]/20 focus:border-[#00D1FF] outline-none transition-all font-semibold"
                style={{ colorScheme: 'dark' }}
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
              <span>Tautan WhatsApp Group / Nomor Admin <span className="text-gray-500 text-xs normal-case">(Tujuan pengiriman)</span></span>
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#0F0F10] border border-[#2A2A2D] text-white rounded-xl focus:ring-2 focus:ring-[#00D1FF]/20 focus:border-[#00D1FF] outline-none transition-all placeholder-gray-600 font-medium"
                value={waGroupLink}
                onChange={(e) => setWaGroupLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
              />
              <MessageSquare className="w-4 h-4 text-[#00D1FF]/80 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
              <span>Link Akun Instagram / Sosmed</span>
              <span className="text-gray-500 text-[10px] normal-case font-medium">(Opsional untuk posting story)</span>
            </label>
            <div className="relative">
              <input
                type="url"
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#0F0F10] border border-[#2A2A2D] text-white rounded-xl focus:ring-2 focus:ring-[#00D1FF]/20 focus:border-[#00D1FF] outline-none transition-all placeholder-gray-600 font-medium"
                value={igAccountLink}
                onChange={(e) => setIgAccountLink(e.target.value)}
                placeholder="https://instagram.com/akun_anda"
              />
              <Instagram className="w-4 h-4 text-[#00D1FF]/80 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer text-gray-300">
              <input
                type="checkbox"
                className="mt-1 accent-[#00D1FF] w-4 h-4 rounded cursor-pointer border-[#2A2A2D] bg-[#0F0F10]"
                checked={isSimulatedAuto}
                onChange={(e) => setIsSimulatedAuto(e.target.checked)}
              />
              <div className="text-xs">
                <span className="font-bold block text-white">Aktifkan Simulasi Auto-Post</span>
                Sistem akan menyimulasikan kiriman terjadwal ke terminal log begitu jam buka tercapai.
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* WhatsApp Template editor block */}
      <div className="pt-4 border-t border-[#2A2A2D]">
        <WaTemplatePicker
          value={messageTemplate}
          onChange={setMessageTemplate}
          variables={formatVariables}
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2A2D]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white bg-[#1A1A1D] hover:bg-[#2A2A2D] border border-[#2A2A2D] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-4 h-4" /> Batal
          </button>
        )}
        <button
          type="submit"
          className="px-5 py-2 text-xs font-bold text-black bg-[#00D1FF] hover:bg-[#00b9e6] shadow-[0_4px_12px_rgba(0,209,255,0.2)] hover:shadow-[0_4px_16px_rgba(0,209,255,0.35)] rounded-xl transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.01]"
        >
          <Save className="w-4 h-4" /> {initialData ? 'Simpan Perubahan' : 'Mulai Jalankan Pengingat'}
        </button>
      </div>
    </form>
  );
}

// Sparkles local icon simulation since we didn't import it
function Sparkles({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
    </svg>
  );
}
