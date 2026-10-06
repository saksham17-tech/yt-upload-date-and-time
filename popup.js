const content = document.getElementById('content');
const refreshBtn = document.getElementById('refresh');
const tzSelect = document.getElementById('tzSelect');

const STORAGE_KEY = 'youtubeUploadDate.timezone';
let currentInfo = null;

// ---------- Helpers ----------

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Runs inside the YouTube page
function extractVideoInfo() {
  if (!location.hostname.includes('youtube.com')) return null;

  const data = window.ytInitialPlayerResponse;
  if (data && data.videoDetails) {
    const vd = data.videoDetails;
    return {
      uploadDate: vd.uploadDate || null,
      title: vd.title || document.title.replace(' - YouTube', ''),
      author: vd.author || '',
      durationSeconds: parseInt(vd.lengthSeconds, 10) || null,
      isLive: vd.isLiveContent || false,
      viewCount: vd.viewCount || null,
      shortDescription: vd.shortDescription || ''
    };
  }

  const uploadMeta = document.querySelector('meta[itemprop="uploadDate"]');
  const titleMeta = document.querySelector('meta[name="title"]');
  const authorMeta = document.querySelector('meta[name="author"]');

  if (uploadMeta) {
    return {
      uploadDate: uploadMeta.content,
      title: titleMeta ? titleMeta.content : document.title.replace(' - YouTube', ''),
      author: authorMeta ? authorMeta.content : '',
      durationSeconds: null,
      isLive: false,
      viewCount: null,
      shortDescription: ''
    };
  }

  const dateEl = document.querySelector('#info-strings yt-formatted-string, #info span');
  if (dateEl) {
    return {
      uploadDate: null,
      dateText: dateEl.textContent.trim(),
      title: document.title.replace(' - YouTube', ''),
      author: '',
      durationSeconds: null,
      isLive: false,
      viewCount: null,
      shortDescription: ''
    };
  }

  return null;
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Detect if the ISO string lacks a time component (e.g. "2024-01-15")
function isDateOnly(iso) {
  return typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso.trim());
}

// Format an ISO timestamp in the given IANA timezone (or "local")
function formatInTimeZone(isoString, tz) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;

  const opts = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  };

  if (tz && tz !== 'local') opts.timeZone = tz;

  try {
    return new Intl.DateTimeFormat(undefined, opts).format(d);
  } catch (e) {
    console.warn('Invalid timezone:', tz, e);
    return null;
  }
}

// Get short timezone abbreviation (e.g. IST, PST, GMT+5:30)
function getTimeZoneAbbr(isoString, tz) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  try {
    const opts = { timeZoneName: 'short' };
    if (tz && tz !== 'local') opts.timeZone = tz;
    const parts = new Intl.DateTimeFormat(undefined, opts).formatToParts(d);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch {
    return '';
  }
}

// ---------- UI ----------

function showLoading() {
  content.innerHTML = '<div class="muted">Reading video…</div>';
}

function showError(msg) {
  content.innerHTML = `<div class="error">${msg}</div>`;
}

function render(info) {
  currentInfo = info;

  const tz = tzSelect.value || 'local';
  const uploadDateLocal = formatInTimeZone(info.uploadDate, tz);
  const tzAbbr = getTimeZoneAbbr(info.uploadDate, tz);
  const duration = formatDuration(info.durationSeconds);
  const dateOnly = info.uploadDate ? isDateOnly(info.uploadDate) : false;

  const uploadedDisplay =
    uploadDateLocal ??
    info.uploadDate ??
    info.dateText ??
    'Unknown';

  content.innerHTML = `
    <div class="row">
      <div class="label">Uploaded</div>
      <div class="value big">
        ${uploadedDisplay}
        ${tzAbbr ? `<span class="tz">${tzAbbr}</span>` : ''}
      </div>
      ${dateOnly ? `<div class="notice">Only the date is available — YouTube didn't expose the time.</div>` : ''}
    </div>
    ${info.uploadDate ? `
    <div class="row">
      <div class="label">Raw timestamp</div>
      <div class="value" style="font-size:12px;color:#aaa;">${info.uploadDate}</div>
    </div>` : ''}
    <div class="row">
      <div class="label">Title</div>
      <div class="value">${info.title || '—'}</div>
    </div>
    <div class="row">
      <div class="label">Channel</div>
      <div class="value">${info.author || '—'}</div>
    </div>
    <div class="row">
      <div class="label">Duration</div>
      <div class="value">${duration} ${info.isLive ? '· 🔴 Live' : ''}</div>
    </div>
    <div class="actions">
      <button class="btn primary" id="copyBtn">Copy timestamp</button>
      <button class="btn" id="openBtn">Open video</button>
    </div>
  `;

  document.getElementById('copyBtn').addEventListener('click', (e) => {
    const text = info.uploadDate || info.dateText || '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      e.target.textContent = 'Copied!';
      setTimeout(() => (e.target.textContent = 'Copy timestamp'), 1500);
    });
  });

  document.getElementById('openBtn').addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (tab && tab.url) chrome.tabs.create({ url: tab.url });
  });
}

// ---------- Data flow ----------

async function load() {
  showLoading();
  try {
    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      showError('No active tab found.');
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractVideoInfo
    });

    const info = results[0]?.result;
    if (!info) {
      showError("This doesn't look like a YouTube video page.");
      return;
    }

    render(info);
  } catch (err) {
    console.error(err);
    showError('Could not read video info. Make sure you are on a YouTube watch page.');
  }
}

// ---------- Init ----------

async function init() {
  // Restore saved timezone
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    if (stored && stored[STORAGE_KEY]) {
      // If the saved value isn't in the list, add it so the select shows it
      const saved = stored[STORAGE_KEY];
      if (![...tzSelect.options].some(o => o.value === saved)) {
        const opt = document.createElement('option');
        opt.value = saved;
        opt.textContent = saved;
        tzSelect.appendChild(opt);
      }
      tzSelect.value = saved;
    }
  } catch (e) {
    console.warn('Could not read saved timezone', e);
  }

  // Save on change and re-render
  tzSelect.addEventListener('change', async () => {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: tzSelect.value });
    } catch (e) {
      console.warn('Could not save timezone', e);
    }
    if (currentInfo) render(currentInfo);
  });

  refreshBtn.addEventListener('click', load);

  await load();
}

document.addEventListener('DOMContentLoaded', init);