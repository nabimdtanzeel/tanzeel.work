import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PortfolioArtworkItem } from './ArtworkDetailOverlay';

interface CurvedGraphicsStageProps {
  artworks: PortfolioArtworkItem[];
  viewMode: 'strip' | 'grid';
  isDetailOpen: boolean;
  onSelectArtwork: (artwork: PortfolioArtworkItem) => void;
}

const VERTEX_SHADER = `
  uniform vec2 uCardCenter;
  uniform vec2 uCardSize;
  uniform float uMorph;
  uniform float uHover;
  uniform float uStep;
  uniform float uCurveSpan;
  uniform float uLiftAmp;
  uniform float uHeightAtCenter;
  uniform float uAspectRatio;

  varying vec2 vUv;
  varying vec2 vCardDims;

  void main() {
    vUv = uv;
    float hoverScale = 1.0 + uHover * 0.015;
    float stripWeight = 1.0 - uMorph;

    float localX = position.x * uCardSize.x * hoverScale;
    float worldX = uCardCenter.x + localX;

    // Smooth height falloff: ~44% at center, ~38% at 1 step, ~33% at edges
    float d = abs(worldX) / max(uStep, 1.0);
    float hFactor = (0.318 + 0.122 * exp(-0.68 * d * d)) / 0.44;
    float finalHScale = mix(hFactor, 1.0, uMorph);

    float localY = position.y * uCardSize.y * hoverScale * finalHScale;

    // Gentle upward smile lift towards edges
    float normX = worldX / max(uCurveSpan, 1.0);
    float smileLift = uLiftAmp * normX * normX * stripWeight;

    // Subtle 3D curve recession at edges and lift on hover
    float z = -14.0 * normX * normX * stripWeight + uHover * 14.0;

    vCardDims = vec2(uCardSize.x * hoverScale, uCardSize.y * hoverScale * finalHScale);

    vec3 finalPos = vec3(worldX, uCardCenter.y + localY + smileLift, z);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform sampler2D uMap;
  uniform float uImageLoaded;
  uniform float uImageAspect;
  uniform float uCardAspect;
  uniform float uReveal;
  uniform float uSeed;
  uniform float uHover;
  uniform float uEdgeAlpha;
  uniform float uTime;

  varying vec2 vUv;
  varying vec2 vCardDims;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  vec2 getCoverUv(vec2 uv, float boxAspect, float texAspect) {
    vec2 s = vec2(1.0);
    if (texAspect > boxAspect) {
      s.x = boxAspect / texAspect;
    } else {
      s.y = texAspect / boxAspect;
    }
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    float aspect = max(vCardDims.x / max(vCardDims.y, 1.0), 0.1);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
    vec2 halfSize = vec2(aspect * 0.5, 0.5);

    // Rounded corners: ~5% of card width
    float radius = 0.05 * aspect;
    vec2 q = abs(p) - (halfSize - radius);
    float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;

    float aa = max(fwidth(dist), 0.0025);
    float shapeAlpha = 1.0 - smoothstep(-aa, aa, dist);
    if (shapeAlpha < 0.01) discard;

    // Flat dark placeholder until texture loads
    vec3 darkPlaceholder = vec3(0.068, 0.068, 0.078);

    // Subtle crisp glass hairline border on the card edge
    float borderMask = smoothstep(-0.012, -0.002, dist) * (1.0 - smoothstep(-0.002, 0.004, dist));

    vec3 finalColor = darkPlaceholder;

    if (uImageLoaded > 0.5) {
      vec2 coverUv = getCoverUv(vUv, aspect, max(uImageAspect, 0.1));
      vec4 crispTex = texture2D(uMap, clamp(coverUv, 0.001, 0.999));

      // 5x7 glitchy block grid reveal
      vec2 grid = vec2(5.0, 7.0);
      vec2 cell = floor(vUv * grid);
      vec2 cellFract = fract(vUv * grid);

      float rnd = hash(cell + vec2(uSeed * 13.7, uSeed * 7.3)) * 0.80;
      float blockT = clamp((uReveal - rnd) / 0.20, 0.0, 1.0);

      // Pixelated version of image for blocks that are about to open
      vec2 pixelUv = (floor(vUv * vec2(20.0, 28.0)) + 0.5) / vec2(20.0, 28.0);
      float jitter = (hash(cell + floor(uTime * 18.0)) - 0.5) * 0.025 * (1.0 - blockT);
      vec2 pixelCoverUv = getCoverUv(pixelUv + vec2(jitter, 0.0), aspect, max(uImageAspect, 0.1));
      vec3 pixelCol = texture2D(uMap, clamp(pixelCoverUv, 0.001, 0.999)).rgb;

      // Subtle hairline inside closed/opening blocks so the 5x7 grid reads cleanly
      float gridEdge = step(cellFract.x, 0.03) + step(cellFract.y, 0.03);
      vec3 closedCol = darkPlaceholder + vec3(0.018) * min(gridEdge, 1.0);

      // Phase 1 (0 -> 0.42): dark block opens into pixelated preview
      // Phase 2 (0.42 -> 1.0): pixelated block clears to crisp image
      float toPixel = smoothstep(0.02, 0.35, blockT);
      float toCrisp = smoothstep(0.58, 0.96, blockT);

      vec3 revealCol = mix(closedCol, pixelCol * 1.12, toPixel);
      finalColor = mix(revealCol, crispTex.rgb, toCrisp);
    }

    // Hover brightening (~12% lift)
    finalColor *= (1.0 + uHover * 0.12);
    finalColor = mix(finalColor, vec3(0.32 + uHover * 0.25), borderMask * 0.45);

    gl_FragColor = vec4(finalColor, shapeAlpha * uEdgeAlpha);
  }
`;

const SCRAMBLE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';

function createScrambleCode(target: string, progress: number, tickSeed: number): string {
  const len = target.length;
  let out = '';
  for (let i = 0; i < len; i++) {
    const ch = target[i];
    if (ch === ' ' || ch === '/' || ch === '-') {
      out += ch;
      continue;
    }
    const charThreshold = (i + 0.5) / len;
    if (progress >= charThreshold) {
      out += ch;
    } else {
      const idx = Math.floor(
        Math.abs(Math.sin((i + 1) * 19.37 + tickSeed * 7.13) * 43758.5453) %
          SCRAMBLE_CHARS.length
      );
      out += SCRAMBLE_CHARS[idx];
    }
  }
  return out;
}

export default function CurvedGraphicsStage({
  artworks,
  viewMode,
  isDetailOpen,
  onSelectArtwork,
}: CurvedGraphicsStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleCodeRef = useRef<HTMLSpanElement>(null);
  const titleTextRef = useRef<HTMLHeadingElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const progressTickRef = useRef<HTMLDivElement>(null);
  const hudBottomRef = useRef<HTMLDivElement>(null);

  const viewModeRef = useRef(viewMode);
  const isDetailOpenRef = useRef(isDetailOpen);
  const artworksRef = useRef(artworks);
  const onSelectRef = useRef(onSelectArtwork);

  viewModeRef.current = viewMode;
  isDetailOpenRef.current = isDetailOpen;
  artworksRef.current = artworks;
  onSelectRef.current = onSelectArtwork;

  // Trigger replay hook when switching strip <-> grid
  const triggerGridMorphRevealRef = useRef<((toGrid: boolean) => void) | null>(null);

  useEffect(() => {
    triggerGridMorphRevealRef.current?.(viewMode === 'grid');
  }, [viewMode]);

  useEffect(() => {
    const host = hostRef.current;
    const mount = canvasMountRef.current;
    if (!host || !mount) return;

    const N = artworksRef.current.length;
    if (N === 0) return;

    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param) || '');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    camera.position.set(0, 0, 500);

    // 1x1 unit plane subdivided cleanly for smooth smile-curve vertex deformation
    const geometry = new THREE.PlaneGeometry(1, 1, 18, 24);
    const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);

    // 1x1 dark placeholder texture
    const placeholderData = new Uint8Array([17, 17, 20, 255]);
    const placeholderTex = new THREE.DataTexture(placeholderData, 1, 1);
    placeholderTex.colorSpace = THREE.SRGBColorSpace;
    placeholderTex.needsUpdate = true;

    interface CardState {
      mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
      material: THREE.ShaderMaterial;
      loadedUrl: string | null;
      texture: THREE.Texture | null;
      imageAspect: number;
      isLoaded: boolean;
      revealProgress: number;
      revealDelayMs: number;
      revealActive: boolean;
      revealStartedAt: number;
      wasVisible: boolean;
      hover: number;
      targetHover: number;
      currentX: number;
      currentY: number;
      currentW: number;
      currentH: number;
      seed: number;
    }

    const cards: CardState[] = [];
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    for (let i = 0; i < N; i++) {
      const seed = (i + 1) * 1.37;
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: placeholderTex },
          uImageLoaded: { value: 0 },
          uImageAspect: { value: 0.68 },
          uCardAspect: { value: 0.68 },
          uReveal: { value: 0 },
          uSeed: { value: seed },
          uHover: { value: 0 },
          uEdgeAlpha: { value: 1 },
          uTime: { value: 0 },
          uCardCenter: { value: new THREE.Vector2(0, 0) },
          uCardSize: { value: new THREE.Vector2(200, 300) },
          uMorph: { value: 0 },
          uStep: { value: 220 },
          uCurveSpan: { value: 600 },
          uLiftAmp: { value: 60 },
          uHeightAtCenter: { value: 300 },
          uAspectRatio: { value: 0.68 },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      scene.add(mesh);

      cards.push({
        mesh,
        material,
        loadedUrl: null,
        texture: null,
        imageAspect: 0.68,
        isLoaded: false,
        revealProgress: 0,
        revealDelayMs: 0,
        revealActive: false,
        revealStartedAt: 0,
        wasVisible: false,
        hover: 0,
        targetHover: 0,
        currentX: 0,
        currentY: 0,
        currentW: 200,
        currentH: 300,
        seed,
      });
    }

    const triggerReveal = (cardIdx: number, delayMs: number) => {
      const c = cards[cardIdx];
      if (!c) return;
      c.revealProgress = 0;
      c.revealDelayMs = Math.max(0, delayMs);
      c.revealActive = true;
      c.revealStartedAt = performance.now();
      c.material.uniforms.uReveal.value = 0;
    };

    const loadCardTextures = () => {
      const list = artworksRef.current;
      list.forEach((item, idx) => {
        const c = cards[idx];
        if (!c) return;
        const url = item.imageUrl;
        if (url === c.loadedUrl) return;
        c.loadedUrl = url;

        if (!url) {
          c.isLoaded = false;
          c.material.uniforms.uImageLoaded.value = 0;
          c.material.uniforms.uMap.value = placeholderTex;
          return;
        }

        c.isLoaded = false;
        c.material.uniforms.uImageLoaded.value = 0;

        textureLoader.load(
          url,
          (tex) => {
            if (c.loadedUrl !== url) {
              tex.dispose();
              return;
            }
            if (c.texture) c.texture.dispose();
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = maxAnisotropy;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            c.texture = tex;

            const img = tex.image as HTMLImageElement | undefined;
            const imgAspect =
              img && img.width && img.height ? img.width / img.height : 0.68;
            c.imageAspect = imgAspect;
            c.isLoaded = true;
            c.material.uniforms.uMap.value = tex;
            c.material.uniforms.uImageAspect.value = imgAspect;
            c.material.uniforms.uImageLoaded.value = 1;

            if (!c.revealActive && c.revealProgress === 0) {
              const distIdx = Math.abs(c.currentX) / Math.max(1, c.currentW);
              triggerReveal(idx, distIdx * 70 + Math.random() * 60);
            }
          },
          undefined,
          () => {
            if (c.loadedUrl === url) {
              c.isLoaded = false;
              c.material.uniforms.uImageLoaded.value = 0;
              c.material.uniforms.uMap.value = placeholderTex;
            }
          }
        );
      });
    };

    loadCardTextures();

    // Layout dimensions
    let W = host.clientWidth || window.innerWidth;
    let H = host.clientHeight || window.innerHeight;

    const updateSize = () => {
      W = host.clientWidth || window.innerWidth;
      H = host.clientHeight || window.innerHeight;
      camera.left = -W / 2;
      camera.right = W / 2;
      camera.top = H / 2;
      camera.bottom = -H / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H, false);
    };
    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(host);

    // Strip scroll physics state (unbounded px, center starts on card index 2 so middle artwork sits centered)
    let scrollPos = 0;
    let vel = 0;
    let targetVel = 0;
    let morphProgress = viewModeRef.current === 'grid' ? 1 : 0;
    let initialScrollCentered = false;

    // Track last center index & scramble timing
    let lastCenterIdx = -1;
    let lastIndexChangeAt = performance.now();
    let lastScrambleSwapAt = 0;
    let scrambleTickSeed = 1;
    let smoothTickFrac = 0;
    let hoveredCardIdx = -1;
    let hasPlayedInitialReveal = false;
    let isSectionVisible = false;

    // Pointer & vertical scroll coexistence tracking
    const scrollContainer = document.getElementById('main-scroll-container');
    let lastPageScrollAt = -9999;
    const onMainScroll = () => {
      lastPageScrollAt = performance.now();
    };
    scrollContainer?.addEventListener('scroll', onMainScroll, { passive: true });

    const getStripMetrics = () => {
      const isMobile = W < 640;
      const isTablet = W >= 640 && W < 1024;
      const centerH = H * 0.44;
      const cardW = isMobile
        ? Math.min(W * 0.44, centerH * 0.64)
        : isTablet
        ? Math.max(W * 0.22, Math.min(W * 0.27, centerH * 0.66))
        : Math.max(W * 0.16, Math.min(W * 0.21, centerH * 0.66));
      const gap = isMobile ? 10 : isTablet ? 12 : 14;
      const step = cardW + gap;
      const curveSpan = isMobile ? W * 0.46 : isTablet ? W * 0.55 : W * 0.56;
      const liftAmp = isMobile ? H * 0.105 : isTablet ? H * 0.088 : H * 0.08;
      // Vertical center in Three.js coordinates (+Y up) leaving clean room for header/h1 above and title/progress/footer below
      const stripCenterY = H * (isMobile ? 0.035 : 0.03);
      return { isMobile, centerH, cardW, gap, step, curveSpan, liftAmp, stripCenterY };
    };

    const getGridMetrics = () => {
      const topSafe = Math.max(108, H * 0.185);
      const bottomSafe = H - Math.max(54, H * 0.095);
      const availH = Math.max(160, bottomSafe - topSafe);
      const availW = Math.min(W * 0.9, 1120);
      const cols = 5;
      const rows = 2;
      const colGap = Math.max(8, Math.min(20, W * 0.015));
      const rowGap = Math.max(22, Math.min(34, H * 0.034));
      const maxCellW = (availW - colGap * (cols - 1)) / cols;
      const maxCellH = (availH - rowGap - 18) / rows;
      const cardH = Math.max(60, Math.min(maxCellH, maxCellW / 0.68));
      const cardW = cardH * 0.68;
      const gridCenterY = H * 0.5 - (topSafe + bottomSafe) * 0.5 - 4;
      return { cols, rows, colGap, rowGap, cardW, cardH, gridCenterY };
    };

    // Trigger center-outward initial reveal when section first enters view
    const triggerCenterOutwardReveal = () => {
      const { step } = getStripMetrics();
      const totalStripWidth = N * step;
      for (let i = 0; i < N; i++) {
        const rawX = i * step - scrollPos;
        const wrappedX =
          ((((rawX % totalStripWidth) + totalStripWidth) + totalStripWidth * 0.5) %
            totalStripWidth) -
          totalStripWidth * 0.5;
        const distFromCenter = Math.abs(wrappedX) / Math.max(step, 1);
        triggerReveal(i, distFromCenter * 110 + Math.random() * 45);
      }
    };

    triggerGridMorphRevealRef.current = (toGrid: boolean) => {
      for (let i = 0; i < N; i++) {
        const delay = toGrid ? i * 42 + Math.random() * 45 : Math.abs(i - N * 0.5) * 45 + Math.random() * 45;
        triggerReveal(i, delay);
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isSectionVisible = entry.isIntersecting;
        if (isSectionVisible && !hasPlayedInitialReveal) {
          hasPlayedInitialReveal = true;
          triggerCenterOutwardReveal();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(host);

    // Check if pointer is vertically within the strip band
    const isPointerOverStripBand = (clientY: number) => {
      const rect = host.getBoundingClientRect();
      const relY = (clientY - rect.top) / Math.max(1, rect.height);
      return relY >= 0.19 && relY <= 0.72;
    };

    // Exact curved-strip & grid hit test matching the vertex shader silhouette
    const hitTestCard = (clientX: number, clientY: number): number => {
      const rect = host.getBoundingClientRect();
      const wx = clientX - rect.left - W * 0.5;
      const wy = H * 0.5 - (clientY - rect.top);
      const strip = getStripMetrics();
      const stripWeight = 1 - morphProgress;

      let bestIdx = -1;
      let bestOrder = -Infinity;

      for (let i = 0; i < N; i++) {
        const c = cards[i];
        const hoverScale = 1 + c.hover * 0.015;
        const halfW = c.currentW * 0.5 * hoverScale;
        if (Math.abs(wx - c.currentX) > halfW) continue;

        const d = Math.abs(wx) / Math.max(strip.step, 1);
        const hFactor = (0.318 + 0.122 * Math.exp(-0.68 * d * d)) / 0.44;
        const finalHScale = THREE.MathUtils.lerp(hFactor, 1, morphProgress);
        const normX = wx / Math.max(strip.curveSpan, 1);
        const smileLift = strip.liftAmp * normX * normX * stripWeight;

        const centerYAtX = c.currentY + smileLift;
        const halfHAtX = c.currentH * 0.5 * hoverScale * finalHScale;

        if (Math.abs(wy - centerYAtX) <= halfHAtX) {
          if (c.mesh.renderOrder >= bestOrder) {
            bestOrder = c.mesh.renderOrder;
            bestIdx = i;
          }
        }
      }
      return bestIdx;
    };

    // Pointer / Drag / Hover handlers
    const dragState = {
      active: false,
      pointerId: -1,
      pointerType: 'mouse',
      startX: 0,
      startY: 0,
      lastX: 0,
      lastTime: 0,
      dragAxis: 'pending' as 'pending' | 'x' | 'y',
      totalDist: 0,
      dragVel: 0,
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDetailOpenRef.current) return;

      if (dragState.active && e.pointerId === dragState.pointerId) {
        const dx = e.clientX - dragState.lastX;
        const totalDx = e.clientX - dragState.startX;
        const totalDy = e.clientY - dragState.startY;
        dragState.totalDist = Math.hypot(totalDx, totalDy);

        if (viewModeRef.current === 'strip') {
          if (dragState.pointerType === 'touch' && dragState.dragAxis === 'pending') {
            if (dragState.totalDist > 8) {
              dragState.dragAxis = Math.abs(totalDx) >= Math.abs(totalDy) ? 'x' : 'y';
            }
          } else if (dragState.pointerType !== 'touch') {
            dragState.dragAxis = 'x';
          }

          if (dragState.dragAxis === 'x') {
            const now = performance.now();
            const dtSec = Math.max(0.008, (now - dragState.lastTime) / 1000);
            scrollPos -= dx;
            const instVel = -dx / dtSec;
            dragState.dragVel = dragState.dragVel * 0.4 + instVel * 0.6;
            vel = dragState.dragVel;
            targetVel = dragState.dragVel;
            dragState.lastTime = now;
          }
        }
        dragState.lastX = e.clientX;
        return;
      }

      // Hover raycast
      if (e.pointerType === 'mouse') {
        const hitIdx = hitTestCard(e.clientX, e.clientY);
        hoveredCardIdx = hitIdx;
        host.style.cursor = hitIdx !== -1 ? 'pointer' : '';
        host.setAttribute('data-cursor', hitIdx !== -1 ? 'pointer' : 'default');
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (isDetailOpenRef.current) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      // Ignore clicks on header/footer interactive controls
      const target = e.target as HTMLElement | null;
      if (target && target.closest('button, a')) return;

      // Only initiate drag/click when hitting a card or inside the strip band
      const hitIdx = hitTestCard(e.clientX, e.clientY);
      const inBand = isPointerOverStripBand(e.clientY);
      if (hitIdx === -1 && (!inBand || viewModeRef.current !== 'strip')) return;

      dragState.active = true;
      dragState.pointerId = e.pointerId;
      dragState.pointerType = e.pointerType;
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      dragState.lastX = e.clientX;
      dragState.lastTime = performance.now();
      dragState.dragAxis = e.pointerType === 'touch' ? 'pending' : 'x';
      dragState.totalDist = 0;
      dragState.dragVel = 0;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragState.active || e.pointerId !== dragState.pointerId) return;
      const wasClick = dragState.totalDist < 6;
      const axis = dragState.dragAxis;
      const releaseVel = dragState.dragVel;
      dragState.active = false;
      dragState.pointerId = -1;

      if (wasClick && !isDetailOpenRef.current) {
        const hitIdx = hitTestCard(e.clientX, e.clientY);
        if (hitIdx !== -1) {
          const item = artworksRef.current[hitIdx];
          if (item) onSelectRef.current(item);
        }
      } else if (axis === 'x' && viewModeRef.current === 'strip') {
        targetVel = THREE.MathUtils.clamp(releaseVel, -2400, 2400);
      }
    };

    const onPointerLeave = () => {
      hoveredCardIdx = -1;
      host.style.cursor = '';
      host.setAttribute('data-cursor', 'default');
      if (dragState.active && dragState.pointerType === 'mouse') {
        dragState.active = false;
      }
    };

    // Scroll-driven wheel handler: ONLY responds when pointer is over the strip (and not mid vertical page scroll)
    const onWheel = (e: WheelEvent) => {
      if (isDetailOpenRef.current || viewModeRef.current !== 'strip') return;

      const isHorizontalIntent = Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey;
      const inBand = isPointerOverStripBand(e.clientY);
      const recentlyScrolledPage = performance.now() - lastPageScrollAt < 260;

      if (!inBand && !isHorizontalIntent) return;
      if (!isHorizontalIntent && recentlyScrolledPage) return;

      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY)
          ? e.deltaX
          : e.shiftKey
          ? e.deltaY
          : e.deltaY;

      if (Math.abs(delta) < 0.1) return;

      e.preventDefault();
      e.stopPropagation();

      const scale = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? 220 : 1;
      targetVel = THREE.MathUtils.clamp(targetVel + delta * scale * 5.2, -2600, 2600);
    };

    // Left / Right arrow keys when section is visible
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isSectionVisible || isDetailOpenRef.current || viewModeRef.current !== 'strip') return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const { step } = getStripMetrics();
        targetVel = THREE.MathUtils.clamp(targetVel + step * 3.8, -2200, 2200);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const { step } = getStripMetrics();
        targetVel = THREE.MathUtils.clamp(targetVel - step * 3.8, -2200, 2200);
      }
    };

    host.addEventListener('pointermove', onPointerMove, { passive: true });
    host.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    host.addEventListener('pointerleave', onPointerLeave);
    host.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    // Pre-allocated animation state
    let rafId = 0;
    let lastNow = performance.now();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderFrame = (now: number) => {
      const dt = Math.min((now - lastNow) / 1000, 0.05);
      lastNow = now;

      // Sync any newly updated artwork URLs cleanly
      loadCardTextures();

      const strip = getStripMetrics();
      const grid = getGridMetrics();
      const totalStripWidth = N * strip.step;

      // Initialize strip centered on artwork index 2 (3rd artwork) on mount
      if (!initialScrollCentered) {
        scrollPos = 2 * strip.step;
        smoothTickFrac = 2 / Math.max(1, N - 1);
        initialScrollCentered = true;
      }

      // Smooth eased inertia (ramps up fast, glides to soft stop)
      if (!(dragState.active && dragState.dragAxis === 'x')) {
        const accelFactor = 1 - Math.exp(-18 * dt);
        vel += (targetVel - vel) * accelFactor;
        const decayFactor = Math.exp(-5.4 * dt);
        targetVel *= decayFactor;
        if (Math.abs(vel) < 0.35 && Math.abs(targetVel) < 0.35) {
          vel = 0;
          targetVel = 0;
        }
        scrollPos += vel * dt;
      }

      // Morph strip <-> grid smoothly
      const targetMorph = viewModeRef.current === 'grid' ? 1 : 0;
      const morphEase = reduceMotion ? 1 : 1 - Math.exp(-8.5 * dt);
      morphProgress += (targetMorph - morphProgress) * morphEase;
      if (Math.abs(targetMorph - morphProgress) < 0.001) {
        morphProgress = targetMorph;
      }

      // Find current center card in strip
      let centerIdx = 0;
      let minAbsX = Infinity;

      const wrappedXs = new Array<number>(N);
      for (let i = 0; i < N; i++) {
        const rawX = i * strip.step - scrollPos;
        const wrappedX =
          ((((rawX % totalStripWidth) + totalStripWidth) + totalStripWidth * 0.5) %
            totalStripWidth) -
          totalStripWidth * 0.5;
        wrappedXs[i] = wrappedX;
        if (Math.abs(wrappedX) < minAbsX) {
          minAbsX = Math.abs(wrappedX);
          centerIdx = i;
        }
      }

      if (centerIdx !== lastCenterIdx) {
        lastCenterIdx = centerIdx;
        lastIndexChangeAt = now;
      }

      // Update cards & top-left tilted labels
      const halfW = W * 0.5;
      for (let i = 0; i < N; i++) {
        const c = cards[i];
        const wrappedX = wrappedXs[i];

        // Visibility check for re-entry 5x7 block reveal
        const isVisibleNow =
          morphProgress > 0.25 || Math.abs(wrappedX) < halfW + strip.cardW * 0.6;
        if (isVisibleNow && !c.wasVisible && morphProgress < 0.25 && hasPlayedInitialReveal) {
          triggerReveal(i, 40 + Math.random() * 170);
        }
        c.wasVisible = isVisibleNow;

        // Advance 5x7 block reveal over ~750ms
        if (c.isLoaded && c.revealActive) {
          const elapsed = now - c.revealStartedAt - c.revealDelayMs;
          if (elapsed > 0) {
            c.revealProgress = Math.min(1, elapsed / 750);
            if (c.revealProgress >= 1) {
              c.revealActive = false;
            }
          }
        }

        // Hover damping
        c.targetHover = hoveredCardIdx === i ? 1 : 0;
        c.hover += (c.targetHover - c.hover) * (1 - Math.exp(-14 * dt));

        // Grid target coordinates (centered 5x2 grid)
        const col = i % grid.cols;
        const row = Math.floor(i / grid.cols);
        const gridW = grid.cols * grid.cardW + (grid.cols - 1) * grid.colGap;
        const gridH = grid.rows * grid.cardH + (grid.rows - 1) * grid.rowGap;
        const gridX = -gridW * 0.5 + grid.cardW * 0.5 + col * (grid.cardW + grid.colGap);
        const gridY =
          grid.gridCenterY + gridH * 0.5 - grid.cardH * 0.5 - row * (grid.cardH + grid.rowGap);

        // Interpolate strip <-> grid
        const cx = THREE.MathUtils.lerp(wrappedX, gridX, morphProgress);
        const cy = THREE.MathUtils.lerp(strip.stripCenterY, gridY, morphProgress);
        const cw = THREE.MathUtils.lerp(strip.cardW, grid.cardW, morphProgress);
        const ch = THREE.MathUtils.lerp(strip.centerH, grid.cardH, morphProgress);

        c.currentX = cx;
        c.currentY = cy;
        c.currentW = cw;
        c.currentH = ch;

        // Subtle fade at extreme viewport edges in strip mode
        const edgeFade =
          morphProgress > 0.5
            ? 1
            : THREE.MathUtils.clamp(
                1.18 - Math.max(0, Math.abs(wrappedX) - halfW * 0.78) / (strip.cardW * 0.9),
                0,
                1
              );

        const u = c.material.uniforms;
        u.uCardCenter.value.set(cx, cy);
        u.uCardSize.value.set(cw, ch);
        u.uMorph.value = morphProgress;
        u.uHover.value = c.hover;
        u.uStep.value = strip.step;
        u.uCurveSpan.value = strip.curveSpan;
        u.uLiftAmp.value = strip.liftAmp;
        u.uHeightAtCenter.value = strip.centerH;
        u.uCardAspect.value = cw / Math.max(ch, 1);
        u.uReveal.value = reduceMotion ? 1 : c.revealProgress;
        u.uEdgeAlpha.value = edgeFade;
        u.uTime.value = now * 0.001;

        c.mesh.renderOrder =
          hoveredCardIdx === i ? 20 : Math.round(10 - Math.abs(wrappedX) * 0.01);

        // Compute exact top-left & top-right edge corners to position and tilt the top-left label
        const labelEl = labelRefs.current[i];
        if (labelEl) {
          const hoverScale = 1 + c.hover * 0.015;
          const stripWeight = 1 - morphProgress;
          const localHalfX = 0.5 * cw * hoverScale;
          const worldX_TL = cx - localHalfX;
          const worldX_TR = cx + localHalfX;

          const calcTopY = (wx: number) => {
            const d = Math.abs(wx) / Math.max(strip.step, 1);
            const hf = (0.318 + 0.122 * Math.exp(-0.68 * d * d)) / 0.44;
            const finalH = THREE.MathUtils.lerp(hf, 1, morphProgress);
            const normX = wx / Math.max(strip.curveSpan, 1);
            const lift = strip.liftAmp * normX * normX * stripWeight;
            return cy + 0.5 * ch * hoverScale * finalH + lift;
          };

          const topY_TL = calcTopY(worldX_TL);
          const topY_TR = calcTopY(worldX_TR);
          const slope = (topY_TR - topY_TL) / Math.max(worldX_TR - worldX_TL, 1);
          const tiltDeg = -Math.atan(slope) * (180 / Math.PI) * stripWeight;

          const screenX = halfW + worldX_TL + 2;
          const screenY = H * 0.5 - topY_TL - 16;

          labelEl.style.transform = `translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(
            1
          )}px, 0) rotate(${tiltDeg.toFixed(2)}deg)`;
          labelEl.style.opacity = (edgeFade * 0.78).toFixed(3);
        }
      }

      // Scrambling title + sliding progress tick
      const centerArt = artworksRef.current[centerIdx];
      if (centerArt && titleTextRef.current && titleCodeRef.current) {
        titleCodeRef.current.textContent = centerArt.code;

        const speed = Math.abs(vel);
        const timeSinceChange = now - lastIndexChangeAt;
        const moving = speed > 22 || timeSinceChange < 280;

        if (moving && !reduceMotion) {
          if (now - lastScrambleSwapAt > 44) {
            lastScrambleSwapAt = now;
            scrambleTickSeed += 1;
          }
          const speedPenalty = Math.min(1, speed / 380);
          const settleProgress =
            speed > 22
              ? Math.max(0.05, 0.45 * (1 - speedPenalty))
              : Math.min(1, timeSinceChange / 280);
          titleTextRef.current.textContent = createScrambleCode(
            centerArt.title,
            settleProgress,
            scrambleTickSeed
          );
        } else {
          titleTextRef.current.textContent = centerArt.title;
        }
      }

      // Progress tick sliding cleanly along the thin progress line
      const targetTickFrac = centerIdx / Math.max(1, N - 1);
      smoothTickFrac += (targetTickFrac - smoothTickFrac) * (1 - Math.exp(-14 * dt));
      if (progressLineRef.current && progressTickRef.current) {
        const lineW = progressLineRef.current.clientWidth || 200;
        const tickW = progressTickRef.current.clientWidth || 16;
        const travel = Math.max(0, lineW - tickW);
        progressTickRef.current.style.transform = `translate3d(${(
          smoothTickFrac * travel
        ).toFixed(2)}px, -50%, 0)`;
      }

      if (isSectionVisible && !isDetailOpenRef.current) {
        renderer.render(scene, camera);
      }
    };

    const tick = (now: number) => {
      renderFrame(now);
      if (isSoftwareGl) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (gl && typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            const st = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
            if (st === gl.UNSIGNALED) {
              rafId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              rafId = window.setTimeout(() => {
                rafId = requestAnimationFrame(tick);
              }, 16);
            }
          };
          rafId = window.setTimeout(poll, 5);
          return;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(rafId);
      ro.disconnect();
      io.disconnect();
      scrollContainer?.removeEventListener('scroll', onMainScroll);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      host.removeEventListener('pointerleave', onPointerLeave);
      host.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);

      cards.forEach((c) => {
        c.texture?.dispose();
        c.material.dispose();
      });
      placeholderTex.dispose();
      geometry.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={hostRef}
      data-cursor="default"
      style={{ touchAction: 'pan-y' }}
      className="absolute inset-0 z-10 w-full h-full select-none overflow-hidden"
    >
      {/* Dedicated WebGL Mount Layer */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Floating Top-Left Card Labels (tilted along each card's top edge) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none overflow-hidden"
      >
        {artworks.map((art, i) => (
          <div
            key={art.slot}
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            style={{
              transformOrigin: 'left bottom',
              opacity: 0,
            }}
            className="absolute top-0 left-0 flex items-center gap-1.5 text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-[#F2EDE0]/80 font-sans whitespace-nowrap will-change-transform"
          >
            <span className="text-[#F2EDE0]/50">{art.code}</span>
            <span className="hidden sm:inline max-w-[78px] md:max-w-[115px] truncate">
              {art.title}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Scrambling Title & Sliding Progress Line (fades out in Grid mode) */}
      <div
        ref={hudBottomRef}
        className={`absolute inset-x-0 bottom-[clamp(52px,8.5vh,84px)] z-20 px-4 flex flex-col items-center justify-center gap-2 sm:gap-2.5 pointer-events-none transition-opacity duration-400 ${
          viewMode === 'grid' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex items-baseline justify-center gap-2.5 sm:gap-3.5 max-w-full">
          <span
            ref={titleCodeRef}
            className="text-[10px] sm:text-xs tracking-[0.24em] text-[#F2EDE0]/55 font-sans tabular-nums shrink-0"
          >
            01
          </span>
          <h2
            ref={titleTextRef}
            style={{ fontFamily: "'Instrument Serif', serif" }}
            className="text-[clamp(1.5rem,3.4vw,2.65rem)] leading-none tracking-[-0.01em] text-[#F2EDE0] font-normal whitespace-nowrap text-center"
          >
            {artworks[0]?.title || 'LOVE WORK'}
          </h2>
        </div>

        {/* Thin Progress Line with Sliding Tick */}
        <div
          ref={progressLineRef}
          className="relative w-40 sm:w-64 h-px bg-white/20"
        >
          <div
            ref={progressTickRef}
            className="absolute top-1/2 left-0 w-4 sm:w-5 h-[2px] bg-[#F2EDE0] shadow-[0_0_8px_rgba(242,237,224,0.6)]"
            style={{ transform: 'translate3d(0px, -50%, 0)' }}
          />
        </div>
      </div>
    </div>
  );
}
