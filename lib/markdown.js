// محوّل Markdown آمن وبسيط للمدونة (آمن للمتصفح والخادم).
// يُهرَّب كل HTML أولاً، ثم تُطبّق صيغ محدودة فقط، والروابط تُقبل بـ http(s) أو / فقط.
// المدعوم: # عناوين، **عريض**، *مائل*، [رابط](url)، ![صورة](url)، قوائم - و 1.، > اقتباس، فقرات.
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => (/^(https?:\/\/|\/(?!\/))/.test(u) ? u : '#');

function inline(text) {
  return esc(text)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) => `<img src="${safeUrl(url)}" alt="${alt}" loading="lazy" />`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
      const u = safeUrl(url);
      const ext = u.startsWith('http');
      return `<a href="${u}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
}

export function renderMarkdown(md) {
  const lines = String(md || '').replace(/\r/g, '').split('\n');
  const out = [];
  let list = null;
  let para = [];
  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.type}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.type}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    let m;
    if (!line) {
      flushPara();
      flushList();
    } else if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) {
      flushPara();
      flushList();
      const level = Math.min(4, m[1].length + 1); // # يصبح h2 (h1 لعنوان المقال)
      out.push(`<h${level}>${inline(m[2])}</h${level}>`);
    } else if ((m = /^[-*]\s+(.*)$/.exec(line)) || (m = /^\d+[.)]\s+(.*)$/.exec(line))) {
      flushPara();
      const type = /^\d/.test(line) ? 'ol' : 'ul';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push(m[1]);
    } else if ((m = /^>\s?(.*)$/.exec(line))) {
      flushPara();
      flushList();
      out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out.join('\n');
}

// نص عادي من Markdown (للأوصاف و SEO)
export const plainText = (md) =>
  String(md || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#*>`_-]/g, '').replace(/\s+/g, ' ').trim();
