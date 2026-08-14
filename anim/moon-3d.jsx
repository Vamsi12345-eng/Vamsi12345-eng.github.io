/* 3D pipeline loop: a camera ring passing seven lit dioramas.
   Renders offscreen and pushes each frame into an <img> so the timeline export
   (which serializes SVG) captures WebGL output. Everything is a function of T. */

const RW = 1600, RH = 900;
const N = 7, RING = 70, CAMR = 34;
const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const ringPos = (a, r) => [Math.sin(a) * r, 0, Math.cos(a) * r];
/* per-station framing: dist = camera distance to the diorama, camY = eye height, tgtY = look-at height */
const SHOT = [
  { dist: 30, camY: 12, tgtY: 10.5 },  // code
  { dist: 34, camY: 13, tgtY: 5 },     // board
  { dist: 30, camY: 13, tgtY: 5 },     // silicon
  { dist: 34, camY: 13, tgtY: 4 },     // fabrication
  { dist: 56, camY: 22, tgtY: 17 },    // rocket
  { dist: 48, camY: 16, tgtY: 12 },    // transit
  { dist: 40, camY: 10, tgtY: 6 },     // settlement
];
const mix = (a, b, w) => a + (b - a) * w;
const TAU = Math.PI * 2;

function buildWorld(THREE) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04070c);
  scene.fog = new THREE.FogExp2(0x04070c, 0.0075);

  const M = {
    steel:   new THREE.MeshStandardMaterial({ color: 0x8b97a3, metalness: 0.9, roughness: 0.35 }),
    dark:    new THREE.MeshStandardMaterial({ color: 0x1a1f26, metalness: 0.4, roughness: 0.6 }),
    board:   new THREE.MeshStandardMaterial({ color: 0x0f3d2e, metalness: 0.2, roughness: 0.7 }),
    gold:    new THREE.MeshStandardMaterial({ color: 0xd9a75b, metalness: 1, roughness: 0.3 }),
    white:   new THREE.MeshStandardMaterial({ color: 0xd8dee6, metalness: 0.1, roughness: 0.5 }),
    regolith:new THREE.MeshStandardMaterial({ color: 0x6b6a66, roughness: 1, metalness: 0 }),
    glassy:  new THREE.MeshStandardMaterial({ color: 0x9fd8e8, transparent: true, opacity: 0.22,
                                              roughness: 0.1, metalness: 0.2, side: THREE.DoubleSide }),
    screen:  new THREE.MeshBasicMaterial({ color: 0x0d2b3a }),
    ink:     new THREE.MeshBasicMaterial({ color: 0x7fe3ff }),
    amber:   new THREE.MeshBasicMaterial({ color: 0xffb066 }),
    hot:     new THREE.MeshBasicMaterial({ color: 0xffd9a0 }),
    earth:   new THREE.MeshStandardMaterial({ color: 0x2b6fb5, roughness: 0.8, emissive: 0x0a2035 }),
    moon:    new THREE.MeshStandardMaterial({ color: 0x9a9892, roughness: 1 }),
  };

  scene.add(new THREE.AmbientLight(0x3d5470, 4.5));
  const key = new THREE.DirectionalLight(0xdfe9ff, 4.5);
  key.position.set(40, 60, 20); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6fa8ff, 2.4);
  rim.position.set(-50, 20, -30); scene.add(rim);

  // starfield
  const sp = [];
  for (let i = 0; i < 1400; i++) {
    const u = Math.random() * TAU, v = Math.acos(2 * Math.random() - 1), r = 420;
    sp.push(r * Math.sin(v) * Math.cos(u), r * Math.cos(v), r * Math.sin(v) * Math.sin(u));
  }
  const stars = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)),
    new THREE.PointsMaterial({ color: 0xbcd4ff, size: 1.6, sizeAttenuation: false }));
  scene.add(stars);

  const box = (w, h, d, mat, x, y, z, ry) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); if (ry) m.rotation.y = ry; return m;
  };
  const cyl = (rt, rb, h, mat, x, y, z, seg) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24), mat);
    m.position.set(x, y, z); return m;
  };

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x14181e, roughness: 0.9, metalness: 0.1 });
  const room = (g, w, d) => {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
    f.rotation.x = -Math.PI / 2; f.position.set(0, -0.02, 0); g.add(f);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(w, 26), floorMat);
    back.position.set(0, 13, -d / 2); g.add(back);
  };

  const anim = {};   // per-frame hooks, keyed by name
  const groups = [];

  /* 1 — CODE: a lit workstation in a dark room */
  {
    const g = new THREE.Group(); room(g, 46, 30);
    g.add(box(22, 0.5, 10, M.dark, 0, 4, 0));                       // desk
    g.add(box(0.6, 4, 0.6, M.steel, 0, 2, 0));
    g.add(box(8, 0.3, 4, M.steel, 0, 0.15, 0));                     // base
    const bezel = box(19, 11, 0.5, M.dark, 0, 10.5, -1.5); g.add(bezel);
    const scr = box(18, 10.2, 0.1, M.screen, 0, 10.5, -1.2); g.add(scr);
    const rows = new THREE.Group(); rows.position.set(0, 10.5, -1.1); g.add(rows);
    for (let i = 0; i < 24; i++) {
      const w = 2 + Math.random() * 11;
      const r = box(w, 0.22, 0.06, M.ink, -8 + w / 2 + (Math.random() < 0.4 ? 1.2 : 0), 4.4 - i * 0.4, 0.05);
      r.material = M.ink; rows.add(r);
    }
    g.add(box(9, 0.35, 3.4, M.dark, 0, 4.4, 3.6));                  // keyboard
    const lamp = new THREE.PointLight(0x7fe3ff, 400, 60); lamp.position.set(0, 10, 3); g.add(lamp);
    const warm = new THREE.PointLight(0xffb066, 220, 50); warm.position.set(9, 9, 5); g.add(warm);
    anim.code = (t) => { rows.position.y = 10.5 + ((t * 0.7) % 0.8); };
    groups.push(g);
  }

  /* 2 — BOARD: populated PCB on a bench */
  {
    const g = new THREE.Group(); room(g, 52, 34);
    g.add(box(26, 0.4, 18, M.board, 0, 3, 0));
    g.add(box(28, 3, 20, M.dark, 0, 1.4, 0));
    for (let i = 0; i < 22; i++) {                                   // traces
      const w = 3 + Math.random() * 9;
      g.add(box(w, 0.06, 0.22, M.gold, -9 + Math.random() * 18, 3.24, -8 + i * 0.75));
    }
    const chip = box(7, 1.2, 7, M.dark, 0, 3.8, 0); g.add(chip);
    for (let i = 0; i < 18; i++) {                                   // chip pins
      const s = i < 9 ? -1 : 1, k = i % 9;
      g.add(box(0.18, 0.12, 1.4, M.gold, -3.6 + k * 0.9, 3.3, s * 4.2));
    }
    [[-9, -6], [8, -5], [-7, 6], [9, 5]].forEach(([x, z]) =>
      g.add(cyl(1.1, 1.1, 2.6, M.steel, x, 4.5, z, 20)));            // capacitors
    for (let i = 0; i < 6; i++) g.add(box(1.6, 0.5, 0.9, M.white, -6 + i * 2.4, 3.45, 7.4));
    const spot = new THREE.SpotLight(0xffffff, 2600, 90, 0.8, 0.4); spot.position.set(4, 22, 8);
    spot.target.position.set(0, 3, 0); g.add(spot, spot.target);
    const glow = new THREE.PointLight(0x66e0a0, 120, 40); glow.position.set(0, 5, -3); g.add(glow);
    groups.push(g);
  }

  /* 3 — SILICON: die macro, metal mesas and vias */
  {
    const g = new THREE.Group(); room(g, 52, 40);
    g.add(box(26, 1, 26, M.steel, 0, 2.5, 0));
    for (let i = 0; i < 40; i++) {
      const w = 1.4 + Math.random() * 4.4, d = 1.4 + Math.random() * 4.4, h = 0.5 + Math.random() * 2.6;
      const x = -10 + Math.random() * 20, z = -10 + Math.random() * 20;
      if (Math.abs(x) < 4 && Math.abs(z) < 4) continue;
      g.add(box(w, h, d, Math.random() < 0.3 ? M.gold : M.dark, x, 3 + h / 2, z));
    }
    for (let i = 0; i < 14; i++) g.add(box(22, 0.14, 0.16, M.gold, 0, 3.1, -10 + i * 1.5));
    const core = box(7, 2.4, 7, M.steel, 0, 4.2, 0); g.add(core);
    const glow = box(6.2, 0.1, 6.2, M.ink, 0, 5.45, 0); g.add(glow);
    const lp = new THREE.PointLight(0x7fe3ff, 600, 70); lp.position.set(0, 9, 0); g.add(lp);
    const sweep = new THREE.PointLight(0xffb066, 420, 60); g.add(sweep);
    anim.silicon = (t) => { sweep.position.set(Math.sin(t * 1.1) * 11, 6, Math.cos(t * 0.9) * 11); };
    groups.push(g);
  }

  /* 4 — FABRICATION: wafer on a stage inside a chamber, robot arm */
  {
    const g = new THREE.Group(); room(g, 52, 40);
    g.add(cyl(11, 11, 1.4, M.dark, 0, 1, 0, 48));
    const wafer = cyl(8.6, 8.6, 0.22, new THREE.MeshStandardMaterial(
      { color: 0xb9c6d2, metalness: 1, roughness: 0.12 }), 0, 1.9, 0, 64);
    g.add(wafer);
    for (let i = 0; i < 12; i++) {                                   // die grid on the wafer
      for (let j = 0; j < 12; j++) {
        const x = -7.7 + i * 1.4, z = -7.7 + j * 1.4;
        if (Math.hypot(x, z) > 8) continue;
        g.add(box(1.15, 0.06, 1.15, M.steel, x, 2.04, z));
      }
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(13, 0.6, 12, 48), M.steel);
    ring.rotation.x = Math.PI / 2; ring.position.y = 12; g.add(ring);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      g.add(cyl(0.4, 0.4, 12, M.steel, Math.sin(a) * 13, 6, Math.cos(a) * 13, 12));
    }
    const arm = new THREE.Group(); arm.position.set(0, 6.5, 0); g.add(arm);
    const upper = box(12, 0.8, 1.4, M.white, 6, 0, 0); arm.add(upper);
    const head = cyl(1.6, 1.6, 0.5, M.steel, 12, -0.6, 0, 20); arm.add(head);
    const beam = new THREE.PointLight(0xffb066, 520, 60); beam.position.set(0, 8, 0); g.add(beam);
    const cool = new THREE.PointLight(0x7fe3ff, 300, 60); cool.position.set(-10, 5, 8); g.add(cool);
    anim.fab = (t) => {
      arm.rotation.y = Math.sin(t * 0.55) * 1.1;
      wafer.rotation.y = t * 0.25;
      beam.position.set(Math.sin(t * 0.55 + 0.2) * 9, 7, Math.cos(t * 0.55 + 0.2) * 9);
    };
    groups.push(g);
  }

  /* 5 — ROCKET: vehicle on the pad, payload going in */
  {
    const g = new THREE.Group();
    g.add(cyl(20, 22, 1, M.dark, 0, 0.5, 0, 36));
    const body = cyl(3.4, 3.6, 26, M.white, 0, 14, 0, 36); g.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(3.4, 8, 36), M.white);
    nose.position.y = 31; g.add(nose);
    g.add(cyl(3.6, 2.4, 3, M.steel, 0, 1.6, 0, 36));                 // skirt
    const bell = cyl(1.4, 2.6, 3.4, M.steel, 0, -0.4, 0, 24); g.add(bell);
    for (let i = 0; i < 3; i++) {                                     // fins
      const a = (i / 3) * TAU;
      const f = box(0.5, 7, 4.4, M.steel, Math.sin(a) * 4.2, 4.5, Math.cos(a) * 4.2, a);
      g.add(f);
    }
    for (let i = 0; i < 5; i++) g.add(box(7.4, 0.18, 0.18, M.steel, 0, 8 + i * 5, 3.7));
    g.add(cyl(3.65, 3.65, 2.2, M.dark, 0, 22, 0, 36));               // livery bands
    g.add(cyl(3.62, 3.62, 1.2, M.dark, 0, 6.5, 0, 36));
    g.add(cyl(3.55, 3.55, 0.6, M.gold, 0, 27.5, 0, 36));
    const tower = new THREE.Group(); tower.position.set(-9.5, 0, 0); g.add(tower);
    for (let i = 0; i < 9; i++) {
      tower.add(box(3.4, 0.3, 0.3, M.steel, 0, 3 + i * 4, 0));
      tower.add(box(0.3, 4, 0.3, M.steel, -1.6, 3 + i * 4, 0));
      tower.add(box(0.3, 4, 0.3, M.steel, 1.6, 3 + i * 4, 0));
    }
    const crate = box(2.4, 2.4, 2.4, M.gold, -5, 20, 0); g.add(crate);
    const pad = new THREE.PointLight(0xffd9a0, 900, 110); pad.position.set(12, 10, 10); g.add(pad);
    const fill = new THREE.PointLight(0x9fd8e8, 500, 110); fill.position.set(-14, 26, -8); g.add(fill);
    anim.rocket = (t) => {
      const k = (Math.sin(t * 0.5) + 1) / 2;
      crate.position.set(-5 + k * 5, 18 + k * 4, 0);
      crate.rotation.y = t * 0.4;
    };
    groups.push(g);
  }

  /* 6 — TRANSIT: the vehicle in flight, Earth behind, Moon ahead */
  {
    const g = new THREE.Group();
    const craft = new THREE.Group(); craft.position.set(4, 8, 18); craft.rotation.z = -0.4; craft.rotation.x = 0.15; craft.scale.setScalar(1.15); g.add(craft);
    craft.add(cyl(1.6, 1.7, 11, M.white, 0, 0, 0, 28));
    const n2 = new THREE.Mesh(new THREE.ConeGeometry(1.7, 3.2, 28), M.white); n2.position.y = 7.1; craft.add(n2);
    craft.add(cyl(1.72, 1.72, 1.1, M.dark, 0, 2.6, 0, 28));           // band
    craft.add(cyl(0.9, 1.5, 1.6, M.steel, 0, -6.2, 0, 20));
    for (let i = 0; i < 3; i++) {                                      // fins
      const a = (i / 3) * TAU;
      craft.add(box(0.3, 3.4, 2.2, M.steel, Math.sin(a) * 1.9, -4.2, Math.cos(a) * 1.9, a));
    }
    const plume = cyl(1.05, 0.15, 4.2, M.hot, 0, -9.2, 0, 18); craft.add(plume);
    const plumeLight = new THREE.PointLight(0xffd9a0, 260, 40); plumeLight.position.set(0, -9, 0); craft.add(plumeLight);
    const earth = new THREE.Mesh(new THREE.SphereGeometry(22, 48, 32), M.earth);
    earth.position.set(-26, -2, -62); g.add(earth);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(11, 36, 24), M.moon);
    moon.position.set(22, 30, -40); g.add(moon);
    const sun = new THREE.PointLight(0xffffff, 9000, 400); sun.position.set(40, 40, 30); g.add(sun);
    const eglow = new THREE.PointLight(0x2b6fb5, 800, 140); eglow.position.set(-20, 0, -20); g.add(eglow);
    anim.transit = (t) => {
      craft.position.y = 8 + Math.sin(t * 0.8) * 0.8;
      plume.scale.y = 0.85 + Math.abs(Math.sin(t * 9)) * 0.3;
      earth.rotation.y = t * 0.05; moon.rotation.y = -t * 0.03;
    };
    groups.push(g);
  }

  /* 7 — SETTLEMENT: domes, corridors, Earth in the sky */
  {
    const g = new THREE.Group();
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(44, 44, 24, 24), M.regolith);
    ground.rotation.x = -Math.PI / 2;
    const pos = ground.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(i * 0.7) * 0.6 + Math.cos(i * 0.31) * 0.5);
    ground.geometry.computeVertexNormals(); g.add(ground);
    const domeAt = (x, z, r) => {
      const d = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 16, 0, TAU, 0, Math.PI / 2), M.glassy);
      d.position.set(x, 0, z); g.add(d);
      const rimM = new THREE.Mesh(new THREE.TorusGeometry(r, 0.25, 8, 32), M.steel);
      rimM.rotation.x = Math.PI / 2; rimM.position.set(x, 0.2, z); g.add(rimM);
      for (let i = 0; i < 7; i++) {
        const a = Math.random() * TAU, rr = Math.random() * (r - 2);
        g.add(box(1.2, 1.6, 1.2, M.white, x + Math.sin(a) * rr, 0.8, z + Math.cos(a) * rr));
      }
      const lp = new THREE.PointLight(0xbfe8ff, 260, r * 6); lp.position.set(x, r * 0.5, z); g.add(lp);
      return d;
    };
    domeAt(-16, -4, 9); domeAt(4, 6, 6.5); domeAt(20, -8, 7.5);
    g.add(cyl(1.2, 1.2, 14, M.white, -6, 1.2, 1, 16).rotateZ(Math.PI / 2));
    g.add(cyl(1.2, 1.2, 12, M.white, 12, 1.2, -1, 16).rotateZ(Math.PI / 2));
    const masts = [];
    for (let i = 0; i < 4; i++) {
      const x = -22 + i * 15, z = 12;
      g.add(cyl(0.25, 0.25, 12, M.steel, x, 6, z, 10));
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), M.amber);
      l.position.set(x, 12.3, z); g.add(l); masts.push(l);
    }
    const earth2 = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 20), M.earth);
    earth2.position.set(-10, 40, -60); g.add(earth2);
    const sun2 = new THREE.DirectionalLight(0xffffff, 2.2); sun2.position.set(30, 30, 20); g.add(sun2);
    anim.city = (t) => {
      masts.forEach((m, i) => { m.scale.setScalar(0.8 + 0.5 * Math.abs(Math.sin(t * 2 + i))); });
      earth2.rotation.y = t * 0.04;
    };
    groups.push(g);
  }

  groups.forEach((g, i) => {
    const a = (i / N) * TAU;
    g.position.set(Math.sin(a) * RING, 0, Math.cos(a) * RING);
    g.lookAt(0, 0, 0);
    scene.add(g);
  });

  return { scene, anim, M };
}

/* cheap film grain tile, generated once and reused every frame */
function makeGrainTile() {
  const c = document.createElement('canvas'); c.width = 180; c.height = 180;
  const ctx = c.getContext('2d');
  const id = ctx.createImageData(180, 180);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 90;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  return c;
}

function MoonScene3D(props) {
  const { T, authoredTotal } = window.useComposition();
  const t = props.tweaks || {};
  const imgRef = React.useRef(null);
  const kit = React.useRef(null);
  const postRef = React.useRef(null);
  const grainRef = React.useRef(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let live = true;
    const tick = () => {
      if (!live) return;
      if (window.THREE) {
        const THREE = window.THREE;
        const canvas = document.createElement('canvas');
        canvas.width = RW; canvas.height = RH;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(1);
        renderer.setSize(RW, RH, false);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        const world = buildWorld(THREE);
        const camera = new THREE.PerspectiveCamera(38, RW / RH, 0.5, 900);
        kit.current = { THREE, renderer, canvas, camera, ...world };
        const post = document.createElement('canvas'); post.width = RW; post.height = RH;
        postRef.current = post;
        grainRef.current = makeGrainTile();
        setReady(true);
      } else requestAnimationFrame(tick);
    };
    tick();
    return () => { live = false; if (kit.current) kit.current.renderer.dispose(); };
  }, []);

  React.useLayoutEffect(() => {
    const k = kit.current;
    if (!k || !imgRef.current) return;
    const total = authoredTotal || 12;
    const u = (T / total) * N;
    const i = Math.floor(u) % N, f = u - Math.floor(u);
    const th = (u / N) * TAU;
    const dwell = t.lead != null ? 1 - t.lead : 0.6;   // share of a beat held on the station
    const w = smoothstep(dwell, 1, f), wc = smoothstep(0.3, 1, f);
    const A = ringPos((i / N) * TAU, RING), B = ringPos((((i + 1) % N) / N) * TAU, RING);
    const s1 = SHOT[i], s2 = SHOT[(i + 1) % N];
    const dist = mix(s1.dist, s2.dist, wc);
    const camR = RING - dist;
    k.renderer.toneMappingExposure = t.exposure != null ? t.exposure : 1.35;
    k.camera.position.set(Math.sin(th) * camR, mix(s1.camY, s2.camY, wc) + Math.sin(th * N) * 1.2, Math.cos(th) * camR);
    k.camera.lookAt(mix(A[0], B[0], w), mix(s1.tgtY, s2.tgtY, wc), mix(A[2], B[2], w));
    Object.keys(k.anim).forEach((key) => k.anim[key](T));
    k.renderer.render(k.scene, k.camera);
    imgRef.current.src = k.canvas.toDataURL('image/jpeg', 0.86);
  }, [T, ready, t.exposure, t.lead, authoredTotal]);

  return React.createElement('div', {
    style: { position: 'absolute', inset: 0, background: '#04070c', overflow: 'hidden' },
  },
    React.createElement('img', {
      ref: imgRef, alt: '',
      style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
    }),
    t.grade === false ? null : React.createElement('div', {
      style: {
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.55) 100%)',
      },
    }));
}

window.MoonScene3D = MoonScene3D;
