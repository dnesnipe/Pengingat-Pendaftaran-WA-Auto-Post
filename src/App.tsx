/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Clock, 
  Sparkles, 
  MessageSquare, 
  Activity, 
  HelpCircle, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Calendar,
  X,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Download,
  Upload
} from 'lucide-react';
import { RegistrationSchedule, ActivityLog, DEFAULT_TEMPLATE } from './types';
import ScheduleForm from './components/ScheduleForm';
import ScheduleCard from './components/ScheduleCard';
import ActivityLogComponent from './components/ActivityLog';
import { parseWhatsAppFormat } from './components/WaTemplatePicker';

// Determines the live registration status based on current/simulated time
export const getScheduleStatus = (schedule: RegistrationSchedule, referenceTime: Date): 'CLOSED_BEFORE' | 'WARN_H2' | 'OPEN' | 'CLOSED_AFTER' => {
  const nowMs = referenceTime.getTime();
  const openMs = new Date(schedule.openTime).getTime();
  const closeMs = new Date(schedule.closeTime).getTime();

  if (nowMs < openMs) {
    const fortyEightHoursMs = 2 * 24 * 60 * 60 * 1000;
    if (openMs - nowMs <= fortyEightHoursMs) {
      return 'WARN_H2';
    }
    return 'CLOSED_BEFORE';
  } else if (nowMs < closeMs) {
    return 'OPEN';
  } else {
    return 'CLOSED_AFTER';
  }
};

export default function App() {
  const [schedules, setSchedules] = useState<RegistrationSchedule[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<RegistrationSchedule | null>(null);
  const [timeOffsetMs, setTimeOffsetMs] = useState<number>(0); // Simulates moving time forward

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CLOSED_BEFORE' | 'WARN_H2' | 'OPEN' | 'CLOSED_AFTER'>('ALL');

  // Auto-post trigger modal states
  const [triggerModal, setTriggerModal] = useState<{
    isOpen: boolean;
    scheduleName: string;
    waGroupLink: string;
    messageText: string;
  } | null>(null);

  // Dynamic live clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Request browser notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Initialize with sample data if localStorage is empty
  useEffect(() => {
    const storedSchedules = localStorage.getItem('remindwa_schedules');
    const storedLogs = localStorage.getItem('remindwa_logs');

    if (storedSchedules) {
      setSchedules(JSON.parse(storedSchedules));
    } else {
      // Create initial demo schedule
      const now = new Date();
      
      // Schedule A: Opens in 2 days and 30 minutes from now (trigger H-2 reminder)
      const openTimeA = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000) - (15 * 60 * 1000)); // Opens in 1d 23h 45m
      const closeTimeA = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000));
      const demoSchedule: RegistrationSchedule = {
        id: 'demo-1',
        name: 'Pendaftaran Bootcamp Web Developer',
        description: 'Sesi bootcamp intensif full-stack React-Express yang diselenggarakan secara gratis untuk umum.',
        regLink: 'https://bootcamp-coding.id/daftar',
        openTime: openTimeA.toISOString(),
        closeTime: closeTimeA.toISOString(),
        waGroupLink: 'https://chat.whatsapp.com/JZK8s27H9k3HLkwS8HfkE7',
        messageTemplate: DEFAULT_TEMPLATE,
        reminderSent2Days: false,
        openedPostSent: false,
        isSimulatedAuto: true
      };

      setSchedules([demoSchedule]);
      localStorage.setItem('remindwa_schedules', JSON.stringify([demoSchedule]));
    }

    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    } else {
      const initialLog: ActivityLog = {
        id: 'log-init',
        timestamp: new Date().toISOString(),
        type: 'SYSTEM',
        message: '🚀 Sistem RemindWA Pengingat Pendaftaran siap diaktifkan. Scheduler cron online.'
      };
      setLogs([initialLog]);
      localStorage.setItem('remindwa_logs', JSON.stringify([initialLog]));
    }
  }, []);

  // Save schedules to local storage when changed
  const saveSchedulesToStorage = (updateds: RegistrationSchedule[]) => {
    setSchedules(updateds);
    localStorage.setItem('remindwa_schedules', JSON.stringify(updateds));
  };

  // Add Log helper
  const addLog = (type: ActivityLog['type'], message: string, scheduleId?: string, scheduleName?: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      scheduleId,
      scheduleName
    };
    
    setLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 200); // Max 200 logs
      localStorage.setItem('remindwa_logs', JSON.stringify(updated));
      return updated;
    });
  };

  // Check schedules every second (CRON SCHEDULER ENGINE)
  useEffect(() => {
    const handleSchedulerTick = () => {
      // Calculate simulated current time
      const simulatedNow = new Date(Date.now() + timeOffsetMs);
      setCurrentTime(simulatedNow);

      let stateChanged = false;
      const updatedSchedules = schedules.map(sched => {
        const schedCopy = { ...sched };
        const openDate = new Date(schedCopy.openTime);
        const closeDate = new Date(schedCopy.closeTime);

        const msToOpen = openDate.getTime() - simulatedNow.getTime();
        const msToClose = closeDate.getTime() - simulatedNow.getTime();

        // 1. DETECT H-2 REMINDER (48 Hours to Opening)
        const fortyEightHoursMs = 2 * 24 * 60 * 60 * 1000;
        if (msToOpen > 0 && msToOpen <= fortyEightHoursMs && !schedCopy.reminderSent2Days) {
          schedCopy.reminderSent2Days = true;
          stateChanged = true;

          // Push to Activity Log
          addLog(
            'WARNING_H2', 
            `⚠️ Pengingat H-2 Terdeteksi! Pendaftaran "${schedCopy.name}" akan segera dibuka kurang dari 48 jam lagi. (Rencana buka: ${openDate.toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}). Sampaikan info ke grup WA tujuan.`,
            schedCopy.id,
            schedCopy.name
          );

          // Push HTML5 notification if accepted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Pengingat H-2: Pendaftaran Segera Dibuka`, {
              body: `Pendaftaran "${schedCopy.name}" akan dibuka dalam waktu dekat! Siapkan info siaran grup.`,
              icon: '/favicon.ico'
            });
          }
        }

        // 2. DETECT OPENING DAY AUTO-POST TRIGGER
        if (msToOpen <= 0 && msToClose > 0 && !schedCopy.openedPostSent) {
          schedCopy.openedPostSent = true;
          stateChanged = true;

          // Generate message text template
          let text = schedCopy.messageTemplate;
          const formattedBuka = openDate.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
          const formattedTutup = closeDate.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
          text = text.replace(/{nama_pendaftaran}/g, schedCopy.name);
          text = text.replace(/{link_pendaftaran}/g, schedCopy.regLink);
          text = text.replace(/{tgl_buka}/g, formattedBuka);
          text = text.replace(/{tgl_tutup}/g, formattedTutup);

          // Push to Activity Logs
          addLog(
            'OPEN_AUTO_POST',
            `📢 JADWAL BUKA TERCAPAI! Posting otomatis untuk "${schedCopy.name}" diluncurkan. Templat disiapkan untuk disebarkan ke grup WA: ${schedCopy.waGroupLink}`,
            schedCopy.id,
            schedCopy.name
          );

          // Open instant modal helper so user can click to redirect & dispatch
          setTriggerModal({
            isOpen: true,
            scheduleName: schedCopy.name,
            waGroupLink: schedCopy.waGroupLink,
            messageText: text
          });

          // HTML5 Alert notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`🚨 REGISTRASI DIBUKA: ${schedCopy.name}`, {
              body: `Jadwal resmi pendaftaran telah dibuka! Klik untuk meluncurkan posting otomatis WA.`,
              requireInteraction: true
            });
          }
        }

        return schedCopy;
      });

      if (stateChanged) {
        saveSchedulesToStorage(updatedSchedules);
      }
    };

    const interval = setInterval(handleSchedulerTick, 1000);
    return () => clearInterval(interval);
  }, [schedules, timeOffsetMs]);

  // Handle saving new or edited schedules
  const handleSaveSchedule = (formData: Omit<RegistrationSchedule, 'id' | 'reminderSent2Days' | 'openedPostSent'>) => {
    if (editingSchedule) {
      // Edit existing
      const updated = schedules.map(s => {
        if (s.id === editingSchedule.id) {
          // Keep sending logs fresh if target open time is edited/modified forward
          const isDateResetNeeded = new Date(formData.openTime).toISOString() !== s.openTime;
          return {
            ...s,
            ...formData,
            reminderSent2Days: isDateResetNeeded ? false : s.reminderSent2Days,
            openedPostSent: isDateResetNeeded ? false : s.openedPostSent
          };
        }
        return s;
      });
      saveSchedulesToStorage(updated);
      addLog('SYSTEM', `✏️ Jadwal pendaftaran "${formData.name}" berhasil diubah dan diperbarui.`);
      setEditingSchedule(null);
    } else {
      // Create new
      const newSched: RegistrationSchedule = {
        ...formData,
        id: `sched-${Date.now()}`,
        reminderSent2Days: false,
        openedPostSent: false
      };
      const updated = [newSched, ...schedules];
      saveSchedulesToStorage(updated);
      addLog('SYSTEM', `🟢 Jadwal pendaftaran baru: "${formData.name}" berhasil dibuat.`);
      setIsFormOpen(false);
    }
  };

  const handleDeleteSchedule = (id: string) => {
    const target = schedules.find(s => s.id === id);
    const updated = schedules.filter(s => s.id !== id);
    saveSchedulesToStorage(updated);
    addLog('SYSTEM', `🗑️ Menghapus jadwal pendaftaran: "${target?.name || id}".`);
  };

  const handleManualAutoPostTrigger = (id: string, messageText: string) => {
    const target = schedules.find(s => s.id === id);
    if (!target) return;

    // Simulate auto post trigger manually
    // Mark as posted so logs don't repeat
    const updated = schedules.map(s => {
      if (s.id === id) {
        return { ...s, openedPostSent: true };
      }
      return s;
    });
    saveSchedulesToStorage(updated);

    addLog(
      'OPEN_AUTO_POST',
      `⚡ Siaran WhatsApp draf dipicu secara manual untuk "${target.name}". Membuka link pengiriman grup.`,
      target.id,
      target.name
    );

    setTriggerModal({
      isOpen: true,
      scheduleName: target.name,
      waGroupLink: target.waGroupLink,
      messageText: messageText
    });
  };

  const handleClearLogs = () => {
    setLogs([]);
    localStorage.removeItem('remindwa_logs');
  };

  // Export all schedules as a backup JSON file
  const handleExportJSON = () => {
    try {
      const dataStr = JSON.stringify(schedules, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `remindwa_backup_${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      addLog('SYSTEM', '📥 Berhasil mengekspor semua data pendaftaran ke file JSON.');
    } catch (error) {
      console.error(error);
      addLog('SYSTEM', '❌ Gagal mengekspor data pendaftaran.');
    }
  };

  // Import schedules from a backup JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          if (Array.isArray(importedData)) {
            // Validate incoming JSON items
            const isValid = importedData.every(item => 
              item && typeof item === 'object' && 'name' in item && 'openTime' in item && 'closeTime' in item
            );
            
            if (!isValid) {
              addLog('SYSTEM', '❌ Gagal mengimpor: Struktur berkas JSON tidak cocok dengan skema RemindWA.');
              return;
            }

            // Map standard keys and clean IDs
            const sanitized: RegistrationSchedule[] = importedData.map(item => ({
              ...item,
              id: item.id || `sched-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              description: item.description || '',
              regLink: item.regLink || '',
              waGroupLink: item.waGroupLink || '',
              messageTemplate: item.messageTemplate || DEFAULT_TEMPLATE,
              reminderSent2Days: typeof item.reminderSent2Days === 'boolean' ? item.reminderSent2Days : false,
              openedPostSent: typeof item.openedPostSent === 'boolean' ? item.openedPostSent : false,
              isSimulatedAuto: typeof item.isSimulatedAuto === 'boolean' ? item.isSimulatedAuto : true,
              storyAlarmEnabled: typeof item.storyAlarmEnabled === 'boolean' ? item.storyAlarmEnabled : false,
              storyAlarmTime: item.storyAlarmTime || undefined,
              storyAlarmPlatform: item.storyAlarmPlatform || undefined,
              storyAlarmText: item.storyAlarmText || undefined,
              storyAlarmTriggered: typeof item.storyAlarmTriggered === 'boolean' ? item.storyAlarmTriggered : false,
            }));

            setSchedules(prev => {
              // Deduplicate if matching ID already exists
              const prevFiltered = prev.filter(p => !sanitized.some(s => s.id === p.id));
              const merged = [...prevFiltered, ...sanitized];
              localStorage.setItem('remindwa_schedules', JSON.stringify(merged));
              return merged;
            });
            
            addLog('SYSTEM', `📥 Berhasil mengimpor ${sanitized.length} jadwal pendaftaran dari data backup.`);
          } else {
            addLog('SYSTEM', '❌ Gagal mengimpor: Data JSON harus berupa array daftar jadwal.');
          }
        } catch (err) {
          addLog('SYSTEM', '❌ Gagal mengimpor: Berkas rusak atau format JSON salah.');
        }
      };
    }
  };

  // Accelerates time forward for testing purposes
  const handleSimulateForward = (days: number, hours: number = 0) => {
    const offsetToAdd = (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000);
    setTimeOffsetMs(prev => {
      const nextOffset = prev + offsetToAdd;
      const targetTime = new Date(Date.now() + nextOffset);
      addLog('SYSTEM', `🕒 SIMULASI WAKTU MAJU ke depan sebanyak +${days} Hari ${hours} Jam. Jam Sistem saat ini: ${targetTime.toLocaleString('id-ID')}`);
      return nextOffset;
    });
  };

  const handleResetSimulationTime = () => {
    setTimeOffsetMs(0);
    addLog('SYSTEM', `🕒 Waktu simulasi disinkronkan kembali dengan jam waktu riil perangkat Anda.`);
  };

  // Filter schedules based on target query and chosen registration status
  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch = 
      schedule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (schedule.description && schedule.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const status = getScheduleStatus(schedule, currentTime);
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#0F0F10] text-gray-300 font-sans selection:bg-[#00D1FF]/20 antialiased">
      {/* Decorative top pulse brand accent bar */}
      <div className="h-[2px] bg-[#00D1FF] shadow-[0_1px_8px_rgba(0,209,255,0.7)]" />

      {/* Hero Header Section */}
      <header className="bg-[#161618] border-b border-[#2A2A2D] py-6 px-4 md:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1D] border border-[#2A2A2D] flex items-center justify-center text-[#00D1FF] shadow-inner">
              <MessageSquare className="w-5 h-5 text-[#00D1FF] shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">RemindWA</h1>
                <span className="text-[10px] font-black text-[#00D1FF] bg-[#00D1FF]/10 border border-[#00D1FF]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Ver 1.0
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">
                Pencatat Jadwal H-2 Tutup &amp; Post Otomatis ke Grup WA Saat Jadwal Pendaftaran Dibuka.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
            {/* Live Clock Indicator */}
            <div className="bg-[#0F0F10] border border-[#2A2A2D] p-2.5 rounded-xl text-right shrink-0">
              <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">Jam Pantau Sistem</span>
              <div className="flex items-center gap-2 justify-end mt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#00D1FF] animate-pulse" />
                <span className="font-mono text-sm font-bold text-white">
                  {currentTime.toLocaleTimeString('id-ID', { hour12: false })}{' '}
                  <span className="text-xs text-gray-400 font-normal ml-1">
                    {currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                </span>
                {timeOffsetMs !== 0 && (
                  <span className="text-[9px] text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider animate-pulse">
                    Fwd Demo
                  </span>
                )}
              </div>
            </div>

            {/* Simulated quick triggers trigger */}
            <button
              onClick={() => {
                setIsFormOpen(true);
                setEditingSchedule(null);
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              className="bg-[#00D1FF] hover:bg-[#00b9e6] text-black font-bold text-xs px-4 py-3 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,209,255,0.15)] hover:shadow-[0_4px_16px_rgba(0,209,255,0.25)] hover:scale-[1.01]"
              id="new-schedule-btn"
            >
              <Plus className="w-4 h-4 text-black stroke-[3px]" /> Masukkan Jadwal
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Testing Suite Panel */}
        <section className="bg-[#161618] text-white rounded-2xl p-5 border border-[#2A2A2D] shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-[#00D1FF] shrink-0" />
              <h3 className="text-sm font-bold text-white font-sans">Konsol Pengujian Simulator (Demo)</h3>
            </div>
            <p className="text-xs text-gray-400">
              Uji pemantauan fase <span className="font-bold text-amber-400">Pengingat H-2</span> dan siaran otomatis WhatsApp grup secara instan dengan mempercepat waktu sistem berikut!
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleSimulateForward(1, 23)}
              className="bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-300 border border-amber-500/35 font-bold text-[11px] px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 text-amber-400" /> Majukan +2 Hari (H-2)
            </button>
            <button
              onClick={() => handleSimulateForward(3, 0)}
              className="bg-[#00D1FF]/10 hover:bg-[#00D1FF]/20 active:scale-95 text-[#00D1FF] border border-[#00D1FF]/35 font-bold text-[11px] px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 text-[#00D1FF]" /> Majukan +3 Hari (Buka)
            </button>
            {timeOffsetMs !== 0 && (
              <button
                onClick={handleResetSimulationTime}
                className="bg-[#1A1A1D] hover:bg-[#2A2A2D] text-gray-400 hover:text-white border border-[#2A2A2D] font-bold text-[11px] px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" /> Waktu Riil
              </button>
            )}
          </div>
        </section>

        {/* Form Input Drawer / block */}
        {isFormOpen || editingSchedule ? (
          <section className="relative scroll-mt-6">
            <ScheduleForm
              onSave={handleSaveSchedule}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingSchedule(null);
              }}
              initialData={editingSchedule || undefined}
            />
          </section>
        ) : null}

        {/* Dashboard Schedule Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#2A2A2D]">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <h2 className="text-base font-bold text-white font-sans">Daftar Pemantauan Pendaftaran Aktif</h2>
            </div>
            <div className="flex items-center gap-2">
              {filteredSchedules.length !== schedules.length && (
                <span className="text-[10px] text-gray-400 bg-[#1A1A1D] border border-[#2A2A2D] px-2.5 py-1 rounded-lg font-bold select-none">
                  {filteredSchedules.length} dari {schedules.length} Ditampilkan
                </span>
              )}
              <span className="text-xs text-gray-400 font-bold font-mono bg-[#161618] border border-[#2A2A2D] px-2.5 py-1 rounded-lg">
                {schedules.length} Items Terdaftar
              </span>
            </div>
          </div>

          {/* Control Panel: Search, Filter, Export & Import */}
          <div className="bg-[#161618] border border-[#2A2A2D] rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
              {/* Search input with icons */}
              <div className="relative flex-1 max-w-lg">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Cari nama pendaftaran atau keterangan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 text-xs bg-[#0F0F10] border border-[#2A2A2D] text-white rounded-xl focus:ring-2 focus:ring-[#00D1FF]/20 focus:border-[#00D1FF] outline-none transition-all placeholder-gray-500 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 bg-transparent text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Import / Export backup JSON */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Import trigger input */}
                <label className="px-3.5 py-2.5 text-xs font-bold text-gray-300 bg-[#0F0F10] hover:bg-[#1A1A1D] border border-[#2A2A2D] hover:border-[#00D1FF]/30 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 min-h-[38px] select-none">
                  <Upload className="w-3.5 h-3.5 text-[#00D1FF]" />
                  <span>Impor Backup JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>

                {/* Export button */}
                <button
                  type="button"
                  onClick={handleExportJSON}
                  disabled={schedules.length === 0}
                  className="px-3.5 py-2.5 text-xs font-bold text-gray-300 bg-[#0F0F10] hover:bg-[#1A1A1D] border border-[#2A2A2D] hover:border-[#00D1FF]/30 disabled:opacity-40 disabled:hover:bg-[#0F0F10] disabled:hover:border-[#2A2A2D] disabled:cursor-not-allowed rounded-xl cursor-pointer transition-all flex items-center gap-1.5 min-h-[38px]"
                  title={schedules.length === 0 ? 'Perekaman pendaftaran kosong, tidak bisa mengekspor.' : 'Ekspor seluruh jadwal pendaftaran ke JSON'}
                >
                  <Download className="w-3.5 h-3.5 text-[#00D1FF]" />
                  <span>Ekspor Backup JSON</span>
                </button>
              </div>
            </div>

            {/* Status Filter capsule chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#2A2A2D]/60 text-[11px]">
              <span className="text-gray-500 flex items-center gap-1.5 mr-1.5 select-none font-bold uppercase tracking-wider text-[9px]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#00D1FF]" /> filter status:
              </span>

              {[
                { key: 'ALL', label: 'Semua', count: schedules.length, activeColor: 'bg-[#00D1FF] text-black border-[#00D1FF]' },
                { key: 'CLOSED_BEFORE', label: 'Akan Datang', count: schedules.filter(s => getScheduleStatus(s, currentTime) === 'CLOSED_BEFORE').length, activeColor: 'bg-blue-600/25 text-blue-350 border-blue-500/40 font-bold' },
                { key: 'WARN_H2', label: 'H-2 Pengingat', count: schedules.filter(s => getScheduleStatus(s, currentTime) === 'WARN_H2').length, activeColor: 'bg-amber-500/25 text-amber-300 border-amber-500/45 font-bold' },
                { key: 'OPEN', label: 'Daftar Dibuka', count: schedules.filter(s => getScheduleStatus(s, currentTime) === 'OPEN').length, activeColor: 'bg-[#25d366]/20 text-[#25d366] border-[#25d366]/35 font-bold' },
                { key: 'CLOSED_AFTER', label: 'Tutup / Selesai', count: schedules.filter(s => getScheduleStatus(s, currentTime) === 'CLOSED_AFTER').length, activeColor: 'bg-gray-600/30 text-gray-300 border-gray-500/40 font-bold' },
              ].map((item) => {
                const isActive = statusFilter === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setStatusFilter(item.key as any)}
                    className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-all flex items-center gap-1.5 ${
                      isActive
                        ? item.activeColor
                        : 'bg-[#0F0F10] text-[#9ca3af] border-[#2A2A2D] hover:bg-[#1A1A1D] hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isActive ? (item.key === 'ALL' ? 'bg-black/15 text-black' : 'bg-white/10 text-white') : 'bg-[#1A1A1D] text-gray-450'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule list renderer */}
          {schedules.length === 0 ? (
            <div className="bg-[#161618] rounded-2xl border border-dashed border-[#2A2A2D] p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#1A1A1D] border border-[#2A2A2D] flex items-center justify-center mx-auto text-[#00D1FF]">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-bold text-sm">Belum Ada Informasi Pendaftaran</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Tambahkan jadwal pembukaan registrasi baru yang ingin dipantau atau impor file backup pendaftaran Anda.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-4 py-2.5 text-xs font-bold text-black bg-[#00D1FF] hover:bg-[#00b9e6] rounded-xl cursor-pointer transition-colors shadow-[0_2px_10px_rgba(0,209,255,0.15)]"
                >
                  Mulai Masukkan Data Pertama
                </button>
                <label className="px-4 py-2.5 text-xs font-bold text-gray-305 bg-[#1A1A1D] hover:bg-[#2A2A2D] border border-[#2A2A2D] rounded-xl cursor-pointer transition-colors">
                  Impor Berkas JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="bg-[#161618] rounded-2xl border border-dashed border-[#2A2A2D] p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#1A1A1D] border border-[#2A2A2D] flex items-center justify-center mx-auto text-amber-400">
                <Search className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-bold text-sm">Hasil Tidak Ditemukan</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Tidak ada jadwal yang cocok dengan kata kunci "{searchQuery}" atau filter status terpilih.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="px-4 py-2.5 text-xs font-bold text-black bg-[#00D1FF] hover:bg-[#00b9e6] rounded-xl cursor-pointer transition-colors"
              >
                Reset Pencarian &amp; Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onEdit={(s) => {
                    setEditingSchedule(s);
                    setIsFormOpen(false);
                    // Scroll into editor smoothly
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  onDelete={handleDeleteSchedule}
                  onAutoPostTriggered={handleManualAutoPostTrigger}
                />
              ))}
            </div>
          )}
        </section>

        {/* Activity Logs & Information Guide */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          
          {/* Logs Console */}
          <div className="lg:col-span-2">
            <ActivityLogComponent 
              logs={logs} 
              onClear={handleClearLogs} 
            />
          </div>

          {/* Guidelines info */}
          <div className="bg-[#161618] rounded-2xl border border-[#2A2A2D] p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#2A2A2D]">
              <HelpCircle className="w-5 h-5 text-[#00D1FF]" />
              <h4 className="text-sm font-bold text-white leading-none font-sans">Petunjuk Operasional</h4>
            </div>

            <div className="space-y-3.5 text-xs leading-relaxed text-gray-400">
              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-md bg-[#2A2A2D] border border-[#3A3A3D] font-bold text-white text-[10px] flex items-center justify-center shrink-0">
                  1
                </div>
                <p>
                  <strong className="text-gray-200 font-bold">Atur Jadwal &amp; Draf:</strong> Daftarkan agenda penerimaan, cantumkan link grup WhatsApp tujuan/sasaran publikasi utama Anda.
                </p>
              </div>

              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/20 font-bold text-amber-300 text-[10px] flex items-center justify-center shrink-0">
                  2
                </div>
                <p>
                  <strong className="text-gray-200 font-bold">Siaga H-2 Otomatis:</strong> Notifikasi sistem &amp; log pemantau menyala otomatis saat hitungan mundur sisa kurang dari 48 jam.
                </p>
              </div>

              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 font-bold text-[#25d366] text-[10px] flex items-center justify-center shrink-0">
                  3
                </div>
                <p>
                  <strong className="text-gray-200 font-bold">Siaran Instan Buka:</strong> Saat pendaftaran dibuka resmi, pop-up konfirmasi posting WA instan terpicu mengunggah draft template Anda.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#0F0F10] rounded-xl border border-[#2A2A2D] font-mono text-[10px] text-gray-400 line-clamp-4">
              <span className="font-bold text-white block mb-1">Variabel Dinamis:</span>
              • &#123;nama_pendaftaran&#125;<br />
              • &#123;link_pendaftaran&#125;<br />
              • &#123;tgl_buka&#125;, &#123;tgl_tutup&#125;
            </div>
          </div>
        </section>
      </main>

      {/* Trigger Modal Dialog for Auto Post Confirmation */}
      {triggerModal && triggerModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm select-none">
          <div className="bg-[#161618] rounded-3xl max-w-xl w-full border border-[#2A2A2D] shadow-2xl overflow-hidden font-sans flex flex-col">
            
            {/* Modal Whatsapp Style Header */}
            <div className="bg-[#0b141a] text-white p-5 flex items-start justify-between border-b border-[#2A2A2D]">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#25d366] text-black flex items-center justify-center font-black shadow-inner tracking-wider select-none shrink-0 text-sm">
                  WA
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#00D1FF] tracking-tight uppercase">Siaran Terjadwal Siap Kirim!</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Kegiatan: <span className="font-bold underline text-gray-200">{triggerModal.scheduleName}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setTriggerModal(null)}
                className="p-1 hover:bg-[#2A2A2D] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="text-xs text-gray-300 leading-relaxed flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#00D1FF] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">Pendaftaran Buka Terdeteksi!</span> Sistem RemindWA telah menyusun format pesan lengkap dengan parameter dinamis. Klik tombol di bawah ini untuk menyiarkan ke grup WhatsApp tujuan.
                </div>
              </div>

              {/* Message Draft Box */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-500 block uppercase tracking-wider">Isi Siaran (Draft Pesan):</span>
                <div className="bg-[#0b141a] p-4 rounded-2xl border border-[#2A2A2D] max-h-48 overflow-y-auto whitespace-pre-wrap text-xs text-gray-300 font-sans leading-relaxed select-text shadow-inner">
                  {/* Reuse formatting display parser style */}
                  <div className="bg-[#161618] p-3 rounded-lg shadow-sm border border-[#2A2A2D] text-gray-100 font-sans">
                    {parseWhatsAppFormat(triggerModal.messageText)}
                  </div>
                </div>
              </div>

              {/* Destination Tag */}
              <div className="p-3 bg-[#0F0F10] border border-[#2A2A2D] rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-gray-500 block font-bold uppercase tracking-wider leading-none">WhatsApp Grup Sasaran</span>
                  <span className="text-gray-300 font-bold font-mono mt-1 block truncate max-w-[300px]">{triggerModal.waGroupLink}</span>
                </div>
                <span className="bg-emerald-500/10 text-[#25d366] border border-emerald-500/20 font-bold text-[10px] px-2.5 py-1 rounded-md">Aktif</span>
              </div>
            </div>

            {/* Buttons footer */}
            <div className="bg-[#0F0F10] p-4 border-t border-[#2A2A2D] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setTriggerModal(null)}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-[#1A1A1D] border border-[#2A2A2D] rounded-xl transition-all cursor-pointer"
              >
                Tutup Sementara
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = encodeURIComponent(triggerModal.messageText);
                  const waUrl = `https://api.whatsapp.com/send?text=${text}`;
                  window.open(waUrl, '_blank');
                  setTriggerModal(null);
                }}
                className="bg-[#25d366] hover:bg-[#20ba5a] text-black font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-[0_2px_12px_rgba(37,211,102,0.2)] flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current text-black" />
                Kirim Draf ke WA Group
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Aesthetic Site Footer */}
      <footer className="bg-[#161618] border-t border-[#2A2A2D] py-8 text-center select-none mt-12">
        <p className="text-xs text-gray-500 space-y-1">
          <span className="block font-bold text-gray-400">RemindWA &copy; 2026</span>
          <span className="block font-medium">Dibuat dengan presisi untuk memantau jadwal pendaftaran. Seluruh data disimpan lokal secara aman di browser Anda.</span>
        </p>
      </footer>
    </div>
  );
}
