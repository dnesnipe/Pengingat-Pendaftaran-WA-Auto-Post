/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, FC } from 'react';
import { Calendar, Clock, Share2, Edit2, Trash2, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Bell, Instagram } from 'lucide-react';
import { RegistrationSchedule, DEFAULT_TEMPLATE } from '../types';

interface ScheduleCardProps {
  schedule: RegistrationSchedule;
  onEdit: (schedule: RegistrationSchedule) => void;
  onDelete: (id: string) => void;
  onAutoPostTriggered: (id: string, message: string) => void;
}

const ScheduleCard: FC<ScheduleCardProps> = ({ schedule, onEdit, onDelete, onAutoPostTriggered }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

  const [currentStatus, setCurrentStatus] = useState<'CLOSED_BEFORE' | 'WARN_H2' | 'OPEN' | 'CLOSED_AFTER'>('CLOSED_BEFORE');

  // Parse dates
  const openDate = new Date(schedule.openTime);
  const closeDate = new Date(schedule.closeTime);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const openMs = openDate.getTime() - now.getTime();
      const closeMs = closeDate.getTime() - now.getTime();

      let targetMs = 0;
      let status: 'CLOSED_BEFORE' | 'WARN_H2' | 'OPEN' | 'CLOSED_AFTER' = 'CLOSED_BEFORE';

      if (openMs > 0) {
        targetMs = openMs;
        // Check if inside the 2 days BEFORE opening threshold ("pengingat 2 hari")
        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
        if (openMs <= twoDaysInMs) {
          status = 'WARN_H2';
        } else {
          status = 'CLOSED_BEFORE';
        }
      } else if (closeMs > 0) {
        targetMs = closeMs;
        status = 'OPEN';
        
        // Auto-post trigger hook for parent when transition occurs
        if (!schedule.openedPostSent) {
          // Trigger automatic mock post
          const formattedText = getFormattedMessage();
          onAutoPostTriggered(schedule.id, formattedText);
        }
      } else {
        targetMs = 0;
        status = 'CLOSED_AFTER';
      }

      setCurrentStatus(status);

      if (targetMs <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        return;
      }

      const days = Math.floor(targetMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((targetMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((targetMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((targetMs % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, totalMs: targetMs });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [schedule.openTime, schedule.closeTime, schedule.openedPostSent]);

  const getFormattedMessage = () => {
    let msg = schedule.messageTemplate;
    const formattedBuka = openDate.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
    const formattedTutup = closeDate.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

    msg = msg.replace(/{nama_pendaftaran}/g, schedule.name);
    msg = msg.replace(/{link_pendaftaran}/g, schedule.regLink);
    msg = msg.replace(/{tgl_buka}/g, formattedBuka);
    msg = msg.replace(/{tgl_tutup}/g, formattedTutup);
    return msg;
  };

  const handleShareWa = () => {
    const text = encodeURIComponent(getFormattedMessage());
    const waUrl = `https://api.whatsapp.com/send?text=${text}`;
    window.open(waUrl, '_blank');
  };

  const handleOpenWaGroup = () => {
    if (schedule.waGroupLink.startsWith('http://') || schedule.waGroupLink.startsWith('https://')) {
      window.open(schedule.waGroupLink, '_blank');
    } else {
      window.open(`https://wa.me/${schedule.waGroupLink.replace(/[^0-9]/g, '')}`, '_blank');
    }
  };

  // UI styling based on status
  const getStatusConfig = () => {
    switch (currentStatus) {
      case 'CLOSED_BEFORE':
        return {
          title: 'Akan Datang',
          subtitle: 'Pendaftaran Belum Dibuka',
          badgeClass: 'bg-[#1A1A1D] text-gray-450 border-[#2A2A2D]',
          indicatorColor: 'bg-blue-400',
          accentBorder: 'border-[#2A2A2D]',
          accentBg: 'bg-[#0F0F10]',
          banner: null
        };
      case 'WARN_H2':
        return {
          title: 'H-2 Pengingat Aktif',
          subtitle: 'Segera Dibuka (< 48 Jam)',
          badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse',
          indicatorColor: 'bg-amber-400',
          accentBorder: 'border-amber-500/40',
          accentBg: 'bg-amber-950/20',
          banner: (
            <div className="bg-[#1C160C] border border-amber-500/25 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300 block mb-0.5">Fase Pengingat 2 Hari Terdeteksi!</span>
                Pendaftaran akan dibuka kurang dari 2 hari lagi. Seluruh informasi pengumuman grup WA sudah siap dikirimkan.
              </div>
            </div>
          )
        };
      case 'OPEN':
        return {
          title: 'Pendaftaran Dibuka',
          subtitle: 'Kirim Publikasi Sekarang',
          badgeClass: 'bg-[#00D1FF]/10 text-[#00D1FF] border-[#00D1FF]/30',
          indicatorColor: 'bg-[#00D1FF]',
          accentBorder: 'border-[#00D1FF]/45',
          accentBg: 'bg-[#00D1FF]/5',
          banner: (
            <div className="bg-[#091C24] border border-[#00D1FF]/25 rounded-xl p-3 text-xs text-cyan-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#00D1FF] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">Registrasi Sedang Dibuka!</span>
                Silakan siarkan pesan draf publikasi otomatis ke grup WhatsApp tujuan Anda.
              </div>
            </div>
          )
        };
      case 'CLOSED_AFTER':
        return {
          title: 'Terkunci / Tutup',
          subtitle: 'Pendaftaran Sudah Selesai',
          badgeClass: 'bg-[#1A1A1D] text-gray-500 border-[#2A2A2D]',
          indicatorColor: 'bg-gray-650',
          accentBorder: 'border-[#2A2A2D]',
          accentBg: 'bg-[#0F0F10]',
          banner: null
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className={`bg-[#161618] rounded-2xl border ${statusConfig.accentBorder} p-5 shadow-lg hover:shadow-xl hover:scale-[1.005] transition-all duration-300 flex flex-col justify-between space-y-4`}>
      {/* Top Section / Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-lg flex items-center gap-1.5 ${statusConfig.badgeClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.indicatorColor} inline-block`} />
              {statusConfig.title}
            </span>
            {schedule.openedPostSent && (
              <span className="bg-[#25d366]/10 text-[#25d366] border border-[#25d366]/20 text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                WA Auto-Posted
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 select-none">
            <button
              onClick={() => onEdit(schedule)}
              className="p-1.5 text-gray-400 hover:text-white bg-[#1A1A1D] hover:bg-[#2A2A2D] border border-[#2A2A2D] rounded-lg transition-colors cursor-pointer"
              title="Edit Jadwal"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(schedule.id)}
              className="p-1.5 text-gray-400 hover:text-red-400 bg-[#1A1A1D] hover:bg-red-950/30 border border-[#2A2A2D] hover:border-red-900/40 rounded-lg transition-colors cursor-pointer"
              title="Hapus Jadwal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-base font-bold text-white leading-snug tracking-tight font-sans">{schedule.name}</h4>
          {schedule.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{schedule.description}</p>
          )}
          {schedule.igAccountLink && (
            <div className="mt-1.5 flex items-center">
              <a
                href={schedule.igAccountLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-400 hover:text-pink-300 bg-pink-950/20 hover:bg-pink-950/45 px-2 py-0.5 rounded-md border border-pink-900/30 transition-all font-sans cursor-pointer"
              >
                <Instagram className="w-3 h-3 text-pink-400 shrink-0" />
                <span>Akun Instagram</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Banner status warning if any */}
      {statusConfig.banner}

      {/* Timeline info dates */}
      <div className="grid grid-cols-2 gap-3 py-2 text-xs border-y border-[#2A2A2D]">
        <div className="space-y-0.5">
          <span className="text-[9px] text-gray-500 block font-bold uppercase tracking-wider">Tanggal Buka:</span>
          <span className="text-gray-200 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
            {openDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[9px] text-gray-500 block font-bold uppercase tracking-wider">Tanggal Tutup:</span>
          <span className="text-gray-200 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
            {closeDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Countdown Widget */}
      {currentStatus !== 'CLOSED_AFTER' && (
        <div className={`p-3.5 rounded-xl ${statusConfig.accentBg} border border-[#2A2A2D] flex items-center justify-between`}>
          <div>
            <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">
              {currentStatus === 'OPEN' ? 'Waktu Tutup Sisa:' : 'Mulai Dibuka Sisa Sisa:'}
            </span>
            <span className="text-[10px] text-gray-500 font-sans">Sisa Waktu Operasional</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <div className="text-center min-w-[2.25rem]">
              <span className="font-mono text-base font-bold text-white block leading-none">{timeLeft.days}</span>
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 block">Hari</span>
            </div>
            <span className="text-gray-600 font-mono text-sm inline-block self-center mt-[-10px]">:</span>
            <div className="text-center min-w-[2.25rem]">
              <span className="font-mono text-base font-bold text-white block leading-none">{timeLeft.hours.toString().padStart(2, '0')}</span>
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 block">Jam</span>
            </div>
            <span className="text-gray-600 font-mono text-sm inline-block self-center mt-[-10px]">:</span>
            <div className="text-center min-w-[2.25rem]">
              <span className="font-mono text-base font-bold text-white block leading-none">{timeLeft.minutes.toString().padStart(2, '0')}</span>
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 block">Mnt</span>
            </div>
            <span className="text-gray-600 font-mono text-sm inline-block self-center mt-[-10px]">:</span>
            <div className="text-center min-w-[2.25rem]">
              <span className="font-mono text-base font-bold text-[#00D1FF] bg-[#00D1FF]/10 px-1 py-0.5 rounded block leading-none">{timeLeft.seconds.toString().padStart(2, '0')}</span>
              <span className="text-[8px] text-gray-550 font-bold uppercase tracking-widest mt-0.5 block">Det</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer WA sharing launcher */}
      <div className="pt-2 border-t border-[#2A2A2D] flex items-center justify-between gap-2.5">
        <button
          onClick={handleOpenWaGroup}
          className="text-xs font-bold text-[#00D1FF] hover:text-[#00b9e6] hover:underline flex items-center gap-1.5 overflow-hidden truncate cursor-pointer transition-all"
          title="Kunjungi Grup WA Tujuan"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Grup WA Terkait</span>
        </button>

        <button
          type="button"
          onClick={handleShareWa}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-[#25d366] text-black hover:bg-[#20ba5a] hover:scale-[1.02] shadow-[0_2px_8px_rgba(37,211,102,0.15)] transition-all cursor-pointer`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Post Draf WA</span>
        </button>
      </div>
    </div>
  );
};

export default ScheduleCard;
