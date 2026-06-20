/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RegistrationSchedule {
  id: string;
  name: string;
  description: string;
  openTime: string; // ISO 8601 string
  closeTime: string; // ISO 8601 string
  waGroupLink: string; // Link/Phone number for WhatsApp destination
  messageTemplate: string; // Message with fields such as {nama}, {link_wa}, {tgl_buka}
  reminderSent2Days: boolean;
  openedPostSent: boolean;
  isSimulatedAuto: boolean; // Automate posting logs instantly when schedule opens
  regLink: string; // Registration target link (e.g., https://form...)
  igAccountLink?: string; // Optional Link to Instagram/social media account
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO 8601 string
  scheduleId?: string;
  scheduleName?: string;
  type: 'SYSTEM' | 'INFO' | 'WARNING_H2' | 'OPEN_AUTO_POST';
  message: string;
}

export const DEFAULT_TEMPLATE = `📣 *PENDAFTARAN DIBUKA!* 📣

Halo Rekan-Rekan semua, saat ini pendaftaran untuk *{nama_pendaftaran}* sudah RESMI DIBUKA! 🎉

📌 *Detail Informasi:*
• Nama Kegiatan: {nama_pendaftaran}
• Link Pendaftaran: {link_pendaftaran}
• Tanggal Buka: {tgl_buka}
• Tanggal Tutup: {tgl_tutup}

Silakan klik tautan di bawah ini untuk melakukan pendaftaran sekarang:
👉 {link_pendaftaran}

🔔 _Pemberitahuan otomatis dari Sistem Pengingat RemindWA._`;
