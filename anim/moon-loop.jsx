/* Infinite-zoom blueprint loop: code → board → silicon → wafer → rocket → transit → moon city → code */
const { useComposition, Easing, interpolate, animate, clamp } = window;

const W = 1920, H = 1080, CX = 960, CY = 540;
const N = 7;              // stages
const K = 5;              // zoom factor per stage

const MOTION = {
  enter: (p) => Easing.easeOutCubic(clamp(p, 0, 1)),
  draw:  (p) => Easing.easeInOutQuad(clamp(p, 0, 1)),
  pop:   (p) => Easing.easeOutBack(clamp(p, 0, 1)),
};

const INK_W = 1.45, INK_O = 1.3;
const seg = (p, start, len) => clamp((p - start) / len, 0, 1);
const rnd = (i) => { const x = Math.sin(i * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };
const wrap = (d) => ((d + N / 2) % N + N) % N - N / 2;

/* ---------- primitives ---------- */
function L({ x1, y1, x2, y2, p = 1, c, w = 2, o = 1, dashed }) {
  return React.createElement('line', {
    x1, y1, x2, y2, stroke: c, strokeWidth: w * INK_W, opacity: Math.min(1, o * INK_O) * (p > 0 ? 1 : 0),
    pathLength: 1, strokeDasharray: dashed ? '0.012 0.012' : 1,
    strokeDashoffset: dashed ? 0 : 1 - MOTION.draw(p),
    vectorEffect: 'non-scaling-stroke', strokeLinecap: 'round',
  });
}
function P({ d, p = 1, c, w = 2, o = 1, fill = 'none', dashed }) {
  return React.createElement('path', {
    d, stroke: c, strokeWidth: w * INK_W, fill, opacity: Math.min(1, o * INK_O) * (p > 0 ? 1 : 0),
    pathLength: 1, strokeDasharray: dashed ? '0.01 0.014' : 1,
    strokeDashoffset: dashed ? 0 : 1 - MOTION.draw(p),
    vectorEffect: 'non-scaling-stroke', strokeLinejoin: 'round', strokeLinecap: 'round',
  });
}
function R({ x, y, w: rw, h: rh, p = 1, c, sw = 2, o = 1, r = 0, fill = 'none' }) {
  const d = r > 0
    ? `M ${x + r} ${y} H ${x + rw - r} A ${r} ${r} 0 0 1 ${x + rw} ${y + r} V ${y + rh - r}` +
      ` A ${r} ${r} 0 0 1 ${x + rw - r} ${y + rh} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + rh - r}` +
      ` V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`
    : `M ${x} ${y} H ${x + rw} V ${y + rh} H ${x} Z`;
  return P({ d, p, c, w: sw, o, fill });
}
function C({ cx, cy, r, p = 1, c, w = 2, o = 1, fill = 'none', dashed }) {
  return React.createElement('circle', {
    cx, cy, r, stroke: c, strokeWidth: w * INK_W, fill, opacity: Math.min(1, o * INK_O) * (p > 0 ? 1 : 0),
    pathLength: 1, strokeDasharray: dashed ? '0.01 0.014' : 1,
    strokeDashoffset: dashed ? 0 : 1 - MOTION.draw(p),
    vectorEffect: 'non-scaling-stroke',
  });
}
/* corner brackets marking the portal the next stage grows out of */
function Portal({ x, y, w: bw, h: bh, p, c, len = 34, o = 0.9 }) {
  const k = [[x, y, 1, 1], [x + bw, y, -1, 1], [x, y + bh, 1, -1], [x + bw, y + bh, -1, -1]];
  return k.map(([px, py, sx, sy], i) => React.createElement('g', { key: i },
    L({ x1: px, y1: py, x2: px + sx * len, y2: py, p: seg(p, i * 0.04, 0.4), c, w: 2.5, o }),
    L({ x1: px, y1: py, x2: px, y2: py + sy * len, p: seg(p, i * 0.04, 0.4), c, w: 2.5, o })));
}

/* ---------- 1. code ---------- */
function StageCode({ p, c, a }) {
  const rows = [];
  for (let i = 0; i < 20; i++) {
    const above = i < 10;
    const y = above ? 130 + i * 30 : 700 + (i - 10) * 30;
    const indent = 300 + Math.floor(rnd(i) * 3) * 46;
    const len = 180 + rnd(i + 40) * 620;
    rows.push(React.createElement('g', { key: i },
      L({ x1: indent, y1: y, x2: indent + len, y2: y, p: seg(p, 0.1 + i * 0.022, 0.3), c, w: 5, o: 0.5 }),
      L({ x1: 232, y1: y, x2: 252, y2: y, p: seg(p, 0.1 + i * 0.022, 0.3), c, w: 2, o: 0.35 })));
  }
  return React.createElement('g', null,
    R({ x: 200, y: 70, w: 1520, h: 940, p: seg(p, 0, 0.45), c, sw: 2.5, o: 0.8 }),
    L({ x1: 276, y1: 70, x2: 276, y2: 1010, p: seg(p, 0.06, 0.4), c, w: 1.5, o: 0.4 }),
    rows,
    // caret
    L({ x1: 1150, y1: 380, x2: 1150, y2: 412, p: 1, c: a, w: 4, o: 0.5 + 0.5 * Math.abs(Math.sin(p * 9)) }),
    Portal({ x: 750, y: 432, w: 420, h: 216, p: seg(p, 0.45, 0.5), c: a }));
}

/* ---------- 2. board ---------- */
function StageBoard({ p, c, a }) {
  const traces = [];
  for (let i = 0; i < 14; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const y = 200 + Math.floor(i / 2) * 100;
    const row = Math.floor(i / 2);
    const bend = 520 + rnd(i) * 120;
    const ex = side < 0 ? 700 : 1220, ey = 424 + row * 42;
    const sx = side < 0 ? 210 : 1710;
    traces.push(React.createElement('g', { key: i },
      P({ d: `M ${sx} ${y} H ${side < 0 ? bend : W - bend} L ${ex - side * 40} ${ey} H ${ex}`,
          p: seg(p, 0.12 + i * 0.03, 0.45), c, w: 2, o: 0.55 })));
  }
  const pads = [];
  for (let i = 0; i < 16; i++) {
    const x = 750 + (i % 8) * 60, y = i < 8 ? 400 : 690;
    pads.push(React.createElement('g', { key: 'p' + i },
      R({ x, y, w: 26, h: 12, p: seg(p, 0.3 + i * 0.02, 0.3), c, sw: 1.6, o: 0.5 })));
  }
  return React.createElement('g', null,
    R({ x: 150, y: 120, w: 1620, h: 840, p: seg(p, 0, 0.4), c, sw: 2.5, o: 0.85, r: 24 }),
    [[220, 190], [1700, 190], [220, 890], [1700, 890]].map(([x, y], i) =>
      C({ key: 'h' + i, cx: x, cy: y, r: 18, p: seg(p, 0.08, 0.3), c, w: 2, o: 0.5 })),
    traces, pads,
    R({ x: 700, y: 400, w: 520, h: 300, p: seg(p, 0.4, 0.4), c, sw: 2.5, o: 0.9 }),
    Portal({ x: 750, y: 432, w: 420, h: 216, p: seg(p, 0.55, 0.45), c: a }));
}

/* ---------- 3. silicon ---------- */
function StageSilicon({ p, c, a }) {
  const blocks = [];
  for (let i = 0; i < 22; i++) {
    const col = i % 6, row = Math.floor(i / 6);
    const x = 210 + col * 262, y = 130 + row * 232;
    if (x > 620 && x < 1300 && y > 330 && y < 760) continue;
    const bw = 120 + rnd(i) * 120, bh = 70 + rnd(i + 9) * 110;
    blocks.push(React.createElement('g', { key: i },
      R({ x, y, w: bw, h: bh, p: seg(p, 0.08 + i * 0.02, 0.35), c, sw: 2, o: 0.55 }),
      L({ x1: x + 8, y1: y + bh - 10, x2: x + bw - 8, y2: y + bh - 10, p: seg(p, 0.2 + i * 0.02, 0.3), c, w: 1.4, o: 0.3 })));
  }
  const bus = [];
  for (let i = 0; i < 6; i++) {
    const y = 300 + i * 96;
    bus.push(React.createElement('g', { key: 'b' + i },
      L({ x1: 660, y1: y, x2: 1260, y2: y, p: seg(p, 0.35 + i * 0.03, 0.4), c, w: 1.4, o: 0.22 })));
  }
  return React.createElement('g', null,
    R({ x: 170, y: 90, w: 1580, h: 900, p: seg(p, 0, 0.35), c, sw: 2.5, o: 0.8 }),
    blocks, bus,
    R({ x: 690, y: 400, w: 540, h: 300, p: seg(p, 0.45, 0.4), c, sw: 2, o: 0.7 }),
    P({ d: 'M 960 380 L 1260 540 L 960 700 L 660 540 Z', p: seg(p, 0.5, 0.45), c: a, w: 2, o: 0.45 }),
    Portal({ x: 750, y: 432, w: 420, h: 216, p: seg(p, 0.6, 0.4), c: a }));
}

/* ---------- 4. fabrication ---------- */
function StageFab({ p, c, a }) {
  const dies = [];
  const cell = 108;
  for (let gx = -4; gx <= 4; gx++) for (let gy = -4; gy <= 4; gy++) {
    const x = CX + gx * cell - cell / 2, y = CY + gy * cell - cell / 2;
    const d = Math.hypot(CX - x - cell / 2, CY - y - cell / 2);
    if (d > 430 || (Math.abs(gx) < 2 && Math.abs(gy) < 1.2)) continue;
    dies.push(React.createElement('g', { key: gx + '_' + gy },
      R({ x, y, w: cell - 10, h: cell - 10, p: seg(p, 0.18 + d / 1400, 0.35), c, sw: 1.6, o: 0.45 })));
  }
  const arms = [0, 1, 2, 3].map((i) => {
    const horiz = i < 2, sgn = i % 2 === 0 ? -1 : 1;
    return React.createElement('g', { key: 'a' + i }, horiz
      ? L({ x1: sgn < 0 ? 60 : 1860, y1: CY, x2: CX + sgn * 300, y2: CY, p: seg(p, 0.5, 0.4), c: a, w: 2, o: 0.4, dashed: true })
      : L({ x1: CX, y1: sgn < 0 ? 30 : 1050, x2: CX, y2: CY + sgn * 190, p: seg(p, 0.5, 0.4), c: a, w: 2, o: 0.4, dashed: true }));
  });
  return React.createElement('g', null,
    C({ cx: CX, cy: CY, r: 470, p: seg(p, 0, 0.4), c, w: 3, o: 0.85 }),
    C({ cx: CX, cy: CY, r: 496, p: seg(p, 0.05, 0.4), c, w: 1.2, o: 0.35 }),
    P({ d: 'M 900 78 L 1020 78', p: seg(p, 0.1, 0.3), c, w: 3, o: 0.7 }),
    dies, arms,
    C({ cx: CX, cy: CY, r: 300, p: seg(p, 0.42, 0.4), c: a, w: 1.4, o: 0.28, dashed: true }),
    R({ x: 690, y: 402, w: 540, h: 296, p: seg(p, 0.5, 0.4), c, sw: 2, o: 0.7 }),
    Portal({ x: 750, y: 432, w: 420, h: 216, p: seg(p, 0.6, 0.4), c: a }));
}

/* ---------- 5. rocket ---------- */
function StageRocket({ p, c, a }) {
  const ribs = [];
  for (let i = 0; i < 7; i++) {
    const y = 150 + i * 44;
    ribs.push(React.createElement('g', { key: i },
      L({ x1: 700, y1: y, x2: 1220, y2: y, p: seg(p, 0.25 + i * 0.03, 0.3), c, w: 1.4, o: 0.28 })));
  }
  const flame = MOTION.pop(seg(p, 0.6, 0.4));
  return React.createElement('g', null,
    // body + nose
    P({ d: 'M 960 40 C 1120 170 1220 330 1220 470 V 830 H 700 V 470 C 700 330 800 170 960 40 Z',
        p: seg(p, 0, 0.5), c, w: 3, o: 0.9 }),
    ribs,
    // fins
    P({ d: 'M 700 700 L 560 900 L 700 900 Z', p: seg(p, 0.3, 0.35), c, w: 2.5, o: 0.7 }),
    P({ d: 'M 1220 700 L 1360 900 L 1220 900 Z', p: seg(p, 0.34, 0.35), c, w: 2.5, o: 0.7 }),
    // engine bell + exhaust
    P({ d: 'M 830 830 L 790 950 H 1130 L 1090 830', p: seg(p, 0.42, 0.35), c, w: 2.5, o: 0.8 }),
    [0, 1, 2, 3, 4].map((i) => React.createElement('g', { key: 'f' + i },
      L({ x1: 830 + i * 65, y1: 960, x2: 830 + i * 65, y2: 960 + flame * (60 + rnd(i + p * 7) * 90),
          p: 1, c: a, w: 3, o: 0.55 * flame }))),
    // gantry ticks
    [0, 1, 2, 3, 4, 5].map((i) => React.createElement('g', { key: 'g' + i },
      L({ x1: 300, y1: 160 + i * 150, x2: 380, y2: 160 + i * 150, p: seg(p, 0.15 + i * 0.03, 0.3), c, w: 1.6, o: 0.3 }),
      L({ x1: 1540, y1: 160 + i * 150, x2: 1620, y2: 160 + i * 150, p: seg(p, 0.15 + i * 0.03, 0.3), c, w: 1.6, o: 0.3 }))),
    // payload bay
    R({ x: 716, y: 412, w: 488, h: 256, p: seg(p, 0.45, 0.4), c, sw: 2.5, o: 0.85 }),
    Portal({ x: 750, y: 432, w: 420, h: 216, p: seg(p, 0.58, 0.4), c: a }));
}

/* ---------- 6. transit ---------- */
function StageTransit({ p, c, a }) {
  const traj = 'M 250 1040 C 430 640 620 420 960 320';
  const tp = MOTION.enter(seg(p, 0.35, 0.6));
  const stars = [];
  for (let i = 0; i < 26; i++) {
    const x = 80 + rnd(i) * 1760, y = 60 + rnd(i + 60) * 900;
    if (Math.hypot(x - CX, y - CY) < 330) continue;
    stars.push(React.createElement('g', { key: i },
      L({ x1: x - 7, y1: y, x2: x + 7, y2: y, p: seg(p, 0.05 + rnd(i) * 0.4, 0.3), c, w: 1.4, o: 0.4 }),
      L({ x1: x, y1: y - 7, x2: x, y2: y + 7, p: seg(p, 0.05 + rnd(i) * 0.4, 0.3), c, w: 1.4, o: 0.4 })));
  }
  return React.createElement('g', null,
    stars,
    P({ d: 'M -120 1180 A 720 720 0 0 1 620 1180 Z', p: seg(p, 0, 0.4), c, w: 2.5, o: 0.55 }),
    P({ d: traj, p: seg(p, 0.15, 0.5), c: a, w: 2, o: 0.5, dashed: true }),
    // craft advancing along the trajectory (approximated with the same bezier)
    React.createElement('g', { transform: `translate(${bez(traj, tp).x} ${bez(traj, tp).y})`, key: 'craft' },
      P({ d: 'M 0 -16 L 11 12 L 0 5 L -11 12 Z', p: seg(p, 0.3, 0.2), c: a, w: 2, o: 0.9 })),
    C({ cx: CX, cy: CY, r: 300, p: seg(p, 0.25, 0.5), c, w: 3, o: 0.9 }),
    [[880, 460, 40], [1080, 610, 26], [960, 700, 18]].map(([x, y, r], i) =>
      C({ key: 'cr' + i, cx: x, cy: y, r, p: seg(p, 0.45 + i * 0.05, 0.3), c, w: 1.6, o: 0.4 })),
    C({ cx: CX, cy: CY, r: 340, p: seg(p, 0.5, 0.4), c: a, w: 1.2, o: 0.25, dashed: true }),
    Portal({ x: 750, y: 432, w: 420, h: 216, p: seg(p, 0.62, 0.38), c: a }));
}
/* cubic bezier point for the single traj path above */
function bez(_d, t) {
  const P0 = [250, 1040], P1 = [430, 640], P2 = [620, 420], P3 = [960, 320];
  const u = 1 - t, b = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return { x: b[0] * P0[0] + b[1] * P1[0] + b[2] * P2[0] + b[3] * P3[0],
           y: b[0] * P0[1] + b[1] * P1[1] + b[2] * P2[1] + b[3] * P3[1] };
}

/* ---------- 7. moon city ---------- */
function StageCity({ p, c, a }) {
  const domes = [[330, 690, 130], [640, 700, 95], [1330, 700, 110], [1620, 690, 80]];
  const plots = [];
  for (let i = 0; i < 12; i++) {
    const x = 220 + (i % 6) * 260, y = i < 6 ? 200 : 830;
    plots.push(React.createElement('g', { key: i },
      R({ x, y, w: 170, h: 90, p: seg(p, 0.25 + i * 0.025, 0.3), c, sw: 1.6, o: 0.4 })));
  }
  return React.createElement('g', null,
    // regolith horizon
    P({ d: 'M 0 800 C 300 760 620 810 960 790 C 1300 770 1620 815 1920 785', p: seg(p, 0, 0.4), c, w: 2.5, o: 0.6 }),
    domes.map(([x, y, r], i) => React.createElement('g', { key: 'd' + i },
      P({ d: `M ${x - r} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y}`, p: seg(p, 0.08 + i * 0.05, 0.4), c, w: 2.5, o: 0.8 }),
      L({ x1: x - r, y1: y, x2: x + r, y2: y, p: seg(p, 0.14 + i * 0.05, 0.3), c, w: 1.6, o: 0.4 }),
      L({ x1: x, y1: y - r, x2: x, y2: y, p: seg(p, 0.18 + i * 0.05, 0.3), c, w: 1.2, o: 0.25 }))),
    // connecting tubes
    L({ x1: 460, y1: 740, x2: 745, y2: 740, p: seg(p, 0.3, 0.35), c, w: 3, o: 0.5 }),
    L({ x1: 1175, y1: 740, x2: 1440, y2: 740, p: seg(p, 0.34, 0.35), c, w: 3, o: 0.5 }),
    // masts with lights
    [[770, 300], [1150, 300]].map(([x, y], i) => React.createElement('g', { key: 'm' + i },
      L({ x1: x, y1: y + 110, x2: x, y2: y, p: seg(p, 0.4 + i * 0.04, 0.3), c, w: 2, o: 0.6 }),
      C({ cx: x, cy: y - 10, r: 9, p: seg(p, 0.5, 0.3), c: a, w: 2, o: 0.4 + 0.5 * Math.abs(Math.sin(p * 6 + i)) }))),
    plots,
    // central plaza — its terraces are the code lines of the next cycle
    R({ x: 700, y: 402, w: 520, h: 276, p: seg(p, 0.42, 0.4), c, sw: 2.5, o: 0.85 }),
    [0, 1, 2, 3, 4].map((i) => React.createElement('g', { key: 't' + i },
      L({ x1: 790 + rnd(i) * 40, y1: 470 + i * 30, x2: 900 + rnd(i + 3) * 210, y2: 470 + i * 30,
          p: seg(p, 0.55 + i * 0.03, 0.3), c, w: 4, o: 0.4 }))),
    Portal({ x: 750, y: 432, w: 420, h: 216, p: seg(p, 0.6, 0.38), c: a }));
}

const STAGES = [StageCode, StageBoard, StageSilicon, StageFab, StageRocket, StageTransit, StageCity];

/* ---------- HUD ---------- */
function Hud({ c, camPos }) {
  const bracket = (x, y, sx, sy, i) => React.createElement('g', { key: i },
    L({ x1: x, y1: y, x2: x + sx * 54, y2: y, c, w: 2, o: 0.3 }),
    L({ x1: x, y1: y, x2: x, y2: y + sy * 54, c, w: 2, o: 0.3 }));
  const ticks = [];
  for (let i = 0; i < 24; i++) {
    const x = 60 + i * 78;
    const long = i % 4 === 0;
    ticks.push(React.createElement('g', { key: 'k' + i },
      L({ x1: x, y1: 1042, x2: x, y2: 1042 - (long ? 18 : 9), c, w: 1.6, o: long ? 0.3 : 0.16 })));
  }
  const sweep = ((camPos % 1) + 1) % 1;
  return React.createElement('g', null,
    bracket(64, 64, 1, 1, 0), bracket(1856, 64, -1, 1, 1),
    bracket(64, 1016, 1, -1, 2), bracket(1856, 1016, -1, -1, 3),
    ticks,
    L({ x1: 60, y1: 1042, x2: 60 + sweep * 1800, y2: 1042, c, w: 3, o: 0.45 }),
    L({ x1: CX - 46, y1: CY, x2: CX - 20, y2: CY, c, w: 1.6, o: 0.28 }),
    L({ x1: CX + 20, y1: CY, x2: CX + 46, y2: CY, c, w: 1.6, o: 0.28 }),
    L({ x1: CX, y1: CY - 46, x2: CX, y2: CY - 20, c, w: 1.6, o: 0.28 }),
    L({ x1: CX, y1: CY + 20, x2: CX, y2: CY + 46, c, w: 1.6, o: 0.28 }));
}

/* ---------- the piece ---------- */
function MoonLoop(props) {
  const { T, authoredTotal } = useComposition();
  const t = props.tweaks || {};
  const line = t.lineColor || '#8FD6EA';
  const accent = t.accentColor || '#F2A45C';
  const zoom = t.zoomDepth || K;
  const stageDur = (authoredTotal || 12) / N;
  const camPos = T / stageDur - 0.45;

  const layers = STAGES.map((S, i) => {
    const d = wrap(camPos - i);
    if (d < -1.75 || d > 1.25) return null;
    const s = Math.pow(zoom, d);
    const o = Math.min(seg(d, -1.7, 0.6), 1 - seg(d, 0.72, 0.5));
    if (o <= 0) return null;
    const p = clamp((d + 0.8) / 0.8, 0, 1);
    return React.createElement('g', {
      key: i, opacity: o,
      transform: `translate(${CX} ${CY}) scale(${s}) translate(${-CX} ${-CY})`,
    }, React.createElement(S, { p, c: line, a: accent }));
  });

  const gridS = Math.pow(zoom, ((camPos % 1) + 1) % 1);
  const grid = [];
  for (let i = -6; i <= 6; i++) {
    grid.push(React.createElement('g', { key: 'gx' + i },
      L({ x1: CX + i * 160, y1: -600, x2: CX + i * 160, y2: 1680, c: line, w: 1.2, o: 0.09 }),
      L({ x1: -600, y1: CY + i * 160, x2: 2520, y2: CY + i * 160, c: line, w: 1.2, o: 0.09 })));
  }

  return React.createElement('svg', {
    width: W, height: H, viewBox: `0 0 ${W} ${H}`,
    style: { display: 'block', background: t.bg || '#08131C' },
  },
    React.createElement('defs', null,
      React.createElement('radialGradient', { id: 'vig', cx: '50%', cy: '50%', r: '62%' },
        React.createElement('stop', { offset: '55%', stopColor: '#000', stopOpacity: 0 }),
        React.createElement('stop', { offset: '100%', stopColor: '#000', stopOpacity: 0.62 }))),
    React.createElement('g', {
      transform: `translate(${CX} ${CY}) scale(${gridS}) rotate(${Math.sin(camPos * Math.PI * 2 / N) * 1.1}) translate(${-CX} ${-CY})`,
      opacity: 0.9,
    }, grid),
    React.createElement('g', {
      transform: `translate(${CX} ${CY}) rotate(${Math.sin(camPos * Math.PI * 2 / N) * 1.6}) translate(${-CX} ${-CY})`,
    }, layers),
    React.createElement('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#vig)' }),
    t.showHud === false ? null : React.createElement(Hud, { c: line, camPos }));
}

window.MoonLoop = MoonLoop;
