// src/modules/lesson-date/lesson-date-pdf.service.ts
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

// ------------------------------------------------------------------
// Fonts
// __dirname at runtime is .../src/modules/lesson-date
// fonts live at              .../src/modules/assets/fonts
// So we go up one level, then into assets/fonts.
// ------------------------------------------------------------------
const FONTS_DIR = path.join(__dirname, '../assets/fonts');
const FONT_REGULAR_PATH = path.join(FONTS_DIR, 'NotoNaskhArabic-Regular.ttf');
const FONT_BOLD_PATH = path.join(FONTS_DIR, 'NotoNaskhArabic-Bold.ttf');

function loadFontBase64(fontPath: string): string {
  try {
    if (!fs.existsSync(fontPath)) {
      console.error(`❌ Font not found: ${fontPath}`);
      return '';
    }
    return fs.readFileSync(fontPath).toString('base64');
  } catch (error) {
    console.error(`Error loading font ${fontPath}:`, error);
    return '';
  }
}

function buildFontFaceCss(): string {
  const regular = loadFontBase64(FONT_REGULAR_PATH);
  const bold = loadFontBase64(FONT_BOLD_PATH);

  return `
    @font-face {
      font-family: 'NotoNaskhArabic';
      src: url(data:font/ttf;base64,${regular}) format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'NotoNaskhArabic';
      src: url(data:font/ttf;base64,${bold}) format('truetype');
      font-weight: 700;
      font-style: normal;
    }
  `;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const DAY_ORDER = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

type LessonDatePdfItem = {
  id: string;
  subject: string;
  teacher: string;
  dayName: string;
  startTime: string;
  endTime: string;
};

function formatNumber(n: number | string): string {
  return String(n).replace(/\d/g, (d) => ARABIC_DIGITS[+d] ?? d);
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function escapeHtml(value: unknown): string {
  const text = value == null ? '' : String(value);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ------------------------------------------------------------------
// Progress ring (pure SVG, no JS needed) — mirrors pdf.service.ts
// ------------------------------------------------------------------
function buildProgressRing(percent: number, size = 64): string {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;
  const gap = c - dash;

  return `
    <svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}"
        fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="${stroke}" />
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}"
        fill="none" stroke="#7dd3a0" stroke-width="${stroke}"
        stroke-linecap="round"
        stroke-dasharray="${dash} ${gap}"
        transform="rotate(-90 ${size / 2} ${size / 2})" />
      <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle"
        class="ring-text">${formatNumber(percent)}%</text>
    </svg>
  `;
}

// ------------------------------------------------------------------
// HTML builder
// ------------------------------------------------------------------
const COLUMNS = ['المادة', 'المعلم', 'الوقت'];

function groupByDay(entries: LessonDatePdfItem[]) {
  const ordered = [...entries].sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.dayName) - DAY_ORDER.indexOf(b.dayName);
    if (dayDiff !== 0) return dayDiff;
    return toMinutes(a.startTime) - toMinutes(b.startTime);
  });

  return DAY_ORDER.map((day) => ({
    day,
    items: ordered.filter((item) => item.dayName === day),
  })).filter((group) => group.items.length > 0);
}

function buildDayHtml(day: string, items: LessonDatePdfItem[], index: number): string {
  const dayHeader = `
    <div class="day-header">
      <div class="day-header-right">
        <div class="day-number">${formatNumber(index + 1)}</div>
        <div class="day-titles">
          <div class="day-label">${escapeHtml(day)}</div>
          <div class="day-date">عدد الحصص: ${formatNumber(items.length)}</div>
        </div>
      </div>
      <div class="day-header-left">
        <div class="day-progress">
          <span class="day-progress-value">${formatNumber(items.length)}</span>
          <span class="day-progress-label">حصة</span>
        </div>
      </div>
    </div>
  `;

  const tbody = items
    .map(
      (item, i) => `
      <tr class="${i % 2 === 1 ? 'row-alt' : ''}">
        <td class="cell-text cell-lesson">${escapeHtml(item.subject)}</td>
        <td class="cell-text">${escapeHtml(item.teacher)}</td>
        <td class="cell-status">
          <span class="badge badge-time">
            <span class="badge-dot"></span>
            ${formatNumber(item.startTime)} - ${formatNumber(item.endTime)}
          </span>
        </td>
      </tr>`,
    )
    .join('');

  return `
    ${dayHeader}
    <table class="day-table">
      <thead>
        <tr>${COLUMNS.map((c) => `<th>${c}</th>`).join('')}</tr>
      </thead>
      <tbody>${tbody}</tbody>
    </table>
  `;
}

function buildHtml(entries: LessonDatePdfItem[]): string {
  const groups = groupByDay(entries);
  const totalLessons = entries.length;
  const totalDays = groups.length;
  const uniqueSubjects = new Set(entries.map((e) => e.subject)).size;
  const uniqueTeachers = new Set(entries.map((e) => e.teacher)).size;

  const stats = [
    { label: 'الأيام', value: totalDays, accent: '#3b82f6' },
    { label: 'المواد', value: uniqueSubjects, accent: '#8b5cf6' },
    { label: 'المعلمون', value: uniqueTeachers, accent: '#f59e0b' },
  ];

  const statsHtml = stats
    .map(
      (s) => `
      <div class="stat-card" style="--accent:${s.accent}">
        <div class="stat-accent"></div>
        <div class="stat-value">${formatNumber(s.value)}</div>
        <div class="stat-label">${s.label}</div>
      </div>`,
    )
    .join('');

  const daysHtml = groups
    .map((group, i) => `<div class="day-block">${buildDayHtml(group.day, group.items, i)}</div>`)
    .join('');

  const generatedAt = formatNumber(
    new Date().toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  );

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<style>
  ${buildFontFaceCss()}

  @page {
    size: A4;
    margin: 12mm 10mm 14mm 10mm;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'NotoNaskhArabic', sans-serif;
    direction: rtl;
    color: #1f2937;
    background: #ffffff;
    font-size: 10px;
    line-height: 1.5;
  }

  /* ---------------- Header banner ---------------- */
  .banner {
    position: relative;
    background: linear-gradient(135deg, #1e2a4a 0%, #2b3d6b 55%, #3d5488 100%);
    color: #ffffff;
    border-radius: 12px;
    padding: 22px 22px 20px;
    margin-bottom: 16px;
    overflow: hidden;
  }

  .banner::before {
    content: '';
    position: absolute;
    top: -40px; left: -40px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(125,211,160,0.22), transparent 70%);
  }

  .banner::after {
    content: '';
    position: absolute;
    bottom: -60px; right: -30px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(147,197,253,0.18), transparent 70%);
  }

  .banner-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
    z-index: 1;
    gap: 14px;
  }

  .banner-text { flex: 1; min-width: 0; }

  .brand-chip {
    display: inline-block;
    font-size: 8.5px;
    letter-spacing: 0.5px;
    color: #cbd5e1;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    padding: 3px 9px;
    border-radius: 999px;
    margin-bottom: 8px;
  }

  .header-title {
    font-size: 22px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 6px;
    line-height: 1.3;
  }

  .header-subtitle {
    font-size: 10px;
    color: #cbd5e1;
    line-height: 1.6;
  }

  .ring-wrap {
    position: relative;
    z-index: 1;
    text-align: center;
    flex-shrink: 0;
  }

  .ring-text {
    fill: #ffffff;
    font-family: 'NotoNaskhArabic', sans-serif;
    font-size: 13px;
    font-weight: 700;
  }

  .ring-caption {
    margin-top: 6px;
    font-size: 8.5px;
    color: #cbd5e1;
    letter-spacing: 0.4px;
  }

  /* ---------------- Stats ---------------- */
  .stats {
    display: flex;
    gap: 8px;
    margin-bottom: 18px;
  }

  .stat-card {
    position: relative;
    flex: 1;
    background: #f8fafc;
    border: 1px solid #e5e9f2;
    border-radius: 10px;
    padding: 12px 10px 12px 12px;
    text-align: right;
    overflow: hidden;
  }

  .stat-accent {
    position: absolute;
    top: 0; right: 0; bottom: 0;
    width: 4px;
    background: var(--accent, #3b82f6);
    border-radius: 0 10px 10px 0;
  }

  .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: #1e2a4a;
    line-height: 1.1;
  }

  .stat-label {
    font-size: 9px;
    color: #6b7280;
    margin-top: 4px;
    letter-spacing: 0.3px;
  }

  /* ---------------- Day blocks ---------------- */
  .day-block {
    margin-bottom: 16px;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .day-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(90deg, #f1f5fb 0%, #f8fafc 100%);
    border: 1px solid #e2e6ee;
    border-right: 4px solid #1e2a4a;
    border-radius: 8px;
    padding: 9px 12px;
    margin-bottom: 8px;
    gap: 12px;
  }

  .day-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .day-number {
    width: 30px; height: 30px;
    border-radius: 50%;
    background: #1e2a4a;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .day-titles { min-width: 0; }

  .day-label {
    font-size: 13px;
    font-weight: 700;
    color: #1e2a4a;
    line-height: 1.3;
  }

  .day-date {
    font-size: 9px;
    color: #6b7280;
    margin-top: 1px;
  }

  .day-header-left {
    text-align: left;
    flex-shrink: 0;
    min-width: 60px;
  }

  .day-progress {
    display: flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 4px;
  }

  .day-progress-value {
    font-size: 14px;
    font-weight: 700;
    color: #1e2a4a;
  }

  .day-progress-label {
    font-size: 8.5px;
    color: #6b7280;
  }

  /* ---------------- Table ---------------- */
  table.day-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 9.5px;
    border: 1px solid #e2e6ee;
    border-radius: 8px;
    overflow: hidden;
  }

  .day-table thead th {
    background: #1e2a4a;
    color: #ffffff;
    font-weight: 700;
    font-size: 9.5px;
    padding: 8px 10px;
    text-align: right;
    letter-spacing: 0.2px;
    border-bottom: 1px solid #2b3d6b;
  }

  .day-table thead th:last-child { text-align: center; }

  .day-table tbody td {
    padding: 7px 10px;
    border-bottom: 0.5px solid #eef1f7;
    text-align: right;
    color: #1f2937;
    vertical-align: middle;
  }

  .day-table tbody tr:last-child td { border-bottom: none; }

  .day-table tbody tr.row-alt { background: #f8fafc; }

  .cell-lesson { font-weight: 700; color: #1e2a4a; }

  .cell-status { text-align: center !important; }

  /* ---------------- Badges ---------------- */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 8.5px;
    font-weight: 700;
    white-space: nowrap;
    border: 1px solid transparent;
  }

  .badge-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  .badge-time {
    background: #eaf1ff;
    color: #1d4ed8;
    border-color: #c7d9fb;
  }

  /* ---------------- Footer ---------------- */
  .footer-text {
    margin-top: 18px;
    padding-top: 10px;
    border-top: 1px solid #e2e6ee;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8.5px;
    color: #6b7280;
    gap: 10px;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #1e2a4a;
    font-weight: 700;
  }

  .footer-brand-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #1f9d6c;
  }

  .footer-meta { display: flex; gap: 14px; }

  @media print {
    body { background: #ffffff; }
    .day-block { break-inside: avoid; page-break-inside: avoid; }
    .banner { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .day-table thead th {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .badge, .stat-accent, .day-number {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style>
</head>
<body>
  <div class="banner">
    <div class="banner-top">
      <div class="banner-text">
        <div class="brand-chip">جدول الحصص</div>
        <div class="header-title">مواعيد الدروس</div>
        <div class="header-subtitle">إجمالي الحصص: ${formatNumber(totalLessons)}</div>
      </div>
      <div class="ring-wrap">
        ${buildProgressRing(100, 64)}
        <div class="ring-caption">إجمالي الحصص</div>
      </div>
    </div>
  </div>

  <div class="stats">${statsHtml}</div>

  ${daysHtml}

  <div class="footer-text">
    <div class="footer-brand">
      <span class="footer-brand-dot"></span>
      <span>نظام المتابعة الدراسية</span>
    </div>
    <div class="footer-meta">
      <span>عدد الأيام: ${formatNumber(totalDays)}</span>
      <span>•</span>
      <span>تم الإنشاء في ${generatedAt}</span>
    </div>
  </div>
</body>
</html>`;
}

// ------------------------------------------------------------------
// Public service
// ------------------------------------------------------------------
export const lessonDatePdfService = {
  async generateLessonDatesPdf(entries: LessonDatePdfItem[]): Promise<Buffer> {
    console.log('[pdf] launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(buildHtml(entries), {
        waitUntil: 'load',
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        landscape: false,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  },
};