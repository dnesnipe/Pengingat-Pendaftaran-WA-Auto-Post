/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Bold, 
  Italic, 
  Sliders, 
  Smartphone, 
  Smile, 
  CheckCircle2, 
  AlertTriangle, 
  Type, 
  Copy, 
  Check, 
  Info,
  Layers,
  Wand2
} from 'lucide-react';

interface WaTemplatePickerProps {
  value: string;
  onChange: (value: string) => void;
  variables: {
    nama_pendaftaran: string;
    link_pendaftaran: string;
    tgl_buka: string;
    tgl_tutup: string;
  };
}

// Global formatter utility designed to be backward compatible in App.tsx
export function parseWhatsAppFormat(
  text: string, 
  highlightVariables: boolean = false, 
  customValues?: {
    nama_pendaftaran: string;
    link_pendaftaran: string;
    tgl_buka: string;
    tgl_tutup: string;
  }
): React.ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Regex splits line into blocks: bold *word*, italic _word_, strikethrough ~word~, and dynamic variables {keyword}
    const regex = /(\*[^*]+\*|_[^_]+_|~[^~]+~|{[a-zA-Z0-9_]+})/g;
    const segments = line.split(regex);
    
    const renderedLine = segments.map((seg, sIdx) => {
      if (seg.startsWith('*') && seg.endsWith('*')) {
        return (
          <strong key={sIdx} className="font-extrabold text-[#E0E0E6] drop-shadow-sm">
            {seg.slice(1, -1)}
          </strong>
        );
      }
      if (seg.startsWith('_') && seg.endsWith('_')) {
        return (
          <em key={sIdx} className="italic text-gray-300">
            {seg.slice(1, -1)}
          </em>
        );
      }
      if (seg.startsWith('~') && seg.endsWith('~')) {
        return (
          <del key={sIdx} className="line-through text-gray-550">
            {seg.slice(1, -1)}
          </del>
        );
      }
      if (seg.startsWith('{') && seg.endsWith('}')) {
        const varName = seg.slice(1, -1);
        const rawResolved = customValues ? (customValues as any)[varName] : undefined;
        const finalVal = rawResolved || `[${varName}]`;

        if (highlightVariables) {
          return (
            <span 
              key={sIdx} 
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-lg bg-[#00D1FF]/15 text-[#00D1FF] border border-[#00D1FF]/30 font-bold text-[10px] shadow-[0_0_8px_rgba(0,209,255,0.08)] select-none shrink-0"
              title={`Variabel Dinamis: ${varName}`}
            >
              <span className="font-mono text-[8px] text-[#00D1FF]/50 mr-0.5">&#123;</span>
              {finalVal}
              <span className="font-mono text-[8px] text-[#00D1FF]/50 ml-0.5">&#125;</span>
            </span>
          );
        } else {
          return (
            <span key={sIdx} className="text-[#00D1FF] font-extrabold drop-shadow-sm">
              {finalVal}
            </span>
          );
        }
      }
      return seg;
    });

    return (
      <div key={idx} className="min-h-[1.25rem] whitespace-pre-wrap break-words leading-relaxed select-text">
        {renderedLine.length > 0 ? renderedLine : ' '}
      </div>
    );
  });
}

export default function WaTemplatePicker({ value, onChange, variables }: WaTemplatePickerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Tab control inside editor toolbox
  const [activeTab, setActiveTab] = useState<'simulation' | 'emojis' | 'presets'>('presets');
  // Sorot dynamic variable toggle
  const [highlightVars, setHighlightVars] = useState<boolean>(true);
  // Shared copy state inside mockup
  const [copiedPreview, setCopiedPreview] = useState<boolean>(false);

  // Simulation Sandbox State
  const [simValues, setSimValues] = useState({
    nama_pendaftaran: variables.nama_pendaftaran || 'Beasiswa Indonesia Emas 2026',
    link_pendaftaran: variables.link_pendaftaran || 'https://form.kemdikbud.work/emas2026',
    tgl_buka: variables.tgl_buka || '19 Juni 2026 pukul 09:00',
    tgl_tutup: variables.tgl_tutup || '05 Juli 2026 pukul 23:59',
  });

  // Keep simulation values updated when external variables change
  useEffect(() => {
    setSimValues({
      nama_pendaftaran: variables.nama_pendaftaran || 'Beasiswa Indonesia Emas 2026',
      link_pendaftaran: variables.link_pendaftaran || 'https://form.kemdikbud.work/emas2026',
      tgl_buka: variables.tgl_buka || '19 Juni 2026 pukul 09:00',
      tgl_tutup: variables.tgl_tutup || '05 Juli 2026 pukul 23:59',
    });
  }, [variables]);

  // Readability feedback calculations
  const totalCharacters = value.length;
  const totalWords = value.trim() === '' ? 0 : value.trim().split(/\s+/).length;
  
  // Variable compliance checkers
  const hasNama = value.includes('{nama_pendaftaran}');
  const hasLink = value.includes('{link_pendaftaran}');
  const hasBuka = value.includes('{tgl_buka}');
  const hasTutup = value.includes('{tgl_tutup}');

  const applyFormatting = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);

    if (selectedText) {
      const newValue = beforeText + prefix + selectedText + suffix + afterText;
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        const startPos = start + prefix.length;
        const endPos = startPos + selectedText.length;
        textarea.setSelectionRange(startPos, endPos);
      }, 50);
    } else {
      const placeholder = 'teks';
      const newValue = beforeText + prefix + placeholder + suffix + afterText;
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        const startPos = start + prefix.length;
        const endPos = startPos + placeholder.length;
        textarea.setSelectionRange(startPos, endPos);
      }, 50);
    }
  };

  const insertVariable = (variableName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + variableName);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);

    const newValue = beforeText + variableName + afterText;
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + variableName.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);

    const newValue = beforeText + emoji + afterText;
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + emoji.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);
  };

  const handleCopyCleanMessage = () => {
    let cleanText = value;
    cleanText = cleanText.replace(/{nama_pendaftaran}/g, simValues.nama_pendaftaran);
    cleanText = cleanText.replace(/{link_pendaftaran}/g, simValues.link_pendaftaran);
    cleanText = cleanText.replace(/{tgl_buka}/g, simValues.tgl_buka);
    cleanText = cleanText.replace(/{tgl_tutup}/g, simValues.tgl_tutup);

    navigator.clipboard.writeText(cleanText);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  const presets = [
    {
      title: "Resmi Standard",
      category: "Official",
      template: `📣 *PENDAFTARAN DIBUKA!* 📣\n\nHalo Rekan-Rekan semua, saat ini pendaftaran untuk *{nama_pendaftaran}* sudah RESMI DIBUKA! 🎉\n\n📌 *Detail Informasi:*\n• Kegiatan: {nama_pendaftaran}\n• Link Pendaftaran: {link_pendaftaran}\n• Tanggal Buka: {tgl_buka}\n• Tanggal Tutup: {tgl_tutup}\n\nSilakan klik tautan di bawah ini untuk mendaftar:\n👉 {link_pendaftaran}\n\n🔔 _Postingan ini dikirim otomatis oleh Sistem RemindWA._`
    },
    {
      title: "Singkat & Urgent",
      category: "Urgent",
      template: `🚨 *INFO TERBARU: Pendaftaran {nama_pendaftaran} Telah Dibuka!* 🚨\n\nJangan sampai kelewatan! Pendaftaran untuk *{nama_pendaftaran}* sudah resmi dibuka mulai hari ini.\n\n🔗 Amankan slot Anda segera melalui link berikut:\n👉 {link_pendaftaran}\n\n📅 Jadwal:\n⏰ Buka: {tgl_buka}\n⚠️ Tutup: {tgl_tutup}\n\nYuk bagikan info penting ini ke kolega / grup Anda yang lain juga! 🙌`
    },
    {
      title: "Promosi Kasual",
      category: "Casual",
      template: `Halo teman-teman! 👋\n\nBuat yang nungguin info *{nama_pendaftaran}*, pendaftarannya sudah dibuka yaa hari ini! 😄🚀\n\nBagi yang mau berkontribusi, yuk buruan daftar lewat link di bawah:\n📌 {link_pendaftaran}\n\nBatas pendaftaran sampai tanggal *{tgl_tutup}*. Jangan ditunda-tunda yaa biar gak ketinggalan! 😉\n\nSemoga sukses pendaftarannya! ✨`
    },
    {
      title: "Pengingat H-1",
      category: "Reminder",
      template: `⏳ *H-1 PEMBUKAAN PENDAFTARAN* ⏳\n\nHalo semuanya, siap-siap ya! Besok pendaftaran *{nama_pendaftaran}* akan resmi dibuka.\n\n📅 Tanggal Dibuka: {tgl_buka}\n🔗 Tautan Akses: {link_pendaftaran}\n\nPastikan berkas portofolio dan dokumen administrasi sudah disiapkan malam ini agar besok tinggal apply. Semangat! 🔥`
    }
  ];

  const quickEmojis = [
    '📣', '🚨', '📌', '👉', '⏳', '📅', '🎉', '🚀', '🔥', '🏆', 
    '💡', '⏰', '⚠️', '✅', '👋', '😄', '✨', '🙌', '🎯', '👥'
  ];

  return (
    <div className="space-y-5">
      {/* Upper Panel: Advanced Variable Checklist Indicator */}
      <div className="bg-[#101011] border border-[#2A2A2D] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-[#00D1FF] uppercase flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 animate-pulse text-[#00D1FF]" />
            Validasi Kelengkapan Template
          </span>
          <p className="text-xs text-gray-400 mt-1">
            Sistem mendeteksi kehadiran variabel penting untuk memastikan informasi yang dikirimkan terperinci.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {[
            { tag: '{nama_pendaftaran}', active: hasNama, label: 'Nama' },
            { tag: '{link_pendaftaran}', active: hasLink, label: 'Link Form' },
            { tag: '{tgl_buka}', active: hasBuka, label: 'Tgl Buka' },
            { tag: '{tgl_tutup}', active: hasTutup, label: 'Tgl Tutup' }
          ].map((item) => (
            <div 
              key={item.tag} 
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 transition-all select-none ${
                item.active 
                  ? 'bg-emerald-500/10 text-[#25D366] border-[#25D366]/30 shadow-sm' 
                  : 'bg-red-500/5 text-gray-500 border-[#2A2A2D]'
              }`}
              title={item.active ? `Variabel ${item.tag} digunakan` : `Sangat disarankan memakai ${item.tag}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-[#25D366]' : 'bg-gray-600'}`} />
              <span className="font-mono">{item.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Editor & Preview Split Frame */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        
        {/* Editor Side (Columns: 7) */}
        <div className="xl:col-span-7 flex flex-col space-y-4">
          <div className="bg-[#161618] border border-[#2A2A2D] rounded-3xl p-5 space-y-4 flex flex-col justify-between flex-1">
            
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A2A2D]">
              <div>
                <h3 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-2">
                  <Type className="w-4 h-4 text-[#00D1FF]" />
                  Advanced Message Composer
                </h3>
                <span className="text-[10px] text-gray-500 font-medium">Buat template caption yang kaya visual</span>
              </div>

              {/* Rich-Text Fast Format Actions */}
              <div className="flex items-center gap-1 bg-[#101011] p-1.5 rounded-xl border border-[#2A2A2D] self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => applyFormatting('*', '*')}
                  className="p-1 px-2 text-xs font-bold text-gray-400 hover:text-white rounded-lg hover:bg-[#1A1A1D] transition-all cursor-pointer flex items-center gap-1"
                  title="Tebal (Bold)"
                >
                  <Bold className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('_', '_')}
                  className="p-1 px-2 text-xs italic text-gray-400 hover:text-white rounded-lg hover:bg-[#1A1A1D] transition-all cursor-pointer flex items-center gap-1"
                  title="Miring (Italic)"
                >
                  <Italic className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('~', '~')}
                  className="p-1 px-2 text-xs line-through text-gray-400 hover:text-white rounded-lg hover:bg-[#1A1A1D] transition-all cursor-pointer flex items-center gap-1"
                  title="Coret (Strikethrough)"
                >
                  <span className="text-[9px] font-mono">Strike</span>
                </button>
              </div>
            </div>

            {/* Main Textarea Input Block */}
            <div className="relative flex-1 min-h-[220px] flex flex-col">
              <textarea
                ref={textareaRef}
                className="w-full flex-1 p-4 text-xs font-mono bg-[#0F0F10] border border-[#2A2A2D] focus:border-[#00D1FF] text-gray-200 outline-none rounded-2xl focus:ring-2 focus:ring-[#00D1FF]/10 transition-all resize-none shadow-inner leading-relaxed"
                placeholder="Tulis draf pesan WhatsApp Anda disini..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
              />
              
              {/* Variable shortcut picker bubbles on top of Composer for faster edits */}
              <div className="flex flex-wrap gap-1.5 p-2 bg-[#0F0F10] border-t border-[#2A2A2D] rounded-b-2xl">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest pl-1 self-center mr-1">Klik untuk Semat:</span>
                {[
                  { code: '{nama_pendaftaran}', title: 'Nama Kegiatan' },
                  { code: '{link_pendaftaran}', title: 'Link Formulir' },
                  { code: '{tgl_buka}', title: 'Jadwal Buka' },
                  { code: '{tgl_tutup}', title: 'Jadwal Tutup' }
                ].map((tag) => (
                  <button
                    key={tag.code}
                    type="button"
                    onClick={() => insertVariable(tag.code)}
                    className="px-2 py-1 text-[9px] font-bold font-mono bg-[#161618] hover:bg-[#202023] text-[#00D1FF] border border-[#2A2A2D] hover:border-[#00D1FF]/40 rounded-lg cursor-pointer transition-all"
                    title={`Sematkan ${tag.title}`}
                  >
                    {tag.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Counter Progress */}
            <div className="flex items-center justify-between text-[10px] text-gray-500 select-none pb-2 font-mono">
              <span className="flex items-center gap-1">
                🗣️ <span className="text-gray-300 font-bold">{totalWords}</span> kata
              </span>
              <span className={`${totalCharacters > 800 ? 'text-amber-400' : 'text-gray-400'} font-bold`}>
                {totalCharacters} karakter
              </span>
            </div>

            {/* Bottom Toolkit Navigation (Presets / Emojis / Sandbox Sliders) */}
            <div className="border-t border-[#2A2A2D] pt-4 space-y-3">
              <div className="flex bg-[#101011] p-1 rounded-xl border border-[#2A2A2D] justify-between">
                {[
                  { id: 'presets', label: 'Presets Template', icon: Wand2 },
                  { id: 'emojis', label: 'Emoji Dock', icon: Smile },
                  { id: 'simulation', label: 'Simulasi Sandbox', icon: Sliders }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelect = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelect 
                          ? 'bg-[#1D1D20] text-[#00D1FF] border border-[#2A2A2D] shadow-sm' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Case Content Rendering */}
              <div className="min-h-[148px] justify-center flex flex-col">
                
                {activeTab === 'presets' && (
                  <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-200">
                    {presets.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => onChange(item.template)}
                        className="p-2.5 text-left rounded-xl bg-[#0F0F10] border border-[#2A2A2D] hover:border-[#00D1FF]/40 hover:bg-[#1A1A1D] cursor-pointer transition-all flex flex-col justify-between group h-[68px]"
                      >
                        <span className="text-[10px] font-black text-gray-200 block truncate group-hover:text-[#00D1FF] transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[9px] font-bold text-gray-550 inline-block uppercase bg-[#18181A] px-1.5 py-0.5 rounded border border-[#2A2A2D] self-start mt-1">
                          {item.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'emojis' && (
                  <div className="p-2 bg-[#0F0F10] rounded-xl border border-[#2A2A2D] animate-in fade-in duration-200">
                    <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wide block mb-2 text-center">Klik emoji untuk menyisipkan ke dalam teks</span>
                    <div className="grid grid-cols-10 gap-2">
                      {quickEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="h-7 text-xs bg-[#161618] hover:bg-[#1D1D20] rounded-lg transition-all flex items-center justify-center border border-[#2A2A2D] hover:border-[#2A2A2D]/80 active:scale-90 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'simulation' && (
                  <div className="grid grid-cols-2 gap-2.5 p-2 bg-[#0F0F10] rounded-xl border border-[#2A2A2D] animate-in fade-in duration-200 text-left">
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nama Kegiatan</label>
                      <input
                        type="text"
                        className="w-full px-2 py-1 text-[10px] uppercase font-bold bg-[#161618] border border-[#2A2A2D] rounded-lg focus:border-[#00D1FF] text-white outline-none"
                        value={simValues.nama_pendaftaran}
                        onChange={(e) => setSimValues({ ...simValues, nama_pendaftaran: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Tautan Pendaftaran</label>
                      <input
                        type="text"
                        className="w-full px-2 py-1 text-[10px] bg-[#161618] border border-[#2A2A2D] rounded-lg focus:border-[#00D1FF] text-white outline-none"
                        value={simValues.link_pendaftaran}
                        onChange={(e) => setSimValues({ ...simValues, link_pendaftaran: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Jadwal Buka (Simulasi)</label>
                      <input
                        type="text"
                        className="w-full px-2 py-1 text-[10px] bg-[#161618] border border-[#2A2A2D] rounded-lg focus:border-[#00D1FF] text-white outline-none"
                        value={simValues.tgl_buka}
                        onChange={(e) => setSimValues({ ...simValues, tgl_buka: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Jadwal Tutup (Simulasi)</label>
                      <input
                        type="text"
                        className="w-full px-2 py-1 text-[10px] bg-[#161618] border border-[#2A2A2D] rounded-lg focus:border-[#00D1FF] text-white outline-none"
                        value={simValues.tgl_tutup}
                        onChange={(e) => setSimValues({ ...simValues, tgl_tutup: e.target.value })}
                      />
                    </div>
                  </div>
                )}
                
              </div>
            </div>

          </div>
        </div>

        {/* Live Preview Side (Columns: 5) */}
        <div className="xl:col-span-5 flex flex-col h-full">
          <div className="bg-[#161618] border border-[#2A2A2D] rounded-3xl p-5 flex flex-col h-full space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2D]">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#00D1FF]" />
                <div>
                  <h4 className="font-extrabold text-xs text-white">Live Smart Preview</h4>
                  <span className="text-[9px] text-[#25D366] font-bold font-mono">WhatsApp Broadcast Simulator</span>
                </div>
              </div>
              
              {/* Highlight dynamic variables checkbox switch */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-3 h-3 border-[#2A2A2D] bg-[#101011] rounded accent-[#00D1FF] cursor-pointer"
                  checked={highlightVars}
                  onChange={(e) => setHighlightVars(e.target.checked)}
                />
                <span className="text-[9px] font-bold text-gray-400">Sorot Variabel</span>
              </label>
            </div>

            {/* Smart Phone Shell mockup */}
            <div className="flex-1 flex flex-col bg-[#0F0F10] border-4 border-[#2A2A2D] rounded-3xl overflow-hidden shadow-inner max-w-sm mx-auto w-full relative min-h-[360px]">
              
              {/* WhatsApp UI Top Header */}
              <div className="bg-[#0b141a] px-3 py-3 border-b border-[#2A2A2D] select-none flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Indicator Green dot for active sim */}
                  <div className="relative">
                    <div className="w-6 h-6 rounded-full bg-[#128C7E]/40 text-white text-[9px] flex items-center justify-center font-black border border-[#25D366]/30">
                      WA
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#25D366] border border-[#0b141a] rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-gray-200 leading-none">Grup Broadcast Informasi</h5>
                    <span className="text-[8px] text-[#25D366] mt-0.5 block font-bold leading-none">Anggota Pendaftar (Aktif)</span>
                  </div>
                </div>
                
                <span className="text-[9px] px-2 py-0.5 bg-[#128C7E]/20 text-[#25D366] rounded-md border border-[#25D366]/35 font-mono font-bold">
                  SENDER
                </span>
              </div>

              {/* Chat Body & Wallpaper */}
              <div 
                className="flex-1 p-3.5 overflow-y-auto space-y-3 relative select-none bg-[#0b141a]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%2300D1FF' fill-opacity='0.03'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z'/%3E%3C/g%3E%3C/svg%3E")`
                }}
              >
                
                {/* Simulated timestamp header */}
                <div className="text-center my-1 select-none">
                  <span className="bg-[#121b22] px-2.5 py-0.5 text-[8px] font-extrabold text-gray-500 rounded-md uppercase tracking-wider font-mono">
                    HARI INI (JADWAL SIARAN)
                  </span>
                </div>

                {/* WhatsApp Chat Speech Bubble */}
                <div className="max-w-[90%] bg-[#054640] border border-[#055c52] rounded-2xl py-2 px-3 shadow-[0_1.5px_4px_rgba(0,0,0,0.3)] text-xs text-[#E0E0E6] relative select-text hover:brightness-105 transition-all">
                  
                  {/* Actual Evaluated text of Message using our customizable dynamic simulator variables */}
                  <div className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed break-words">
                    {parseWhatsAppFormat(value, highlightVars, simValues)}
                  </div>
                  
                  {/* Sent Checkmarks status indicators */}
                  <div className="text-[8px] text-[#25D366]/80 text-right mt-1.5 font-mono font-bold select-none flex items-center justify-end gap-0.5">
                    12:00 <span className="text-[#34B7F1] ml-0.5 select-none font-bold">✓✓</span>
                  </div>
                </div>

              </div>

              {/* Action Button: Salin Preview Message */}
              <div className="bg-[#0b141a] p-3 border-t border-[#2A2A2D] flex items-center">
                <button
                  type="button"
                  onClick={handleCopyCleanMessage}
                  className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                    copiedPreview 
                      ? 'bg-emerald-500/10 text-[#25D366] border-emerald-500/30' 
                      : 'bg-[#18181A] hover:bg-[#202023] text-gray-400 hover:text-white border-[#2A2A2D]'
                  }`}
                >
                  {copiedPreview ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Tersalin Ke Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#00D1FF]" /> Salin Teks Siap Kirim
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Auxiliary Help Box */}
      <div className="bg-[#101011] rounded-2xl p-4 border border-[#2A2A2D] text-xs text-gray-400 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-[#00D1FF] mt-0.5 shrink-0" />
        <div className="space-y-1">
          <span className="font-extrabold text-[#00D1FF] block">💡 Panduan Sintaksis Format WhatsApp:</span>
          <p className="text-[11px] leading-relaxed">
            Untuk membuat teks bercetak tebal gunakan asteris (Contoh: <code className="text-gray-200 font-mono">*Teks Tebal*</code>), untuk cetak miring gunakan garis bawah (<code className="text-gray-200 font-mono">_Teks Miring_</code>), dan untuk mencoret teks gunakan tanda tilde (<code className="text-gray-200 font-mono">~Teks Coret~</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
