import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import puppeteer, { Browser } from 'puppeteer';
import { StudyTableType } from '@prisma/client';
import type { PlannedMonth } from './study-table.types';

type PdfDate = Date | string;

interface PdfSession {
  date: string;
  order: number;
  status?: string;
  subject: { title: string };
  lesson: { title: string; unit: { id: string; title: string } };
}

interface PdfDay {
  date: PdfDate;
  sessions: PdfSession[];
}

export interface StudyTablePdfData {
  title: string;
  type: StudyTableType;
  startDate: PdfDate;
  endDate: PdfDate;
  days: PdfDay[];
  months: PlannedMonth<PdfSession>[];
}

const maxConcurrentPdfs = 3;
const pageTimeoutMs = 30_000;
let browserPromise: Promise<Browser> | undefined;
let activePdfs = 0;
const waitingPdfs: Array<() => void> = [];
let cachedFonts: { regular: string; bold: string } | undefined;

function dateKey(value: PdfDate): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function utcDate(value: PdfDate): Date {
  return new Date(`${dateKey(value)}T00:00:00.000Z`);
}

function dateLabel(value: PdfDate): string {
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(utcDate(value));
}

function shortDateLabel(value: PdfDate): string {
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(utcDate(value));
}

function dayParts(value: PdfDate) {
  const date = utcDate(value);
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('ar-EG', { ...options, timeZone: 'UTC' }).format(date);
  return {
    weekday: format({ weekday: 'long' }),
    day: format({ day: 'numeric' }),
    month: format({ month: 'long' }),
  };
}

const formatNumber = (value: number) => new Intl.NumberFormat('ar-EG').format(value);

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Stable color per subject so the same subject is recognisable across the whole document. */
function subjectPill(title: string): string {
  let hash = 0;
  for (const char of title) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  const style = `background:hsl(${hash} 70% 94%);color:hsl(${hash} 55% 26%);border-color:hsl(${hash} 55% 82%)`;
  return `<span class="subject" style="${style}">${escapeHtml(title)}</span>`;
}

function loadFonts(): { regular: string; bold: string } {
  if (cachedFonts) return cachedFonts;
  const fontDirectory = path.resolve(__dirname, '../assets/fonts');
  const regularPath = path.join(fontDirectory, 'NotoNaskhArabic-Regular.ttf');
  const boldPath = path.join(fontDirectory, 'NotoNaskhArabic-Bold.ttf');
  if (!fs.existsSync(regularPath)) {
    throw new Error(`Arabic PDF font is missing: ${regularPath}`);
  }
  const regular = fs.readFileSync(regularPath).toString('base64');
  const bold = fs.existsSync(boldPath) ? fs.readFileSync(boldPath).toString('base64') : regular;
  cachedFonts = { regular, bold };
  return cachedFonts;
}

function dayCell(date: PdfDate, rowSpan: number): string {
  const parts = dayParts(date);
  return `<th class="day" rowspan="${rowSpan}" scope="rowgroup">
    <div class="daybox">
      <span class="num">${escapeHtml(parts.day)}</span>
      <span class="daymeta"><b>${escapeHtml(parts.weekday)}</b><small>${escapeHtml(parts.month)}</small></span>
    </div>
  </th>`;
}

const tickBox = '<td class="achievement"><span class="box"></span></td>';

/** One <tbody> per day so a day is never split across two pages. */
function buildStandardRows(days: PdfDay[]): string {
  return days
    .map((day, dayIndex) => {
      const sessions = [...day.sessions].sort((a, b) => a.order - b.order);
      const tone = dayIndex % 2 === 1 ? 'alt' : '';

      if (sessions.length === 0) {
        return `<tbody class="${tone}"><tr>${dayCell(day.date, 1)}<td colspan="4" class="empty">لا توجد جلسات في هذا اليوم</td></tr></tbody>`;
      }

      const rows = sessions
        .map(
          (session, index) => `
      <tr>
        ${index === 0 ? dayCell(day.date, sessions.length) : ''}
        <td>${subjectPill(session.subject.title)}</td>
        <td class="unit">${escapeHtml(session.lesson.unit.title)}</td>
        <td class="lesson">${escapeHtml(session.lesson.title)}</td>
        ${tickBox}
      </tr>`
        )
        .join('');
      return `<tbody class="${tone}">${rows}</tbody>`;
    })
    .join('');
}

function buildGlobalSections(months: PlannedMonth<PdfSession>[]): string {
  return months
    .map((month) => {
      const weekRows = month.weeks
        .map((week, index) => {
          const weekDays = week.days;
          const sessions = weekDays.flatMap((day) => day.sessions);
          const subjects = [...new Set(sessions.map(({ subject }) => subject.title))];
          const unitLessons = new Map<string, { title: string; lessons: string[] }>();
          for (const session of sessions) {
            const unit = session.lesson.unit;
            const current = unitLessons.get(unit.id) ?? { title: unit.title, lessons: [] };
            current.lessons.push(session.lesson.title);
            unitLessons.set(unit.id, current);
          }
          const units = [...unitLessons.values()].map(({ title: unitTitle, lessons }) => {
            const lessonRange =
              lessons.length > 1 ? `${lessons[0]} — ${lessons[lessons.length - 1]}` : lessons[0];
            return `<div class="unitline"><b>${escapeHtml(unitTitle)}</b><span>${escapeHtml(lessonRange)}</span></div>`;
          });
          const first = weekDays[0]?.date ?? week.startDate;
          const last = weekDays.at(-1)?.date ?? week.endDate;
          const rangeLabel =
            weekDays.length > 1
              ? `${shortDateLabel(first)} — ${shortDateLabel(last)}`
              : shortDateLabel(first);

          return `<tr>
          <th class="week"><span class="weeknum">${escapeHtml(formatNumber(index + 1))}</span><small>الأسبوع</small></th>
          <td class="range-cell">${escapeHtml(rangeLabel)}<div class="daycount">${escapeHtml(formatNumber(weekDays.length))} أيام</div></td>
          <td>${subjects.map(subjectPill).join('') || '—'}</td>
          <td>${units.join('') || '—'}</td>
          ${tickBox}
        </tr>`;
        })
        .join('');

      return `<section class="month"><h2>${escapeHtml(`${month.monthName} ${month.year}`)}</h2>
      <table class="global"><thead><tr><th>الأسبوع</th><th>الفترة</th><th>المواد</th><th>الوحدات والدروس</th><th>الإنجاز</th></tr></thead>
      <tbody>${weekRows}</tbody></table></section>`;
    })
    .join('');
}

function buildStats(data: StudyTablePdfData): string {
  const studyDays = data.days.filter((day) => day.sessions.length > 0).length;
  const sessions = data.days.flatMap((day) => day.sessions);
  const subjects = new Set(sessions.map(({ subject }) => subject.title)).size;
  const items = [
    { value: studyDays, label: 'يوم دراسة' },
    { value: sessions.length, label: 'جلسة' },
    { value: subjects, label: 'مادة' },
  ];
  return items
    .map(
      ({ value, label }) =>
        `<div class="stat"><b>${escapeHtml(formatNumber(value))}</b><span>${label}</span></div>`
    )
    .join('');
}

function buildHtml(data: StudyTablePdfData): string {
  const fonts = loadFonts();
  const body =
    data.type === StudyTableType.GLOBAL
      ? buildGlobalSections(data.months)
      : `<table class="standard"><thead><tr><th>اليوم</th><th>المادة</th><th>الوحدة</th><th>الدرس</th><th>الإنجاز</th></tr></thead>
       ${buildStandardRows(data.days)}</table>`;

  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
    @font-face { font-family:Naskh; src:url(data:font/ttf;base64,${fonts.regular}) format('truetype'); font-weight:400; }
    @font-face { font-family:Naskh; src:url(data:font/ttf;base64,${fonts.bold}) format('truetype'); font-weight:700; }
    @page { size:A4; }
    :root { --ink:#0f172a; --muted:#64748b; --accent:#3730a3; --accent-soft:#eef2ff; --line:#dfe4f3; --line-strong:#b9c3ec; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:Naskh,sans-serif; color:var(--ink); font-size:10.5pt; line-height:1.5; -webkit-print-color-adjust:exact; print-color-adjust:exact; }

    /* Header */
    header { display:flex; align-items:stretch; justify-content:space-between; gap:18px; padding:12px 16px; margin-bottom:14px; background:var(--accent-soft); border-right:6px solid var(--accent); border-radius:6px; }
    .titles { min-width:0; align-self:center; }
    h1 { margin:0; font-size:20pt; line-height:1.3; color:var(--accent); overflow-wrap:anywhere; }
    .range { margin-top:2px; color:var(--muted); font-size:10pt; }
    .stats { display:flex; align-items:center; gap:0; flex-shrink:0; }
    .stat { display:flex; flex-direction:column; align-items:center; min-width:62px; padding:0 14px; border-right:1px solid var(--line-strong); }
    .stat:first-child { border-right:0; }
    .stat b { font-size:16pt; line-height:1.2; color:var(--ink); }
    .stat span { font-size:9pt; color:var(--muted); }

    /* Tables */
    table { width:100%; border-collapse:collapse; margin-bottom:10px; }
    thead { display:table-header-group; }
    thead th { padding:7px 10px; text-align:right; font-size:9.5pt; font-weight:700; color:var(--accent); background:#fff; border-bottom:2px solid var(--accent); }
    tr { break-inside:avoid; page-break-inside:avoid; }
    tbody { break-inside:avoid; page-break-inside:avoid; }
    th, td { padding:7px 10px; text-align:right; vertical-align:middle; border-bottom:1px solid var(--line); }
    tbody tr:first-child > * { border-top:1.5px solid var(--line-strong); }
    tbody.alt td, tbody.alt th.day { background:#f8f9fe; }
    tbody:last-of-type tr:last-child > * { border-bottom:1.5px solid var(--line-strong); }

    /* Day cell */
    th.day { width:21%; vertical-align:top; padding-top:9px; border-left:1px solid var(--line); background:#fff; }
    .daybox { display:flex; align-items:center; gap:10px; }
    .num { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:8px; background:var(--accent); color:#fff; font-size:13pt; font-weight:700; line-height:1; flex-shrink:0; }
    .daymeta { display:flex; flex-direction:column; line-height:1.35; }
    .daymeta b { font-size:10.5pt; color:var(--ink); }
    .daymeta small { font-size:9pt; color:var(--muted); }

    /* Cells */
    .subject { display:inline-block; margin:1px 0 1px 4px; padding:1px 9px; border:1px solid; border-radius:999px; font-size:9.5pt; font-weight:700; white-space:nowrap; }
    .unit { color:var(--muted); font-size:10pt; }
    .lesson { font-weight:700; }
    .empty { color:var(--muted); font-size:10pt; }
    .achievement { width:11%; text-align:center; }
    .box { display:inline-block; width:17px; height:17px; border:1.6px solid #94a3b8; border-radius:4px; background:#fff; vertical-align:middle; }

    /* Global plan */
    .month { margin-bottom:6px; }
    h2 { margin:14px 0 6px; padding:0 10px 0 0; font-size:14pt; color:var(--accent); border-right:4px solid var(--accent); line-height:1.3; break-after:avoid-page; page-break-after:avoid; }
    th.week { width:11%; text-align:center; background:#fff; border-left:1px solid var(--line); }
    .weeknum { display:block; font-size:15pt; font-weight:700; line-height:1.2; color:var(--accent); }
    th.week small { font-size:8.5pt; color:var(--muted); font-weight:400; }
    .global tbody tr:nth-child(even) td, .global tbody tr:nth-child(even) th.week { background:#f8f9fe; }
    .range-cell { width:20%; font-size:10pt; }
    .daycount { color:var(--muted); font-size:9pt; }
    .unitline { display:flex; flex-direction:column; margin-bottom:3px; line-height:1.55; }
    .unitline b { font-size:10pt; }
    .unitline span { color:var(--muted); font-size:9.5pt; }
  </style></head><body>
    <header>
      <div class="titles">
        <h1>${escapeHtml(data.title)}</h1>
        <div class="range">${escapeHtml(dateLabel(data.startDate))} — ${escapeHtml(dateLabel(data.endDate))}</div>
      </div>
      <div class="stats">${buildStats(data)}</div>
    </header>
    ${body}
  </body></html>`;
}

async function acquirePdfSlot(): Promise<void> {
  if (activePdfs < maxConcurrentPdfs) {
    activePdfs += 1;
    return;
  }
  await new Promise<void>((resolve) => waitingPdfs.push(resolve));
}

function releasePdfSlot(): void {
  const next = waitingPdfs.shift();
  if (next) next();
  else activePdfs -= 1;
}

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
        ],
      })
      .then((browser) => {
        browser.once('disconnected', () => {
          browserPromise = undefined;
        });
        return browser;
      })
      .catch((error: unknown) => {
        browserPromise = undefined;
        throw error;
      });
  }
  return browserPromise;
}

// Numbers only, so the footer doesn't depend on the embedded Arabic font.
const footerTemplate = `<div style="width:100%;direction:ltr;text-align:center;font-size:8px;color:#94a3b8;">
  <span class="pageNumber"></span> / <span class="totalPages"></span>
</div>`;

export const pdfService = {
  async generateStudyTablePDF(data: StudyTablePdfData): Promise<Buffer> {
    await acquirePdfSlot();
    let page: Awaited<ReturnType<Browser['newPage']>> | undefined;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      page.setDefaultTimeout(pageTimeoutMs);
      await page.setContent(buildHtml(data), { waitUntil: 'load', timeout: pageTimeoutMs });
      await page.evaluate(async () => {
        const browserGlobal = globalThis as typeof globalThis & {
          document: { fonts: { ready: Promise<unknown> } };
        };
        await browserGlobal.document.fonts.ready;
      });
      const output = Buffer.from(
        await page.pdf({
          format: 'A4',
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: '<span></span>',
          footerTemplate,
          margin: { top: '10mm', right: '10mm', bottom: '14mm', left: '10mm' },
          timeout: pageTimeoutMs,
        })
      );
      const pdf = await PDFDocument.load(output);
      if (pdf.getPageCount() < 1) throw new Error('Generated PDF contains no pages');
      return output;
    } finally {
      try {
        if (page) await page.close();
      } finally {
        releasePdfSlot();
      }
    }
  },

  async closeBrowser(): Promise<void> {
    if (!browserPromise) return;
    const browser = await browserPromise;
    browserPromise = undefined;
    await browser.close();
  },
};
