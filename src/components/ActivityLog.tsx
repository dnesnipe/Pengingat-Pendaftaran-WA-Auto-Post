/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Terminal, Trash2, Filter, AlertTriangle, ShieldCheck, Info, RefreshCw } from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityLogComponentProps {
  logs: ActivityLog[];
  onClear: () => void;
}

export default function ActivityLogComponent({ logs, onClear }: ActivityLogComponentProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'SYSTEM' | 'WARNING_H2' | 'OPEN_AUTO_POST'>('ALL');

  const filteredLogs = logs.filter(log => {
    if (filterType === 'ALL') return true;
    return log.type === filterType;
  });

  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'SYSTEM':
        return <ShieldCheck className="w-4 h-4 text-slate-500" />;
      case 'WARNING_H2':
        return <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />;
      case 'OPEN_AUTO_POST':
        return <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin-slow" />;
      case 'INFO':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getBadgeClass = (type: ActivityLog['type']) => {
    switch (type) {
      case 'SYSTEM':
        return 'bg-slate-100 text-slate-700';
      case 'WARNING_H2':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'OPEN_AUTO_POST':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-100';
    }
  };

  return (
    <div className="bg-[#161618]/80 text-gray-300 rounded-2xl border border-[#2A2A2D] p-5 shadow-xl space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2D]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#00D1FF]" />
          <h4 className="text-sm font-bold tracking-tight text-white font-sans">Konsol Aktivitas WA &amp; Pengingat</h4>
          <span className="bg-[#00D1FF]/10 text-[#00D1FF] border border-[#00D1FF]/20 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase">
            Live Monitor
          </span>
        </div>

        <button
          onClick={onClear}
          className="p-1 px-2.5 text-[10px] text-gray-400 hover:text-red-400 bg-[#0F0F10] hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-[#2A2A2D] hover:border-red-900/30"
          title="Bersihkan Log"
        >
          <Trash2 className="w-3 h-3" /> Bersihkan Log
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap text-[10px]">
        <span className="text-gray-500 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3 text-[#00D1FF]" /> Filter Log:
        </span>
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors border ${
            filterType === 'ALL' ? 'bg-[#00D1FF] text-black border-[#00D1FF] font-bold' : 'bg-[#0F0F10] text-[#9ca3af] border-[#2A2A2D] hover:bg-[#1A1A1D]'
          }`}
        >
          Semua (All)
        </button>
        <button
          onClick={() => setFilterType('SYSTEM')}
          className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors border ${
            filterType === 'SYSTEM' ? 'bg-blue-600/20 text-blue-300 border-blue-500/30 font-bold' : 'bg-[#0F0F10] text-[#9ca3af] border-[#2A2A2D] hover:bg-[#1A1A1D]'
          }`}
        >
          Sistem
        </button>
        <button
          onClick={() => setFilterType('WARNING_H2')}
          className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors border ${
            filterType === 'WARNING_H2' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold' : 'bg-[#0F0F10] text-[#9ca3af] border-[#2A2A2D] hover:bg-[#1A1A1D]'
          }`}
        >
          H-2 Pengingat
        </button>
        <button
          onClick={() => setFilterType('OPEN_AUTO_POST')}
          className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors border ${
            filterType === 'OPEN_AUTO_POST' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold' : 'bg-[#0F0F10] text-[#9ca3af] border-[#2A2A2D] hover:bg-[#1A1A1D]'
          }`}
        >
          Broadcast Auto-Post
        </button>
      </div>

      {/* Log Feed */}
      <div className="max-h-56 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-gray-500 italic">
            Belum ada aktivitas terekam. Jalankan scheduler atau buat pendaftaran baru untuk memulai.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="p-2 bg-[#0F0F10]/60 hover:bg-[#0F0F10] rounded-lg border border-[#2A2A2D] transition-colors flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0">{getLogIcon(log.type)}</span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour12: false })}{' '}
                    {new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                  {log.scheduleName && (
                    <span className="text-[#00D1FF] font-bold truncate max-w-[150px]">
                      @{log.scheduleName}
                    </span>
                  )}
                </div>
                <p className="text-gray-300 leading-relaxed font-sans text-[11px] whitespace-pre-wrap">{log.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-[10px] text-gray-500 bg-[#0F0F10]/40 p-2 rounded-lg border border-[#2A2A2D] flex items-center justify-between">
        <span>RemindWA Cron Engine v1.0.0</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D1FF] animate-pulse mr-1" />
          Scheduler Aktif (Tick: 1s)
        </span>
      </div>
    </div>
  );
}
