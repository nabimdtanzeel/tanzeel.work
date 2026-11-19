export function mountWave(host: HTMLElement) {
  const c = document.createElement('canvas');
  Object.assign(c.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '0',
  });
  host.prepend(c);
  const ctx = c.getContext('2d');
  if (!ctx) return () => {};

  let W = 1,
    H = 1,
    D = 1,
    M = 2,
    ys: Float32Array[] = [];
  const layers = [
    { c: '79,107,255', a: 0.6, f: 1.2, s: 0.6, p: 0 },
    { c: '155,92,255', a: 0.8, f: 1.7, s: -0.45, p: 1.3 },
    { c: '255,79,216', a: 0.7, f: 2.3, s: 0.8, p: 2.6 },
    { c: '0,229,255', a: 0.42, f: 3.1, s: -0.9, p: 4.0 },
  ];
  const resize = () => {
    D = Math.min(devicePixelRatio || 1, 2);
    W = c.clientWidth;
    H = c.clientHeight;
    c.width = W * D;
    c.height = H * D;
    M = Math.floor(W / 4) + 2;
    ys = layers.map(() => new Float32Array(M));
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  const env = (u: number) => Math.pow(Math.sin(Math.PI * u), 1.6);
  const grad = (rgb: string, a: number) => {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(' + rgb + ',0)');
    g.addColorStop(0.18, 'rgba(' + rgb + ',' + a + ')');
    g.addColorStop(0.82, 'rgba(' + rgb + ',' + a + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    return g;
  };
  const P = Array.from({ length: 46 }, () => ({
    u: Math.random(),
    v: Math.random() * 2 - 1,
    s: 0.25 + Math.random() * 0.6,
    ph: Math.random() * 6.28,
    r: 0.6 + Math.random() * 1.3,
  }));

  let tmx = W / 2,
    bx = W / 2,
    bump = 0,
    bumpT = 0,
    lastMove = -1e9,
    boost = 0,
    boostT = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const onMove = (e: PointerEvent) => {
    const r = c.getBoundingClientRect();
    tmx = e.clientX - r.left;
    lastMove = performance.now();
  };
  addEventListener('pointermove', onMove, { passive: true });
  const onOver = (e: PointerEvent) => {
    const target = e.target as Element | null;
    boostT = target && target.closest && target.closest('a,button') ? 1 : 0;
  };
  host.addEventListener('pointerover', onOver);

  let t0 = performance.now();
  let raf = 0,
    visible = true;
  const io = new IntersectionObserver(
    ([e]) => {
      const v = e.isIntersecting;
      if (v && !visible) t0 = performance.now();
      visible = v;
    },
    { threshold: 0 }
  );
  io.observe(host);

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = reduce ? 0 : (now - t0) / 1000;
    const intro = reduce ? 1 : 1 - Math.pow(1 - Math.min((now - t0) / 1800, 1), 3);
    bumpT = !reduce && now - lastMove < 2000 ? 1 : 0;
    bx += (tmx - bx) * 0.08;
    bump += (bumpT - bump) * 0.06;
    boost += (boostT - boost) * 0.08;

    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = intro;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const cy = H * 0.32;
    const breath = 0.85 + 0.15 * Math.sin(t * 1.1);
    const gain = (1 + boost * 0.35) * breath * intro;
    const amp = H * (W < 640 ? 0.08 : 0.11);
    const gauss = (x: number) => Math.exp(-Math.pow((x - bx) / (W * 0.12), 2)) * bump;

    // ambient glow
    ctx.save();
    ctx.translate(W / 2, cy);
    ctx.scale(1, 0.22);
    const ag = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.55);
    ag.addColorStop(0, 'rgba(120,80,255,.16)');
    ag.addColorStop(0.5, 'rgba(255,79,216,.05)');
    ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag;
    ctx.fillRect(-W * 0.6, -W * 0.6, W * 1.2, W * 1.2);
    ctx.restore();

    // baseline hairline
    const hl = ctx.createLinearGradient(0, 0, W, 0);
    hl.addColorStop(0, 'rgba(160,140,255,0)');
    hl.addColorStop(0.5, 'rgba(160,140,255,.22)');
    hl.addColorStop(1, 'rgba(160,140,255,0)');
    ctx.strokeStyle = hl;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(W, cy);
    ctx.stroke();

    // spectrum bars (soft outer + brighter inner, tapered look)
    const N = W < 640 ? 64 : 140;
    ctx.lineWidth = Math.max(1.2, (W / N) * 0.22);
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N,
        x = u * W;
      const lvl = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.31 + t * 1.4) * Math.sin(i * 0.13 - t * 0.9));
      const h = lvl * env(u) * H * 0.11 * gain * (1 + gauss(x) * 1.2);
      const hue = 230 + u * 90;
      ctx.strokeStyle = 'hsla(' + hue + ',100%,65%,.14)';
      ctx.beginPath();
      ctx.moveTo(x, cy - h);
      ctx.lineTo(x, cy + h);
      ctx.stroke();
      ctx.strokeStyle = 'hsla(' + hue + ',100%,78%,.26)';
      ctx.beginPath();
      ctx.moveTo(x, cy - h * 0.45);
      ctx.lineTo(x, cy + h * 0.45);
      ctx.stroke();
    }

    // wave points
    for (let k = 0; k < layers.length; k++) {
      const L = layers[k],
        Y = ys[k];
      for (let j = 0; j < M; j++) {
        const x = Math.min(j * 4, W),
          u = x / W,
          kk = u * Math.PI * 2 * L.f;
        const v =
          Math.sin(kk + t * L.s + L.p) * 0.62 +
          Math.sin(kk * 2.1 - t * L.s * 1.3 + L.p) * 0.22 +
          Math.sin(kk * 3.7 + t * L.s * 0.7) * 0.06;
        Y[j] = cy + v * L.a * amp * (env(u) + gauss(x) * 1.1) * gain;
      }
    }
    const paths = ys.map((Y) => {
      const p = new Path2D();
      for (let j = 0; j < M; j++) {
        const x = Math.min(j * 4, W);
        j ? p.lineTo(x, Y[j]) : p.moveTo(x, Y[j]);
      }
      return p;
    });

    // translucent ribbons between waves
    for (const [a, b, rgb, al] of [
      [1, 2, '200,90,255', 0.16],
      [0, 3, '60,160,255', 0.08],
    ] as [number, number, string, number][]) {
      const rb = new Path2D();
      for (let j = 0; j < M; j++) {
        const x = Math.min(j * 4, W);
        j ? rb.lineTo(x, ys[a][j]) : rb.moveTo(x, ys[a][j]);
      }
      for (let j = M - 1; j >= 0; j--) rb.lineTo(Math.min(j * 4, W), ys[b][j]);
      rb.closePath();
      ctx.fillStyle = grad(rgb, al);
      ctx.fill(rb);
    }

    // neon lines
    const passes = [
      [18, 0.06],
      [9, 0.15],
      [3.6, 0.45],
    ];
    for (let k = 0; k < layers.length; k++) {
      for (const [lw, al] of passes) {
        ctx.strokeStyle = grad(layers[k].c, al);
        ctx.lineWidth = lw;
        ctx.stroke(paths[k]);
      }
      ctx.strokeStyle = grad('255,255,255', 0.8);
      ctx.lineWidth = 1;
      ctx.stroke(paths[k]);
    }

    // travelling light pulses
    for (let k = 0; k < layers.length; k++) {
      const pos = (((t * 0.07 * (k % 2 ? -1 : 1) * (1 + k * 0.2)) % 1) + 1) % 1;
      const j = Math.round(pos * (M - 1)),
        x = Math.min(j * 4, W),
        y = ys[k][j],
        e = env(pos);
      ctx.fillStyle = 'rgba(' + layers[k].c + ',' + 0.18 * e + ')';
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,' + 0.9 * e + ')';
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, 6.2832);
      ctx.fill();
    }

    // floating sparkles
    for (const p of P) {
      const x = p.u * W,
        y = cy + (p.v * 0.55 + Math.sin(t * p.s + p.ph) * 0.12) * H * 0.16;
      const a = (0.25 + 0.75 * Math.abs(Math.sin(t * p.s * 1.7 + p.ph))) * env(p.u) * 0.7;
      ctx.fillStyle = 'rgba(215,195,255,' + a + ')';
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, 6.2832);
      ctx.fill();
    }

    // mirror reflection below the wave
    const piv = cy + H * 0.13,
      rh = H * 0.15;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, piv, W, rh);
    ctx.clip();
    ctx.setTransform(D, 0, 0, -D, 0, 2 * piv * D);
    ctx.globalAlpha = intro * 0.35;
    for (let k = 0; k < layers.length; k++) {
      ctx.strokeStyle = grad(layers[k].c, 0.35);
      ctx.lineWidth = 6;
      ctx.stroke(paths[k]);
      ctx.strokeStyle = grad('255,255,255', 0.5);
      ctx.lineWidth = 1;
      ctx.stroke(paths[k]);
    }
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-out';
    const fg = ctx.createLinearGradient(0, piv, 0, piv + rh);
    fg.addColorStop(0, 'rgba(0,0,0,0)');
    fg.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, piv, W, rh);
    ctx.restore();

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    removeEventListener('pointermove', onMove);
    host.removeEventListener('pointerover', onOver);
    c.remove();
  };
}
