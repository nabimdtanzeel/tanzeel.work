import { useEffect } from 'react';

type St = {
  el: HTMLElement;
  x: number; y: number; vx: number; vy: number;
  rx: number; ry: number; rz: number; vrx: number; vry: number; vrz: number;
  sc: number; vsc: number;
  tx: number; ty: number; trx: number; try_: number; trz: number; tsc: number;
  cx: number; cy: number; hw: number; hh: number;
  sx: number; sy: number;
  held: boolean;
};

type Nearby = {
  el: HTMLElement;
  cx: number;
  cy: number;
  hw: number;
  hh: number;
};

const K = 88;         // buoyant leaf spring stiffness
const C = 6.2;        // light air damping for gentle organic flutter
const MAX_TILT = 16;  // 3D tilt degrees
const MAX_TWIST = 10; // Z-axis leaf yaw/twist degrees
const MAX_MOVE = 28;  // px drift
const FOLLOW = 0.48;
const PRESS = 0.96;
const GUST_RADIUS = 180;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function useTouchPhysics(containerId = 'main-scroll-container') {
  useEffect(() => {
    const root = document.getElementById(containerId);
    if (!root) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const active = new Map<HTMLElement, St>();
    let pid: number | null = null;
    let cur: St | null = null;
    let nearby: Nearby[] = [];
    let lastPx = 0;
    let lastPy = 0;
    let raf = 0;
    let last = 0;

    const ensureState = (el: HTMLElement, r?: DOMRect): St => {
      let s = active.get(el);
      if (!s) {
        const rect = r || el.getBoundingClientRect();
        s = {
          el,
          x: 0, y: 0, vx: 0, vy: 0,
          rx: 0, ry: 0, rz: 0, vrx: 0, vry: 0, vrz: 0,
          sc: 1, vsc: 0,
          tx: 0, ty: 0, trx: 0, try_: 0, trz: 0, tsc: 1,
          cx: rect.left + rect.width / 2,
          cy: rect.top + rect.height / 2,
          hw: Math.max(rect.width / 2, 1),
          hh: Math.max(rect.height / 2, 1),
          sx: 0, sy: 0,
          held: false,
        };
        active.set(el, s);
      } else if (r) {
        s.cx = r.left + r.width / 2;
        s.cy = r.top + r.height / 2;
        s.hw = Math.max(r.width / 2, 1);
        s.hh = Math.max(r.height / 2, 1);
      }
      el.style.willChange = 'translate, scale, rotate';
      return s;
    };

    const apply = (s: St) => {
      s.el.style.translate = `${s.x.toFixed(2)}px ${s.y.toFixed(2)}px`;
      s.el.style.scale = s.sc.toFixed(4);
      const ang = Math.hypot(s.rx, s.ry, s.rz);
      s.el.style.rotate =
        ang < 0.02
          ? 'none'
          : `${s.rx.toFixed(3)} ${s.ry.toFixed(3)} ${s.rz.toFixed(3)} ${ang.toFixed(3)}deg`;
    };

    const clear = (s: St) => {
      s.el.style.translate = '';
      s.el.style.scale = '';
      s.el.style.rotate = '';
      s.el.style.willChange = '';
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      active.forEach((s, el) => {
        const step = (
          p: 'x' | 'y' | 'rx' | 'ry' | 'rz' | 'sc',
          v: 'vx' | 'vy' | 'vrx' | 'vry' | 'vrz' | 'vsc',
          t: number
        ) => {
          s[v] += (K * (t - s[p]) - C * s[v]) * dt;
          s[p] += s[v] * dt;
        };
        step('x', 'vx', s.tx);
        step('y', 'vy', s.ty);
        step('rx', 'vrx', s.trx);
        step('ry', 'vry', s.try_);
        step('rz', 'vrz', s.trz);
        step('sc', 'vsc', s.tsc);
        apply(s);

        const settled =
          !s.held &&
          Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.rx) + Math.abs(s.ry) + Math.abs(s.rz) + Math.abs(s.sc - 1) < 0.02 &&
          Math.abs(s.vx) + Math.abs(s.vy) + Math.abs(s.vrx) + Math.abs(s.vry) + Math.abs(s.vrz) + Math.abs(s.vsc) < 0.05;
        if (settled) {
          clear(s);
          active.delete(el);
        }
      });
      raf = active.size ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const aim = (s: St, px: number, py: number, dx = 0, dy = 0) => {
      const nx = clamp((px - s.cx) / s.hw, -1, 1);
      const ny = clamp((py - s.cy) / s.hh, -1, 1);
      s.try_ = nx * MAX_TILT;
      s.trx = -ny * MAX_TILT;
      // Torque-like Z flutter from off-center touch + brush motion
      const torque = nx * (dy * 0.15) - ny * (dx * 0.15) + nx * ny * 0.7;
      s.trz = clamp(torque * MAX_TWIST, -MAX_TWIST, MAX_TWIST);
      s.tx = clamp((px - s.sx) * FOLLOW, -MAX_MOVE, MAX_MOVE);
      s.ty = clamp((py - s.sy) * FOLLOW, -MAX_MOVE, MAX_MOVE);
    };

    const gustNearby = (px: number, py: number, dx: number, dy: number, skipEl: HTMLElement | null) => {
      const speed = Math.hypot(dx, dy);
      if (speed < 0.5 && skipEl) return;
      for (const n of nearby) {
        if (n.el === skipEl) continue;
        const rx = n.cx - px;
        const ry = n.cy - py;
        const dist = Math.hypot(rx, ry);
        if (dist > GUST_RADIUS || dist < 1) continue;
        const falloff = Math.pow(1 - dist / GUST_RADIUS, 1.6);
        const ux = rx / dist;
        const uy = ry / dist;
        const s = ensureState(n.el);
        s.vx += (dx * 4.5 + ux * 110) * falloff;
        s.vy += (dy * 4.5 + uy * 110) * falloff;
        s.vrx += (-uy * 65 - dy * 1.4) * falloff;
        s.vry += (ux * 65 + dx * 1.4) * falloff;
        s.vrz += (ux * dy - uy * dx) * 1.2 * falloff;
        s.vsc -= 0.45 * falloff;
      }
    };

    const releaseCurrent = (giveFlutter = true) => {
      if (!cur) return;
      cur.held = false;
      if (giveFlutter) {
        // Soft natural flutter impulse on release like a leaf drifting back
        cur.vrz += (cur.try_ - cur.trx) * 1.6;
        cur.vsc += 0.35;
      }
      cur.tx = 0;
      cur.ty = 0;
      cur.trx = 0;
      cur.try_ = 0;
      cur.trz = 0;
      cur.tsc = 1;
      cur = null;
    };

    const releaseAll = () => {
      releaseCurrent(true);
      pid = null;
      nearby = [];
      kick();
    };

    const cacheNearby = (sec: HTMLElement | null) => {
      const scope = sec || root;
      nearby = Array.from(scope.querySelectorAll<HTMLElement>('[data-anim]')).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          el,
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          hw: Math.max(r.width / 2, 1),
          hh: Math.max(r.height / 2, 1),
        };
      });
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' || pid !== null) return;
      pid = e.pointerId;
      lastPx = e.clientX;
      lastPy = e.clientY;

      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>('[data-anim]') || null;
      const sec = target?.closest<HTMLElement>('section') || null;
      cacheNearby(sec);

      if (el && root.contains(el)) {
        const r = el.getBoundingClientRect();
        const s = ensureState(el, r);
        s.sx = e.clientX;
        s.sy = e.clientY;
        s.held = true;
        s.tsc = PRESS;
        aim(s, e.clientX, e.clientY);
        cur = s;
      }

      // Gentle radial ripple on nearby leaves on touch-down
      for (const n of nearby) {
        if (n.el === el) continue;
        const rx = n.cx - e.clientX;
        const ry = n.cy - e.clientY;
        const dist = Math.hypot(rx, ry);
        if (dist > GUST_RADIUS || dist < 1) continue;
        const falloff = Math.pow(1 - dist / GUST_RADIUS, 1.8);
        const s = ensureState(n.el);
        s.vx += (rx / dist) * 75 * falloff;
        s.vy += (ry / dist) * 75 * falloff;
        s.vrz += ((rx > 0 ? 1 : -1) * 28) * falloff;
      }

      kick();
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' || e.pointerId !== pid) return;
      const dx = e.clientX - lastPx;
      const dy = e.clientY - lastPy;
      lastPx = e.clientX;
      lastPy = e.clientY;

      // Check if finger brushed over another [data-anim] leaf element
      const hit = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const brushedEl = hit?.closest<HTMLElement>('[data-anim]') || null;

      if (brushedEl && root.contains(brushedEl) && (!cur || brushedEl !== cur.el)) {
        if (cur) releaseCurrent(true);
        const r = brushedEl.getBoundingClientRect();
        const s = ensureState(brushedEl, r);
        s.sx = e.clientX;
        s.sy = e.clientY;
        s.held = true;
        s.tsc = PRESS;
        s.vx += dx * 5;
        s.vy += dy * 5;
        cur = s;
      } else if (cur) {
        aim(cur, e.clientX, e.clientY, dx, dy);
      }

      gustNearby(e.clientX, e.clientY, dx, dy, cur?.el || null);
      kick();
    };

    const up = (e: PointerEvent) => {
      if (e.pointerId === pid) releaseAll();
    };

    root.addEventListener('pointerdown', down, { passive: true });
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerup', up, { passive: true });
    root.addEventListener('pointercancel', up, { passive: true });
    root.addEventListener('contextmenu', releaseAll);

    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener('pointerdown', down);
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerup', up);
      root.removeEventListener('pointercancel', up);
      root.removeEventListener('contextmenu', releaseAll);
      active.forEach(clear);
      active.clear();
    };
  }, []);
}
