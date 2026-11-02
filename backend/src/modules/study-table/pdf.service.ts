import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import puppeteer, { Browser } from 'puppeteer';
import { StudyTableType } from '@prisma/client';

type PdfDate = Date | string;

interface PdfSession {
  order: number;
  status?: string;
  subject: { title: string };
  lesson: { title: string; unit: { id: string; title: string } };
}

interface PdfDay {
  date: PdfDate;
  sessions: PdfSession[];
}

interface StudyTablePdfData {
  title: string;
  type: StudyTableType;
  startDate: PdfDate;
  endDate: PdfDate;
  days: PdfDay[];
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

function dateLabel(value: PdfDate): string {
  const date = new Date(`${dateKey(value)}T00:00:00.000Z`);
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function loadFonts(): { regular: string; bold: string } {
  if (cachedFonts) return cachedFonts;
  const fontDirectory = path.resolve(__dirname, '../assets/fonts');
  const regularPath = path.join(fontDirectory, 'NotoNaskhArabic-Regular.ttf');
  const boldPath = path.join(fontDirectory, 'NotoNaskhArabic-Bold.ttf');
  if (!fs.existsSync(regularPath)) {
    throw new Error(`Arabic PDF font is missing: ${regularPath}`);
  }
  const regular = fs.readFileSync(regularPath).toString('base64');
  const bold = fs.existsSync(boldPath)
    ? fs.readFileSync(boldPath).toString('base64')
    : regular;
  cachedFonts = { regular, bold };
  return cachedFonts;
}

function buildStandardRows(days: PdfDay[]): string {
  return days.map((day) => {
    const sessions = [...day.sessions].sort((a, b) => a.order - b.order);
    if (sessions.length === 0) {
      return `<tr><th>${escapeHtml(dateLabel(day.date))}</th><td colspan="4">لا توجد جلسات</td></tr>`;
    }
    return sessions.map((session, index) => `
      <tr>
        ${index === 0 ? `<th rowspan="${sessions.length}">${escapeHtml(dateLabel(day.date))}</th>` : ''}
        <td><span class="subject">${escapeHtml(session.subject.title)}</span></td>
        <td>${escapeHtml(session.lesson.unit.title)}</td>
        <td>${escapeHtml(session.lesson.title)}</td>
        <td class="achievement">&nbsp;</td>
      </tr>`).join('');
  }).join('');
}

function monthWeekKey(dateString: string): { month: string; weekStart: string } {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  const weekStart = new Date(date);
  weekStart.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return {
    month: dateString.slice(0, 7),
    weekStart: weekStart.toISOString().slice(0, 10),
  };
}

function buildGlobalSections(days: PdfDay[]): string {
  const monthGroups = new Map<string, Map<string, PdfDay[]>>();
  for (const day of days) {
    const key = monthWeekKey(dateKey(day.date));
    const weeks = monthGroups.get(key.month) ?? new Map<string, PdfDay[]>();
    weeks.set(key.weekStart, [...(weeks.get(key.weekStart) ?? []), day]);
    monthGroups.set(key.month, weeks);
  }

  return [...monthGroups.entries()].map(([month, weeks]) => {
    const [year, monthNumber] = month.split('-').map(Number);
    const monthName = new Intl.DateTimeFormat('ar-EG', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year!, monthNumber! - 1, 1)));
    const weekRows = [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b))
      .map(([, weekDays], index) => {
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
          const lessonRange = lessons.length > 1
            ? `${lessons[0]} — ${lessons[lessons.length - 1]}`
            : lessons[0];
          return `${unitTitle}: ${lessonRange}`;
        });
        return `<tr>
          <th>الأسبوع ${index + 1}</th>
          <td>${weekDays.map(({ date }) => escapeHtml(dateLabel(date))).join('<br>')}</td>
          <td>${subjects.map((subject) => `<span class="subject">${escapeHtml(subject)}</span>`).join('<br>') || '—'}</td>
          <td>${units.map(escapeHtml).join('<br>') || '—'}</td>
          <td class="achievement">&nbsp;</td>
        </tr>`;
      }).join('');
    return `<section class="month"><h2>${escapeHtml(monthName)}</h2>
      <table class="global"><thead><tr><th>الأسبوع</th><th>الأيام</th><th>المواد</th><th>الوحدات والدروس</th><th>الإنجاز</th></tr></thead>
      <tbody>${weekRows}</tbody></table></section>`;
  }).join('');
}

function buildHtml(data: StudyTablePdfData): string {
  const fonts = loadFonts();
  const body = data.type === StudyTableType.GLOBAL
    ? buildGlobalSections(data.days)
    : `<table class="standard"><thead><tr><th>اليوم</th><th>المادة</th><th>الوحدة</th><th>الدرس</th><th>الإنجاز</th></tr></thead>
       <tbody>${buildStandardRows(data.days)}</tbody></table>`;

  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
    @font-face { font-family:Naskh; src:url(data:font/ttf;base64,${fonts.regular}) format('truetype'); font-weight:400; }
    @font-face { font-family:Naskh; src:url(data:font/ttf;base64,${fonts.bold}) format('truetype'); font-weight:700; }
    @page { size:A4; margin:7mm 8mm; }
    * { box-sizing:border-box; }
    body { margin:0; font-family:Naskh,sans-serif; color:#172554; font-size:10.5pt; line-height:1.45; }
    header { position:relative; overflow:hidden; background:linear-gradient(115deg,#172554 0%,#3730a3 55%,#7c3aed 100%); color:white; padding:11px 16px; border-radius:10px; margin-bottom:10px; box-shadow:0 3px 10px #312e8130; }
    header:after { content:""; position:absolute; left:-18px; top:-38px; width:115px; height:115px; border:18px solid #ffffff20; border-radius:50%; }
    h1 { font-size:18pt; margin:0; letter-spacing:.1px; }
    h2 { font-size:13pt; color:#3730a3; margin:9px 0 5px; padding:5px 9px; border-right:4px solid #8b5cf6; background:#f5f3ff; border-radius:0 5px 5px 0; }
    .range { margin-top:3px; color:#e0e7ff; font-size:9.5pt; }
    table { width:100%; border-collapse:separate; border-spacing:0; margin-bottom:9px; border:1px solid #c7d2fe; border-radius:7px; overflow:hidden; }
    thead { display:table-header-group; }
    tfoot { display:table-footer-group; }
    tr { break-inside:avoid; page-break-inside:avoid; }
    th,td { border-left:1px solid #e0e7ff; border-bottom:1px solid #e0e7ff; padding:6px 8px; text-align:right; vertical-align:top; }
    thead th { background:linear-gradient(110deg,#312e81,#4f46e5); color:white; padding:7px 8px; font-size:10pt; }
    tbody tr:nth-child(even) { background:#f5f7ff; }
    tbody tr:nth-child(odd) { background:#fff; }
    tbody tr:last-child th, tbody tr:last-child td { border-bottom:0; }
    th:first-child, td:first-child { border-right:0; }
    .standard th:first-child { width:19%; color:#3730a3; background:#eef2ff; }
    .standard th:not(:first-child) { font-weight:700; }
    .standard td:nth-child(2) { color:#4338ca; font-weight:700; }
    .subject { display:inline-block; padding:1px 7px; border-radius:999px; background:#ede9fe; color:#5b21b6; font-size:9.5pt; }
    .achievement { width:15%; min-width:90px; background:#fff; }
    .standard .achievement { height:34px; }
    .global td:nth-child(2) { color:#4338ca; }
    .global td:nth-child(4) { line-height:1.65; }
    h2 { break-after:avoid-page; }
  </style></head><body>
    <header><h1>${escapeHtml(data.title)}</h1>
      <div class="range">${escapeHtml(dateLabel(data.startDate))} — ${escapeHtml(dateLabel(data.endDate))}</div>
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
    browserPromise = puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    }).then((browser) => {
      browser.once('disconnected', () => { browserPromise = undefined; });
      return browser;
    }).catch((error: unknown) => {
      browserPromise = undefined;
      throw error;
    });
  }
  return browserPromise;
}

export const pdfService = {
  async generateStudyTablePDF(data: StudyTablePdfData): Promise<Buffer> {
    await acquirePdfSlot();
    let page: Awaited<ReturnType<Browser['newPage']>> | undefined;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      page.setDefaultTimeout(pageTimeoutMs);
      await page.setContent(buildHtml(data), { waitUntil: 'load', timeout: pageTimeoutMs });
      await page.evaluate(async () => { await document.fonts.ready; });
      const output = Buffer.from(await page.pdf({
        format: 'A4',
        printBackground: true,
        timeout: pageTimeoutMs,
      }));
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
