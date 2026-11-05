// models.js — مجسّم تفاعلي بالحبر لكل درس. كل دالة تُعيد Model يحتوي group + hits + onTap
import * as THREE from 'three';
import { t } from './i18n.js';
import { C, Model, block, cylinder, label, button, stage, inkPath, inkDashed, inkEdges, fillMat } from './ink.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ONE = V(1, 1, 1);
const SMALL = V(0.05, 0.05, 0.05);
const STAGE_W = 5.3;

// يضيف عنصراً بحركة «انبثاق» من نقطة بداية
function popIn(m, obj, from, to) {
  obj.position.copy(from);
  obj.scale.copy(SMALL);
  m.add(obj);
  m.to(obj, { pos: to, scale: ONE, speed: 7 });
}

// ============ 1-1  فهم النسب: الليمونادة ============
function ratios(ctx) {
  const m = new Model();
  m.add(stage(STAGE_W, 6.6));
  const CW = 0.5, rowsG = new THREE.Group();
  m.add(rowsG);
  const cols = [C.lemon, C.lemon, C.orange, ...Array(7).fill(C.sky)];
  const ids = ['lemon', 'lemon', 'syrup', ...Array(7).fill('water')];
  let batches = 1;
  const rows = [];

  const info = label(t('اضغط على المكعبات','Tap the cubes'), { chip: true, size: 0.34 });
  info.position.set(0, 1.75, -2.45);
  m.add(info);
  const legend = label(t('أصفر = عصير ليمون   برتقالي = شراب   أزرق = ماء','yellow = lemon juice   orange = syrup   blue = water'), { size: 0.26, weight: 400 });
  legend.position.set(0, 0.3, 3.05);
  m.add(legend);

  function addRow(k, animate) {
    const row = new THREE.Group();
    const z = 1.55 - k * 1.2;
    row.position.set(0, 0.06, z);
    row.userData.cells = [];
    for (let i = 0; i < 10; i++) {
      const b = block(CW - 0.05, 0.4, 0.74, { fill: cols[i], id: ids[i], seed: i + k * 13 });
      b.position.x = (i - 4.5) * CW;
      b.userData.base = 0;
      row.add(b);
      row.userData.cells.push(b);
    }
    rows.push(row);
    if (animate) { row.scale.set(1, 0.05, 1); }
    m.add(row);
    if (animate) m.to(row, { scale: ONE, speed: 8 });
  }
  addRow(0, false);

  const setText = () => {
    const k = batches;
    const t = info.userData.mode;
    if (t === 'whole') info.userData.setText(`${t('جزء إلى كل','Part-to-whole')}\n${2 * k} : ${10 * k}`);
    else if (t === 'part') info.userData.setText(`${t('جزء إلى جزء','Part-to-part')}\n${2 * k} : ${7 * k}`);
    else if (t === 'syrup') info.userData.setText(`${t('شراب إلى ماء','Syrup to water')}\n${1 * k} : ${7 * k}`);
    else info.userData.setText(`${k} ${t('دفعة','batch')} = ${10 * k} ${t('كوب','cups')}\n${2 * k} : ${10 * k}`);
  };
  const lift = (sel) => {
    rows.forEach((r) => r.userData.cells.forEach((c, i) => {
      m.to(c, { pos: V(c.position.x, sel(i) ? 0.35 : 0, 0), speed: 10 });
    }));
  };

  const addBtn = button(t('+ دفعة','+ batch'), 'batch', { color: '#ffd96b' });
  addBtn.position.set(0, 0.5, 2.5);
  m.add(addBtn);

  m.onTap = (id) => {
    if (id === 'batch') {
      if (batches < 3) { addRow(batches, true); batches++; }
      else { while (rows.length > 1) m.remove(rows.pop()); batches = 1; }
      info.userData.mode = 'batch';
      lift(() => false);
      setText();
    } else if (id === 'lemon') {
      info.userData.mode = 'whole'; setText();
      lift((i) => i < 2);
    } else if (id === 'water') {
      info.userData.mode = 'part'; setText();
      lift((i) => i < 2 || i > 2);
    } else if (id === 'syrup') {
      info.userData.mode = 'syrup'; setText();
      lift((i) => i >= 2);
    }
    ctx.touch(id === 'lemon' ? 'whole' : id === 'water' || id === 'syrup' ? 'part' : 'batch');
  };
  return m;
}

// ============ 1-2  جدول النسب المتكافئة ============
function table(ctx) {
  const m = new Model();
  m.add(stage(STAGE_W, 6.6));
  const top = [2, 4, 6, 8, 10], bot = [3, 6, 9, 12, 15];
  const X = (j) => -2 + j;
  const colGroups = [];
  for (let j = 0; j < 5; j++) {
    const g = new THREE.Group();
    g.position.set(X(j), 0.06, 0);
    const a = block(0.9, 0.34, 0.9, { fill: C.lemon, id: 'col' + j, seed: j * 5 + 1 });
    a.position.z = -0.7;
    const b = block(0.9, 0.34, 0.9, { fill: C.sky, id: 'col' + j, seed: j * 5 + 2 });
    b.position.z = 0.7;
    const la = label(String(top[j]), { size: 0.5 }); la.position.set(0, 0.62, -0.7);
    const lb = label(String(bot[j]), { size: 0.5 }); lb.position.set(0, 0.62, 0.7);
    g.add(a, b, la, lb);
    m.add(g);
    colGroups.push(g);
  }
  const t1 = label(t('زبادي يوناني (كوب)','Greek yogurt (c)'), { size: 0.3, color: '#8a5a00' }); t1.position.set(-1.0, 0.3, -1.55); m.add(t1);
  const t2 = label(t('دقيق (كوب)','Flour (c)'), { size: 0.3, color: '#245c8a' }); t2.position.set(-1.65, 0.3, 1.5); m.add(t2);
  const info = label(t('اضغط عموداً لتحجيمه','Tap a column to scale it'), { chip: true, size: 0.34 });
  info.position.set(0, 1.6, -2.95); m.add(info);

  let mode = 'fwd';
  let arcs = null;
  const arc = (j, back) => {
    const g = new THREE.Group();
    const col = back ? C.coral : C.teal;
    for (const [zz, y0] of [[-2.05, 0.5], [2.05, 0.5]]) {
      const pts = [];
      const x1 = back ? X(j) : X(0), x2 = back ? X(0) : X(j);
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        pts.push(V(x1 + (x2 - x1) * t, y0 + Math.sin(Math.PI * t) * (0.55 + 0.12 * j), zz));
      }
      g.add(inkPath(pts, { color: col, width: 2.6, j: 0.01, passes: 2, seed: 9 }));
      const l = label((back ? '÷ ' : '× ') + (j + 1), { size: 0.4, color: back ? '#b1391f' : '#14766f' });
      l.position.set((x1 + x2) / 2, y0 + 0.95 + 0.12 * j, zz);
      g.add(l);
    }
    return g;
  };
  const btn = button(t('الوضع: × للأمام','Mode: × forward'), 'toggle', { color: '#bfe8e3' });
  btn.position.set(0, 0.55, 3.0); m.add(btn);

  m.onTap = (id) => {
    if (id === 'toggle') {
      mode = mode === 'fwd' ? 'back' : 'fwd';
      btn.userData.setText(mode === 'fwd' ? t('الوضع: × للأمام','Mode: × forward') : t('الوضع: ÷ للخلف','Mode: ÷ backward'), { chipColor: mode === 'fwd' ? '#bfe8e3' : '#ffc9bb' });
      return;
    }
    const j = +id.slice(3);
    if (arcs) { m.remove(arcs); arcs = null; }
    colGroups.forEach((g, i) => m.to(g, { pos: V(X(i), i === j || (i === 0 && j > 0) ? 0.5 : 0.06, 0), speed: 9 }));
    if (j === 0) { info.userData.setText(t('العمود الأول: 2 : 3','First column: 2 : 3')); return; }
    arcs = arc(j, mode === 'back');
    m.add(arcs);
    const k = j + 1;
    info.userData.setText(mode === 'fwd'
      ? `2 : 3  ⟵  ${top[j]} : ${bot[j]}\n(× ${k})`
      : `${top[j]} : ${bot[j]}  ⟵  2 : 3\n(÷ ${k})`);
    ctx.touch(mode === 'fwd' ? 'forward' : 'backward');
  };
  return m;
}

// ============ لوحة إحداثيات قائمة (تُستخدم في 1-3 و 1-4) ============
function wall(m, { w, h, xmax, ymax, xticks, yticks, xlabel, ylabel, z = -0.7 }) {
  const g = new THREE.Group();
  const ux = w / xmax, uy = h / ymax;
  const board = new THREE.Mesh(new THREE.BoxGeometry(w + 0.7, h + 0.55, 0.05), fillMat(0xfffaf0, 1));
  board.position.set(w / 2 - 0.05, (h + 0.55) / 2 - 0.2, z - 0.04);
  board.castShadow = true;
  g.add(board);
  g.add(inkEdges(board.geometry, { j: 0.01, width: 1.8 }).translateX(board.position.x).translateY(board.position.y).translateZ(board.position.z));
  for (const x of xticks) {
    g.add(inkDashed(V(x * ux, 0, z), V(x * ux, h, z), { dash: 0.05, gap: 0.07, width: 1, opacity: 0.25 }));
    const l = label(String(x), { size: 0.3 }); l.position.set(x * ux, -0.18, z + 0.1); g.add(l);
  }
  for (const y of yticks) {
    g.add(inkDashed(V(0, y * uy, z), V(w, y * uy, z), { dash: 0.05, gap: 0.07, width: 1, opacity: 0.25 }));
    const l = label(String(y), { size: 0.3 }); l.position.set(-0.26, y * uy, z + 0.1); g.add(l);
  }
  g.add(inkPath([V(0, 0, z), V(w + 0.2, 0, z)], { width: 2.8, j: 0.008, seed: 21 }));
  g.add(inkPath([V(0, 0, z), V(0, h + 0.15, z)], { width: 2.8, j: 0.008, seed: 22 }));
  g.add(inkPath([V(w + 0.08, 0.06, z), V(w + 0.2, 0, z), V(w + 0.08, -0.06, z)], { width: 2.4, j: 0, passes: 1 }));
  g.add(inkPath([V(-0.06, h + 0.07, z), V(0, h + 0.15, z), V(0.06, h + 0.07, z)], { width: 2.4, j: 0, passes: 1 }));
  const lx = label(xlabel, { size: 0.3, color: '#14766f' }); lx.position.set(w - 0.2, -0.55, z + 0.1); g.add(lx);
  const ly = label(ylabel, { size: 0.3, color: '#b1391f' }); ly.position.set(0.55, h + 0.38, z + 0.1); g.add(ly);
  // دعامات خلفية
  for (const x of [0.4, w - 0.2]) {
    g.add(inkPath([V(x, 0, z), V(x, 0.9, z), V(x, 0, z - 0.95), V(x, 0, z)], { width: 1.6, j: 0.008, seed: 30 + x, opacity: 0.8 }));
  }
  return { g, ux, uy, z };
}

// ============ 1-3  تمثيل بياني ============
function graph(ctx) {
  const m = new Model();
  m.add(stage(STAGE_W, 6.6));
  const root = new THREE.Group();
  root.position.set(-2.15, 0.06, 0.1);
  m.add(root);
  const W = wall(m, { w: 4.4, h: 3.3, xmax: 5, ymax: 15, xticks: [1, 2, 3, 4, 5], yticks: [3, 6, 9, 12, 15], xlabel: t('خل (كوب) x','vinegar (c) x'), ylabel: t('زيت (كوب) y','olive oil (c) y') });
  m.add(W.g, root);
  const pts = [], pointG = new THREE.Group();
  m.add(pointG, root);
  const chip = label(t('لكل 1 كوب خل: 3 أكواب زيت','1 c vinegar : 3 c oil'), { chip: true, size: 0.32 });
  chip.position.set(2.2, 4.2, 0.2);
  m.add(chip, root);
  let n = 0, line = null;
  const plot = button(t('ارسم نقطة (0/5)','Plot point (0/5)'), 'plot', { color: '#ffd1c7' });
  plot.position.set(-0.7, 0.5, 3.0);
  const lineBtn = button(t('أظهر الخط','Show line'), 'line', { color: '#d4ecc3' });
  lineBtn.position.set(1.7, 0.5, 3.0);
  m.add(plot, root); m.add(lineBtn, root);
  plot.position.set(1.4, 0.5, 2.7); lineBtn.position.set(4.3, 0.5, 2.7);

  m.onTap = (id) => {
    if (id === 'plot') {
      if (n >= 5) return;
      n++;
      const x = n, y = 3 * n;
      const g = new THREE.Group();
      const geo = new THREE.IcosahedronGeometry(0.13, 0);
      const mesh = new THREE.Mesh(geo, fillMat(C.coral, 1));
      mesh.castShadow = true;
      mesh.userData.id = 'pt' + n; mesh.userData.group = g;
      g.add(mesh, inkEdges(geo, { j: 0.004, passes: 1, width: 1.8 }));
      const to = V(x * W.ux, y * W.uy, W.z + 0.12);
      g.position.set(to.x, to.y + 2.2, to.z);
      g.userData.pair = [x, y];
      m.add(g, pointG);
      m.to(g, { pos: to, speed: 6 });
      pts.push(g);
      plot.userData.setText(n >= 5 ? t('كل النقاط ✓','All plotted ✓') : `${t('ارسم نقطة','Plot point')} (${n}/5)`);
      chip.userData.setText(`النقطة (${x}, ${y})`);
      ctx.touch('plot');
    } else if (id === 'line') {
      if (line) { m.remove(line); line = null; lineBtn.userData.setText(t('أظهر الخط','Show line')); return; }
      line = new THREE.Group();
      line.add(inkPath([V(0, 0, W.z + 0.06), V(5 * W.ux, 15 * W.uy, W.z + 0.06)], { color: C.coral, width: 2.8, j: 0.006, seed: 77 }));
      m.add(line, root);
      lineBtn.userData.setText(t('أخفِ الخط','Hide line'));
      chip.userData.setText(t('نقاط على خط مستقيم','Points on a straight line'));
      ctx.touch('line');
    } else if (id.startsWith('pt')) {
      const g = pts[+id.slice(2) - 1];
      const [x, y] = g.userData.pair;
      chip.userData.setText(`${t('الزوج المرتب','Ordered pair')} (${x}, ${y})\nx = ${x}, y = ${y}`);
      pts.forEach((p) => m.to(p, { scale: p === g ? V(1.7, 1.7, 1.7) : ONE, speed: 10 }));
      ctx.touch('pair');
    }
  };
  return m;
}

// ============ 1-4  مقارنة الخطوط ============
function compare(ctx) {
  const m = new Model();
  m.add(stage(STAGE_W, 6.6));
  const root = new THREE.Group();
  root.position.set(-2.1, 0.06, 0.2);
  m.add(root);
  const W = wall(m, { w: 4.1, h: 3.3, xmax: 4.2, ymax: 105, xticks: [1, 2, 3, 4], yticks: [25, 50, 75, 100], xlabel: t('أكواب الطعام x','cups of food x'), ylabel: t('بروتين (غ) y','protein (g) y') });
  m.add(W.g, root);
  const defs = [
    { id: 'A', rate: 25, color: C.teal, hex: '#14766f' },
    { id: 'B', rate: 22, color: C.coral, hex: '#b1391f' },
    { id: 'C', rate: 20, color: C.plum, hex: '#5d3e8a' },
  ];
  const info = label(t('اضغط على خط لتعرف نسبته','Tap a line to see its ratio'), { chip: true, size: 0.34 });
  info.position.set(2.2, 4.2, 0.2); m.add(info, root);
  const rails = {};
  defs.forEach((d, i) => {
    const dx = 4.2 * W.ux, dy = 4.2 * d.rate * W.uy;
    const L = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const outer = new THREE.Group();
    outer.position.set(0, 0, W.z + 0.1 + i * 0.1);
    outer.rotation.z = ang;
    const bar = block(L, 0.1, 0.14, { fill: d.color, id: d.id, seed: 40 + i, j: 0.006 });
    bar.position.x = L / 2;
    outer.add(bar);
    m.add(outer, root);
    rails[d.id] = outer;
    const lab = label(d.id, { size: 0.3, chip: true, chipColor: '#fff6d8', color: d.hex });
    lab.position.set(dx - 0.35, dy + (i === 0 ? 0.42 : i === 1 ? 0.02 : -0.4), W.z + 0.3);
    m.add(lab, root);
    for (let x = 1; x <= 4; x++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), fillMat(d.color, 1));
      dot.position.set(x * W.ux, x * d.rate * W.uy, W.z + 0.2 + i * 0.1);
      m.add(dot, root);
    }
  });
  m.onTap = (id) => {
    const d = defs.find((x) => x.id === id);
    const txt = { A: t('A: 25 غ لكل كوب\nالأشد انحداراً','A: 25 g per cup\nsteepest'), B: t('B: 44 ÷ 2 = 22\nغ لكل كوب','B: 44 ÷ 2 = 22\ng per cup'), C: t('C: 20 غ لكل كوب\nالأقل انحداراً','C: 20 g per cup\nleast steep') }[id];
    info.userData.setText(txt);
    defs.forEach((x) => m.to(rails[x.id], { scale: x.id === id ? V(1, 2.4, 2.4) : ONE, speed: 10 }));
    ctx.touch(d.id);
  };
  return m;
}

// ============ 1-5  مخطط الأشرطة ============
function bars(ctx) {
  const m = new Model();
  m.add(stage(STAGE_W, 6.6));
  const cells = [], labs = [];
  let divided = false, shaded = new Set();
  const Z = 0.2;
  const bracket = inkPath([V(-2.45, 0.75, Z - 0.9), V(-2.45, 1.15, Z - 0.9), V(2.45, 1.15, Z - 0.9), V(2.45, 0.75, Z - 0.9)], { width: 2.4, j: 0.01, seed: 5 });
  m.add(bracket);
  const total = label(t('525 طالباً','525 students'), { size: 0.4, chip: true }); total.position.set(0, 1.65, Z - 0.9); m.add(total);
  const info = label(t('اضغط الشريط لتقسيمه','Tap the bar to split it'), { chip: true, size: 0.34 }); info.position.set(0, 2.25, -2.5); m.add(info);
  for (let i = 0; i < 5; i++) {
    const c = block(0.96, 0.62, 1.0, { fill: 0xfffaf0, id: 'cell', seed: 60 + i });
    c.position.set((i - 2) * 0.98, 0.06, Z);
    c.userData.idx = i;
    m.add(c); cells.push(c);
  }
  const ans = block(3.4, 0.28, 0.8, { fill: C.orange, id: 'answer', seed: 99 });
  ans.position.set(0, 0.06, 2.3); m.add(ans);
  const ansL = label(t('كم طالباً يمارس الرياضة؟  اضغط','How many play sports?  Tap'), { size: 0.34 }); ansL.position.set(0, 0.7, 2.3); m.add(ansL);
  const tags = label('', { size: 0.34, weight: 400 }); tags.position.set(0, 0.25, Z + 1.0); m.add(tags);

  const refresh = () => {
    const n = shaded.size;
    info.userData.setText(divided ? `${t('مظلّل','Shaded')} ${n}/5 — ${t('اضغط الأقسام لتظلّل 3 منها','tap sections to shade 3')}` : t('اضغط الشريط لتقسيمه','Tap the bar to split it'));
    tags.userData.setText(n ? `${n} ${t('من 5 يلعبون','of 5 play')} ⟹ ${n} × 105 = ${n * 105}` : '');
  };
  m.onTap = (id, mesh) => {
    if (id === 'cell') {
      if (!divided) {
        divided = true;
        cells.forEach((c, i) => {
          m.to(c, { pos: V((i - 2) * 1.04, 0.06, Z), speed: 8 });
          const l = label('105', { size: 0.46 });
          l.position.set((i - 2) * 1.04, 0.95, Z);
          m.add(l); labs.push(l);
        });
        total.userData.setText(t('525 ÷ 5 = 105 لكل قسم','525 ÷ 5 = 105 per section'));
        ctx.touch('divide');
      } else {
        const g = mesh.userData.group;
        const i = g.userData.idx;
        if (shaded.has(i)) { shaded.delete(i); g.userData.setFill(0xfffaf0); }
        else { shaded.add(i); g.userData.setFill(C.leaf); }
        m.to(g, { pos: V(g.position.x, shaded.has(i) ? 0.3 : 0.06, Z), speed: 12 });
        setTimeout(() => m.to(g, { pos: V(g.position.x, 0.06, Z), speed: 6 }), 250);
        if (shaded.size >= 3) ctx.touch('shade');
      }
      refresh();
    } else if (id === 'answer') {
      ansL.userData.setText(t('3 × 105 = 315 طالباً','3 × 105 = 315 students'));
      total.userData.setText(t('الجواب: 315 طالباً','Answer: 315 students'));
      ctx.touch('answer');
    }
  };
  return m;
}

// ============ 1-6  سلّم الوحدات ============
function units(ctx) {
  const m = new Model();
  m.add(stage(STAGE_W, 6.6));
  const rowsDef = [
    { z: -2.3, text: t('1 جالون','1 gallon'), n: 1 },
    { z: -0.85, text: t('4 أرباع (qt)','4 quarts (qt)'), n: 4 },
    { z: 0.5, text: t('8 باينت (pt)','8 pints (pt)'), n: 8 },
    { z: 1.85, text: t('16 كوباً (c)','16 cups (c)'), n: 16 },
  ];
  const info = label(t('اضغط الجالون ليتفكك','Tap the gallon to split it'), { chip: true, size: 0.34 });
  info.position.set(0, 2.2, -2.7); m.add(info);
  const gallon = block(1.5, 1.35, 1.2, { fill: C.sky, id: 'gallon', seed: 11 });
  gallon.position.set(0, 0.06, rowsDef[0].z);
  m.add(gallon);
  const l0 = label(rowsDef[0].text, { size: 0.34 }); l0.position.set(2.0, 0.5, rowsDef[0].z); m.add(l0);
  const state = { quarts: null, pints: null, cups: null };
  const makeRow = (key, n, size, pitch, h, color, id, z, from, text) => {
    const g = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const b = block(size, h, size, { fill: color, id, seed: 200 + i + n });
      const to = V((i - (n - 1) / 2) * pitch, 0.06, z);
      popIn(m, b, V(from.x, 0.9, from.z), to);
    }
    const l = label(text, { size: 0.32 }); l.position.set(1.55, 0.12, z + 0.62); m.add(l);
    state[key] = g;
  };
  m.onTap = (id) => {
    if (id === 'gallon' && !state.quarts) {
      makeRow('quarts', 4, 0.8, 0.95, 0.75, C.teal, 'quart', rowsDef[1].z, V(0, 0, rowsDef[0].z), rowsDef[1].text);
      info.userData.setText(t('1 جالون = 4 أرباع\nاضغط ربعاً ليتفكك','1 gallon = 4 quarts\ntap a quart'));
      ctx.touch('quarts');
    } else if (id === 'quart' && !state.pints) {
      makeRow('pints', 8, 0.5, 0.6, 0.5, C.leaf, 'pint', rowsDef[2].z, V(0, 0, rowsDef[1].z), rowsDef[2].text);
      info.userData.setText(t('1 ربع = 2 باينت\nاضغط باينت ليتفكك','1 quart = 2 pints\ntap a pint'));
      ctx.touch('pints');
    } else if (id === 'pint' && !state.cups) {
      makeRow('cups', 16, 0.26, 0.3, 0.3, C.lemon, 'cup', rowsDef[3].z, V(0, 0, rowsDef[2].z), rowsDef[3].text);
      info.userData.setText(t('1 باينت = 2 كوب\n6 باينت = 12 كوباً = 96 أونصة','1 pint = 2 cups\n6 pints = 12 cups = 96 fl oz'));
      ctx.touch('cups');
    } else if (id === 'cup') {
      info.userData.setText(t('1 كوب = 8 أونصات سائلة\n16 كوباً = 128 أونصة','1 cup = 8 fl oz\n16 cups = 128 fl oz'));
    }
  };
  return m;
}

// ============ 1-7  مضمار الجري ============
function rates(ctx) {
  const m = new Model();
  m.add(stage(STAGE_W, 6.6));
  const cz = -1.35, RX = 2.35, RZ = 1.1;
  // المضمار
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, RX, RZ, 0, Math.PI * 2);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, 1.55, 0.55, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const trackGeo = new THREE.ShapeGeometry(shape, 40);
  trackGeo.rotateX(-Math.PI / 2);
  const track = new THREE.Mesh(trackGeo, fillMat(0xe0825c, 1));
  track.position.set(0, 0.07, cz); track.receiveShadow = true; m.add(track);
  const grass = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32).scale(1, 0.54, 1).rotateX(-Math.PI / 2), fillMat(C.leaf, 1));
  grass.scale.set(1.0, 1, 1.0); grass.position.set(0, 0.075, cz); m.add(grass);
  const ell = (rx, rz, seed) => inkPath(Array.from({ length: 49 }, (_, i) => V(Math.cos(i / 48 * Math.PI * 2) * rx, 0.1, cz + Math.sin(i / 48 * Math.PI * 2) * rz)), { j: 0.012, seed, width: 2.2 });
  m.add(ell(RX, RZ, 1)); m.add(ell(1.55, 0.55, 2));
  // العدّاء
  const runner = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 8), fillMat(C.plum, 1)); body.position.y = 0.3; body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), fillMat(C.cream, 1)); head.position.y = 0.62; head.castShadow = true;
  runner.add(body, head, inkEdges(body.geometry, { j: 0.004, passes: 1 }).translateY(0.3));
  runner.position.set(RX * 0.85 + 0.1, 0.07, cz);
  m.add(runner);
  const timer = label(t('الزمن 0.0 د  |  اللفات 0','Time 0.0 min  |  Laps 0'), { size: 0.34, chip: true }); timer.position.set(0, 0.5, cz); m.add(timer);
  let running = false, t = 0;
  const DUR = 6;
  const rx = (RX + 1.55) / 2, rz = (RZ + 0.55) / 2;
  m.updaters.push((dt) => {
    if (!running) return;
    t += dt;
    const p = Math.min(t / DUR, 1);
    const a = p * Math.PI * 2 * 4;
    runner.position.set(Math.cos(a) * rx, 0.07, cz + Math.sin(a) * rz);
    timer.userData.setText(`${t('الزمن','Time')} ${(p * 6).toFixed(1)} ${t('د','min')}  |  ${t('اللفات','Laps')} ${Math.floor(p * 4 + 1e-6)}`);
    if (p >= 1) { running = false; timer.userData.setText(t('6 دقائق = 4 لفات','6 minutes = 4 laps')); }
  });
  // أشرطة اللفات / الدقائق
  const lapsG = new THREE.Group(), minsG = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const b = block(1.05, 0.4, 0.8, { fill: C.sky, id: 'lap', seed: 300 + i });
    b.position.set((i - 1.5) * 1.1, 0.06, 1.95);
    const l = label(t('لفة 1','lap 1'), { size: 0.3 }); l.position.set(b.position.x, 0.75, 1.95); l.userData.cellLabel = true;
    lapsG.add(b, l);
  }
  for (let i = 0; i < 6; i++) {
    const b = block(0.7, 0.4, 0.8, { fill: C.lemon, id: 'lap', seed: 320 + i });
    b.position.set((i - 2.5) * 0.76, 0.06, 1.95);
    const l = label(t('1 د','1 min'), { size: 0.28 }); l.position.set(b.position.x, 0.75, 1.95);
    minsG.add(b, l);
  }
  minsG.visible = false; m.add(lapsG); m.add(minsG);
  const info = label(t('اضغط لفة لترى معدل الوحدة','Tap a lap for the unit rate'), { chip: true, size: 0.34 }); info.position.set(0, 2.1, -2.7); m.add(info);
  const runBtn = button(t('▶ ابدأ الجري','▶ Start run'), 'run', { color: '#d9c9f0' }); runBtn.position.set(-1.7, 0.5, 2.85); m.add(runBtn);
  const flipBtn = button(t('اقلب المعدل ⇄','Flip rate ⇄'), 'flip', { color: '#ffe9a8' }); flipBtn.position.set(1.7, 0.5, 2.85); m.add(flipBtn);
  let flipped = false;
  const showUnit = () => {
    if (!flipped) {
      lapsG.children.forEach((c) => c.userData.cellLabel && c.userData.setText(t('1.5 د','1.5 min')));
      info.userData.setText(t('6 ÷ 4 = 1.5 دقيقة لكل لفة','6 ÷ 4 = 1.5 min per lap'));
    } else {
      info.userData.setText(t('4 ÷ 6 = ⅔ لفة لكل دقيقة','4 ÷ 6 = ⅔ lap per min'));
      minsG.children.forEach((c) => c.isSprite && c.userData.setText(t('⅔ لفة','⅔ lap')));
    }
  };
  m.onTap = (id) => {
    if (id === 'run') { running = true; t = 0; ctx.touch('run'); }
    else if (id === 'lap') { showUnit(); ctx.touch('unit'); }
    else if (id === 'flip') {
      flipped = !flipped;
      lapsG.visible = !flipped; minsG.visible = flipped;
      m.hits.forEach((h) => { h.userData.hiddenSet = undefined; });
      info.userData.setText(flipped ? t('الآن بالدقائق: اضغط دقيقة','Now in minutes: tap one') : t('اضغط لفة لترى معدل الوحدة','Tap a lap for the unit rate'));
      ctx.touch('flip');
    }
  };
  return m;
}

// ============ 1-8  سباق السيارتين ============
function car(color, id) {
  const g = new THREE.Group();
  const body = block(0.95, 0.24, 0.5, { fill: color, id, seed: 71 }); body.position.y = 0.1;
  const cab = block(0.5, 0.22, 0.42, { fill: color, id, seed: 72 }); cab.position.set(-0.05, 0.34, 0);
  g.add(body, cab);
  for (const [x, z] of [[-0.3, 0.27], [0.3, 0.27], [-0.3, -0.27], [0.3, -0.27]]) {
    const w = cylinder(0.11, 0.11, 0.08, { fill: 0x39404c, axis: 'z', seed: 5 + x * 10 });
    w.position.set(x, 0.12, z); g.add(w);
  }
  return g;
}

function drive(ctx) {
  const m = new Model();
  m.add(stage(STAGE_W, 6.6));
  const lanes = [
    { id: 'destiny', z: -2.2, color: C.coral, rate: 55, total: 220, name: t('ديستني','Destiny') },
    { id: 'santiago', z: -0.15, color: C.teal, rate: 62, total: 248, name: t('سانتياغو','Santiago') },
  ];
  const road = (z) => {
    const r = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.06, 0.95), fillMat(0x59616d, 1));
    r.position.set(0, 0.09, z); r.receiveShadow = true; m.add(r);
    m.add(inkDashed(V(-2.4, 0.13, z), V(2.4, 0.13, z), { dash: 0.18, gap: 0.14, width: 1.4, opacity: 0.7, color: 0xfff6d8 }));
  };
  const cars = {};
  lanes.forEach((L) => {
    road(L.z);
    const c = car(L.color, L.id);
    c.position.set(-2.0, 0.12, L.z);
    m.add(c); cars[L.id] = c;
    const nm = label(`${L.name}: ${L.total} ${t('ميلاً / 4 ساعات','miles / 4 hours')}`, { size: 0.3 }); nm.position.set(0, 0.95, L.z - 0.1); m.add(nm);
  });
  const info = label(t('اضغط سيارة لتنطلق','Tap a car to start'), { chip: true, size: 0.34 }); info.position.set(0, 2.3, -2.9); m.add(info);
  const done = {};
  const hour = (L) => {
    for (let i = 0; i < 4; i++) {
      const b = block(1.1, 0.22, 0.4, { fill: L.color, op: 0.8, seed: 400 + i + L.rate });
      popIn(m, b, V(cars[L.id].position.x, 0.2, L.z), V((i - 1.5) * 1.15, 0.06, L.z + 0.75));
      const l = label(`${L.rate}`, { size: 0.3 });
      l.position.set((i - 1.5) * 1.15, 0.5, L.z + 0.75); m.add(l);
    }
  };
  // برج الفرق
  const base = block(0.9, 0.2, 0.9, { fill: C.orange, id: 'diff', seed: 88 });
  base.position.set(-1.2, 0.06, 2.3); m.add(base);
  const dl = label(t('الفرق في 9 ساعات؟\nاضغط','Difference in 9 hours?\nTap'), { size: 0.3 }); dl.position.set(0.9, 0.5, 2.3); m.add(dl);
  let stackN = 0, timer = 0, building = false;
  m.updaters.push((dt) => {
    if (!building) return;
    timer += dt;
    if (timer > 0.14 && stackN < 9) {
      timer = 0;
      const b = block(0.9, 0.19, 0.9, { fill: C.orange, op: 0.95, seed: 500 + stackN });
      b.position.set(-1.2, 0.06 + 0.2 * (stackN + 1) + 1.2, 2.3);
      m.add(b);
      m.to(b, { pos: V(-1.2, 0.06 + 0.2 * (stackN + 1), 2.3), speed: 12 });
      const l = label('7', { size: 0.26 }); l.position.set(-0.55, 0.06 + 0.2 * (stackN + 1) + 0.1, 2.3);
      m.add(l);
      stackN++;
      if (stackN === 9) { building = false; dl.userData.setText(t('9 × 7 = 63 ميلاً','9 × 7 = 63 miles')); info.userData.setText(t('الفرق 62 − 55 = 7 أميال كل ساعة','Difference 62 − 55 = 7 miles every hour')); }
    }
  });
  m.onTap = (id) => {
    if (id === 'destiny' || id === 'santiago') {
      const L = lanes.find((x) => x.id === id);
      m.to(cars[id], { pos: V(1.9, 0.12, L.z), speed: 2.2 });
      if (!done[id]) { done[id] = true; setTimeout(() => hour(L), 500); }
      info.userData.setText(`${L.name}: ${L.total} ÷ 4 = ${L.rate} ${t('ميل لكل ساعة','mi per hour')}`);
      ctx.touch(id);
    } else if (id === 'diff' && !building && stackN === 0) {
      building = true; timer = 0;
      dl.userData.setText(t('كل ساعة 7 أميال أكثر','7 more miles every hour'));
      ctx.touch('diff');
    }
  };
  return m;
}

export const MODELS = { ratios, table, graph, compare, bars, units, rates, drive };
