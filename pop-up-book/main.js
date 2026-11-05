// main.js — يربط المحتوى (lessons.js) بالمجسّمات (models.js) والكتاب (book.js)
import * as AR from './lessons.js';
import * as EN from './lessons.en.js';
import { lang, t } from './i18n.js';
const { LESSONS, MODULE } = lang === 'en' ? EN : AR;
import { MODELS } from './models.js';
import { BookScene } from './book.js';

const $ = (s) => document.querySelector(s);
const AR_LETTERS = t(['أ', 'ب', 'ج'], ['A', 'B', 'C']);
const KEY = 'popup-book-ratios-v1';

// ---------- التقدّم (يُحفظ في المتصفح إن أمكن) ----------
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { saved = {}; }
const store = (id) => (saved[id] ||= { picked: null, flap: false, touched: [] });
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* تجاهل */ } };

// ---------- المشهد ----------
const scene = new BookScene($('#app'));
const pageRoot = document.createElement('div');
pageRoot.className = 'page-root';
scene.mountLeftUI(pageRoot);

let cur = -1, busy = false, reveal = null;

function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.remove('on'), ms);
}

// ---------- بناء الصفحة اليسرى ----------
function pageHTML(L, i) {
  const st = store(L.id);
  const done = st.touched.length >= L.targets.length;
  const picked = st.picked;
  const q = L.quiz;
  return `
  <div class="pg-kicker">${t('الدرس','Lesson')} ${L.id} · ${t('الوحدة','Module')} ${MODULE.num} — ${MODULE.title} · ${t('ص','p.')} ${L.pages}</div>
  <h1 class="pg-title">${L.title}</h1>
  ${lang === 'ar' ? `<div class="pg-en">${L.en}</div>` : ''}
  <p class="pg-concept">${L.concept}</p>
  <p class="pg-summary">${L.summary}</p>
  <section class="formula">
    <h3>✎ ${L.formula.label}</h3>
    <div class="eq">${L.formula.html}</div>
    <div class="rows">${L.formula.rows.map((r) => `<span>${r}</span>`).join('')}</div>
  </section>
  <section class="vocab"><h3>${t('مفردات أساسية','Key vocabulary')}</h3>
    <dl>${L.vocab.map(([ar, en, def]) => `<div><dt>${ar}${en ? `<i>${en}</i>` : ''}</dt><dd>${def}</dd></div>`).join('')}</dl>
  </section>
  <section class="quiz">
    <h3>⟡ ${t('توقّع قبل أن تجرّب','Predict before you try')}</h3>
    <p class="q">${q.q}</p>
    <div class="opts">${q.options.map((o, k) => `<button class="opt" data-k="${k}"><b>${AR_LETTERS[k]}</b>${o}</button>`).join('')}</div>
    <div class="feedback" aria-live="polite"></div>
  </section>
  <div class="bottom">
    <div class="flapwrap">
      <div class="under"><h4>${t('لماذا؟','Why?')}</h4>${L.why}</div>
      <div class="flap ${picked === null ? 'locked' : 'unlocked'} ${st.flap ? 'open' : ''}">
        <div class="face front" role="button" tabindex="0">
          <b>${picked === null ? '🔒' : '☝'}</b>
          <span>${picked === null ? t('اختر توقّعك أولاً','Make a prediction first') : t('لماذا؟ — ارفع اللسان','Why? — lift the flap')}</span>
          <small>${picked === null ? t('اللسان الورقي مغلق','The flap is locked') : t('المسه ليُفتح','Tap to open')}</small>
        </div>
        <div class="face back">${t('اللسان الورقي — اقرأ الشرح تحته','Paper flap — read the answer beneath')}</div>
      </div>
    </div>
    <div class="stamp ${done ? 'inked' : ''}" title="ختم الإتمام">
      <div class="ring"><div><span>${Math.min(st.touched.length, L.targets.length)}/${L.targets.length}</span><small>${t('تفاعل مع كل عناصر المجسّم','Interact with every part of the model')}</small></div></div>
      <div class="seal"><div>${t('أتقنت<br>الدرس','Lesson<br>mastered')}<em>${L.id}</em></div></div>
    </div>
  </div>`;
}

function applyPick(L, k, quiet) {
  const st = store(L.id);
  const opts = [...pageRoot.querySelectorAll('.opt')];
  opts.forEach((b) => { b.disabled = true; });
  opts[k].classList.add(k === L.quiz.answer ? 'ok' : 'no');
  if (k !== L.quiz.answer) opts[L.quiz.answer].classList.add('reveal');
  const fb = pageRoot.querySelector('.feedback');
  fb.className = 'feedback ' + (k === L.quiz.answer ? 'ok' : 'no');
  fb.textContent = k === L.quiz.answer ? t('✓ توقّع صحيح! جرّب المجسّم لتتأكد بنفسك.','✓ Correct! Try the model to see for yourself.') : t('✗ ليس تماماً — ارفع اللسان لتعرف السبب، ثم جرّب المجسّم.','✗ Not quite — lift the flap to see why, then try the model.');
  const flap = pageRoot.querySelector('.flap');
  flap.classList.remove('locked'); flap.classList.add('unlocked');
  flap.querySelector('.front b').textContent = '☝';
  flap.querySelector('.front span').textContent = t('لماذا؟ — ارفع اللسان','Why? — lift the flap');
  flap.querySelector('.front small').textContent = t('المسه ليُفتح','Tap to open');
  if (!quiet) { st.picked = k; persist(); toast(t('انفتح اللسان الورقي! المسه لترى «لماذا؟»','The flap is unlocked! Tap it to see “Why?”')); }
}

function bindPage(L) {
  const st = store(L.id);
  pageRoot.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
    if (store(L.id).picked !== null) return;
    applyPick(L, +b.dataset.k);
  }));
  const flap = pageRoot.querySelector('.flap');
  const toggle = () => {
    if (flap.classList.contains('locked')) { toast(t('اختر توقّعك أولاً لتفتح اللسان 🔒','Make a prediction to unlock the flap 🔒')); return; }
    flap.classList.toggle('open');
    store(L.id).flap = flap.classList.contains('open'); persist();
  };
  flap.querySelector('.front').addEventListener('click', toggle);
  flap.querySelector('.front').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  flap.querySelector('.back').addEventListener('click', toggle);
  if (st.picked !== null) applyPick(L, st.picked, true);
}

// ---------- التفاعل مع المجسّم ----------
function makeCtx(L) {
  return {
    touch(id) {
      const st = store(L.id);
      if (!L.targets.includes(id) || st.touched.includes(id)) return;
      st.touched.push(id); persist();
      const n = st.touched.length, total = L.targets.length;
      const ring = pageRoot.querySelector('.stamp .ring span');
      if (ring) ring.textContent = `${n}/${total}`;
      if (n >= total) {
        pageRoot.querySelector('.stamp')?.classList.add('inked');
        toast(t('🎉 تم ختم الدرس! أتقنت كل عناصر المجسّم','🎉 Lesson stamped! You explored every part.'), 3200);
        refreshDots();
      } else toast(`✓ ${n}/${total}`, 1600);
    },
  };
}

function setLesson(i) {
  const L = LESSONS[i];
  cur = i;
  pageRoot.innerHTML = pageHTML(L, i);
  bindPage(L);
  scene.setPageNumbers(+L.pages.split(' ')[0] || i + 1);
  const model = MODELS[L.model](makeCtx(L));
  scene.mountModel(model);
  history.replaceState(null, '', '#' + L.id);
  refreshDots();
}

// ---------- تقدّم الظهور (انبثاق المجسّم) ----------
function startReveal(dir, then) {
  reveal = { f: dir > 0 ? 0 : 1, dir, then };
}

async function goTo(i, { instant = false } = {}) {
  if (busy || i === cur || i < 0 || i >= LESSONS.length) return;
  if (cur === -1 || instant) {
    setLesson(i);
    scene.setRightLesson(LESSONS[i]);
    startReveal(1);
    return;
  }
  busy = true;
  const dir = i > cur ? 1 : -1;
  pageRoot.classList.add('fading');
  await new Promise((res) => startReveal(-1, res)); // انكماش المجسّم
  await scene.flip(dir, LESSONS[i], () => { setLesson(i); scene.model.setReveal(0); });
  pageRoot.classList.remove('fading');
  busy = false;
  startReveal(1);
  if (i === 0 && !goTo.shown) { goTo.shown = true; }
  toast(LESSONS[i].hint, 4200);
}

// ---------- الحلقة ----------
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (reveal && scene.model) {
    reveal.f = Math.max(0, Math.min(1, reveal.f + reveal.dir * dt / (reveal.dir > 0 ? 1.5 : 0.35)));
    scene.model.setReveal(reveal.f);
    if ((reveal.dir > 0 && reveal.f >= 1) || (reveal.dir < 0 && reveal.f <= 0)) { const r = reveal; reveal = null; r.then?.(); }
  } else if (reveal && !scene.model) { const r = reveal; reveal = null; r.then?.(); }
  scene.frame(dt, now / 1000);
  requestAnimationFrame(loop);
}

// ---------- مؤشر الفأرة واللمس ----------
const cv = scene.renderer.domElement;
let down = null;
cv.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: 0 }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
cv.addEventListener('pointermove', (e) => {
  if (down) {
    down.moved += Math.abs(e.clientX - down.lx) + Math.abs(e.clientY - down.ly);
    if (down.moved > 6) scene.nudge(e.clientX - down.lx, e.clientY - down.ly);
    down.lx = e.clientX; down.ly = e.clientY;
    return;
  }
  const hit = scene.pick(e.clientX, e.clientY);
  scene.model?.setHover(hit?.object || null);
  cv.style.cursor = hit ? 'pointer' : 'grab';
});
cv.addEventListener('pointerup', (e) => {
  const d = down; down = null; cv.style.cursor = 'grab';
  if (!d || d.moved > 8 || busy) return;
  const hit = scene.pick(e.clientX, e.clientY);
  if (!hit) return;
  if (hit.id === 'ribbon') { openTOC(); return; }
  scene.model?.onTap(hit.id, hit.object);
});
cv.addEventListener('wheel', (e) => { e.preventDefault(); scene.zoom(e.deltaY); }, { passive: false });
addEventListener('resize', () => scene.resize());

// ---------- أزرار التحكم ----------
$('#modTitle').textContent = `${t('الوحدة','Module')} ${MODULE.num}: ${MODULE.title}`;
$('#modQ').textContent = `${t('السؤال الأساسي','Essential question')}: ${MODULE.question}`;
$('#prev').textContent = t('◀ السابق', '◀ Prev');
$('#next').textContent = t('التالي ▶', 'Next ▶');
$('#tocBtn').textContent = t('☰ الفهرس', '☰ Contents');
$('#tocClose').textContent = t('إغلاق', 'Close');
document.querySelector('[data-view=all]').textContent = t('الكتاب', 'Book');
document.querySelector('[data-view=read]').textContent = t('اقرأ', 'Read');
document.querySelector('[data-view=play]').textContent = t('جرّب', 'Play');
document.title = t('كتاب الرياضيات المنبثق — النسب والمعدلات', 'Pop-up Math Book — Ratios and Rates');
$('#loading').textContent = t('جاري فتح الكتاب…', 'Opening the book…');
$('#langBtn').textContent = lang === 'en' ? 'عربي' : 'English';
$('#langBtn').addEventListener('click', () => { location.href = `?lang=${lang === 'en' ? 'ar' : 'en'}#${LESSONS[cur]?.id || ''}`; });
$('#prev').addEventListener('click', () => goTo(cur - 1));
$('#next').addEventListener('click', () => goTo(cur + 1));
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
  scene.setView(b.dataset.view);
  document.querySelectorAll('[data-view]').forEach((x) => x.classList.toggle('on', x === b));
}));
addEventListener('keydown', (e) => {
  if (e.target.closest?.('input,textarea')) return;
  if (e.key === 'ArrowRight') goTo(cur + 1);
  else if (e.key === 'ArrowLeft') goTo(cur - 1);
  else if (e.key === 'Escape') $('#toc').hidden = true;
});

function refreshDots() {
  const dots = $('#dots');
  dots.innerHTML = '';
  LESSONS.forEach((L, i) => {
    const b = document.createElement('button');
    const done = store(L.id).touched.length >= L.targets.length;
    b.className = 'dot' + (i === cur ? ' cur' : '') + (done ? ' done' : '');
    b.title = `${L.id} ${L.title}`;
    b.setAttribute('aria-label', `${t('الدرس','Lesson')} ${L.id}: ${L.title}`);
    b.addEventListener('click', () => goTo(i));
    dots.appendChild(b);
  });
  $('#prev').disabled = cur <= 0;
  $('#next').disabled = cur >= LESSONS.length - 1;
}

function openTOC() {
  $('#tocTitle').textContent = `${t('الوحدة','Module')} ${MODULE.num}: ${MODULE.title}`;
  const ol = $('#tocList');
  ol.innerHTML = '';
  LESSONS.forEach((L, i) => {
    const li = document.createElement('li');
    const done = store(L.id).touched.length >= L.targets.length;
    li.innerHTML = `<button><b>${L.id}</b>${L.title}${done ? `<i>✓ ${t('مختوم', 'stamped')}</i>` : ''}</button>`;
    li.firstChild.addEventListener('click', () => { $('#toc').hidden = true; goTo(i); });
    ol.appendChild(li);
  });
  $('#toc').hidden = false;
}
$('#tocBtn').addEventListener('click', openTOC);
$('#tocClose').addEventListener('click', () => { $('#toc').hidden = true; });
$('#toc').addEventListener('click', (e) => { if (e.target.id === 'toc') $('#toc').hidden = true; });

// ---------- الإقلاع ----------
async function boot() {
  try {
    await Promise.race([
      Promise.all(['700 20px "Amiri"', '400 20px "Amiri"', '700 20px "Aref Ruqaa"', '400 20px "Aref Ruqaa"'].map((f) => document.fonts.load(f, 'أبجد 123'))),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* نكمل بخطوط النظام */ }
  const hashId = location.hash.slice(1);
  const start = Math.max(0, LESSONS.findIndex((L) => L.id === hashId));
  if (innerWidth / innerHeight < 0.85) scene.setView('read');
  requestAnimationFrame(loop);
  goTo(start, { instant: true });
  setTimeout(() => $('#loading').classList.add('gone'), 300);
  toast(t('اسحب لتدوير الكتاب • عجلة الفأرة للتقريب • المس الشريط الأزرق للفهرس','Drag to orbit • scroll to zoom • tap the blue ribbon for contents'), 5000);
}
boot();
window.__book = { finish() { reveal = null; scene.model?.setReveal(1); }, scene, goTo, LESSONS, get cur() { return cur; } };
