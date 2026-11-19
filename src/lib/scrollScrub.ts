import { useEffect } from 'react';

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 1.8);
const easeIn = (x: number) => Math.pow(x, 1.4);

function measureInSection(el: HTMLElement, sec: HTMLElement) {
  let top = 0;
  let cur: HTMLElement | null = el;
  while (cur && cur !== sec) {
    top += cur.offsetTop;
    cur = cur.offsetParent as HTMLElement | null;
  }
  const secH = sec.offsetHeight || sec.getBoundingClientRect().height || 1;
  if (cur === sec) {
    const h = el.offsetHeight || el.getBoundingClientRect().height;
    return {
      topFrac: clamp(top / secH),
      bottomFrac: clamp((top + h) / secH),
    };
  }
  const secRect = sec.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return {
    topFrac: clamp((elRect.top - secRect.top) / (secRect.height || 1)),
    bottomFrac: clamp((elRect.bottom - secRect.top) / (secRect.height || 1)),
  };
}

export function useScrollScrub(containerId = 'main-scroll-container', deps: unknown[] = []) {
  useEffect(() => {
    const root = document.getElementById(containerId);
    if (!root) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const secs = Array.from(root.querySelectorAll<HTMLElement>('section')).map(sec => ({
      sec,
      items: Array.from(sec.querySelectorAll<HTMLElement>('[data-anim]')).map(el => {
        const iVal = Number(el.style.getPropertyValue('--i')) || 0;
        const pos = measureInSection(el, sec);
        return {
          el,
          iVal,
          topFrac: pos.topFrac,
          bottomFrac: pos.bottomFrac,
          last: ''
        };
      })
    }));

    const remeasure = () => {
      for (const s of secs) {
        for (const it of s.items) {
          const pos = measureInSection(it.el, s.sec);
          it.topFrac = pos.topFrac;
          it.bottomFrac = pos.bottomFrac;
          it.last = '';
        }
      }
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      const rootTop = root.getBoundingClientRect().top;
      for (const s of secs) {
        const r = s.sec.getBoundingClientRect();
        const rawP = -(r.top - rootTop) / (r.height || 1); // p<0: page below view, 0: aligned, >0: page above view
        const p = Math.abs(rawP) < 0.002 ? 0 : rawP;

        for (const it of s.items) {
          const stagger = Math.min(it.iVal, 8) * 0.045;

          let i = 0;
          if (p < 0) {
            const enterStart = Math.min(-0.28, it.topFrac - 1.04);
            const enterSpan = Math.max(0.24, -enterStart - 0.015);
            const eRaw = clamp((p - enterStart) / enterSpan);
            const eStag = clamp((eRaw - stagger * 0.6) / (1 - stagger * 0.6));
            i = 1 - easeOut(eStag);
          }

          let o = 0;
          if (p > 0) {
            const exitStart = 0.015;
            const exitEnd = Math.max(0.18, it.bottomFrac * 0.90);
            const xRaw = clamp((p - exitStart) / (exitEnd - exitStart));
            const xStag = clamp((xRaw - stagger * 0.4) / (1 - stagger * 0.4));
            o = easeIn(xStag);
          }

          const key = i.toFixed(3) + '|' + o.toFixed(3);
          if (key === it.last) continue;
          it.last = key;
          it.el.style.setProperty('--in', i.toFixed(3));
          it.el.style.setProperty('--out', o.toFixed(3));
          if (i === 0 && o === 0) it.el.setAttribute('data-rest', '');
          else it.el.removeAttribute('data-rest');
        }
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const onResize = () => { remeasure(); onScroll(); };
    root.addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize);
    update();
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener('scroll', onScroll);
      removeEventListener('resize', onResize);
    };
  }, deps);
}
