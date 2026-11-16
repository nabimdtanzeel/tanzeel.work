import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Config object for positioning, scaling, float speed, tilt amplitude, and parallax strength per logo
const CONFIG = {
  gmail: {
    position: { x: -3.8, y: 1.8, z: 0 },
    scale: 0.024,
    floatSpeed: 1.6,
    floatAmount: 0.25,
    tiltAmplitudeY: 0.38, // ~22 deg
    tiltAmplitudeX: 0.17, // ~10 deg
    parallaxStrength: 0.07,
  },
  instagram: {
    position: { x: 3.8, y: -1.8, z: 0 },
    scale: 0.03,
    floatSpeed: 1.9,
    floatAmount: 0.25,
    tiltAmplitudeY: 0.38,
    tiltAmplitudeX: 0.17,
    parallaxStrength: 0.07,
  },
};

export default function FloatingLogos3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    container.appendChild(renderer.domElement);

    // Procedural Night Sky Environment Map for clearcoat/roughness reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x0a1628);
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 512;
    envCanvas.height = 256;
    const eCtx = envCanvas.getContext('2d');
    if (eCtx) {
      const grad = eCtx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#1b3a7a'); // top sky
      grad.addColorStop(0.7, '#0c1a35');
      grad.addColorStop(1, '#050a1a'); // horizon
      eCtx.fillStyle = grad;
      eCtx.fillRect(0, 0, 512, 256);

      // Add stars
      eCtx.fillStyle = '#ffffff';
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 180;
        const r = Math.random() * 1.5;
        eCtx.globalAlpha = Math.random() * 0.8 + 0.2;
        eCtx.beginPath();
        eCtx.arc(x, y, r, 0, Math.PI * 2);
        eCtx.fill();
      }
    }
    const envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    envScene.background = envTexture;
    const envRenderTarget = pmremGenerator.fromScene(envScene);
    scene.environment = envRenderTarget.texture;

    // Cool Moonlit Lighting
    const ambientLight = new THREE.AmbientLight(0x1a2a52, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x9db8ff, 1.2); // Moonlit key light from upper-left
    keyLight.position.set(-6, 6, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x5a7dff, 1.5); // Cool rim light from behind
    rimLight.position.set(0, -3, -6);
    scene.add(rimLight);

    const geometriesToDispose: THREE.BufferGeometry[] = [];
    const materialsToDispose: THREE.Material[] = [];
    const texturesToDispose: THREE.Texture[] = [];

    // ==========================================
    // 1. GMAIL LOGO (100 x 75 grid, origin center)
    // Desaturated & darkened by ~10-15% to sit in night palette
    // ==========================================
    const gmailGroup = new THREE.Group();

    // 1. Envelope body: pure white (#FFFFFF) rounded rectangle 100 x 75, radius 6, depth 3, bevel 0.8
    const cardShape = new THREE.Shape();
    const cw = 100, ch = 75, cr = 6;
    cardShape.absarc(-cw/2 + cr, -ch/2 + cr, cr, Math.PI, Math.PI * 1.5, false);
    cardShape.absarc(cw/2 - cr, -ch/2 + cr, cr, Math.PI * 1.5, Math.PI * 2, false);
    cardShape.absarc(cw/2 - cr, ch/2 - cr, cr, 0, Math.PI * 0.5, false);
    cardShape.absarc(-cw/2 + cr, ch/2 - cr, cr, Math.PI * 0.5, Math.PI, false);

    const cardGeo = new THREE.ExtrudeGeometry(cardShape, {
      depth: 3,
      bevelEnabled: true,
      bevelThickness: 0.8,
      bevelSize: 0.8,
      bevelSegments: 3,
    });
    geometriesToDispose.push(cardGeo);

    const whiteCardMat = new THREE.MeshPhysicalMaterial({
      color: 0xefeff1, // slightly tinted white for night moon illumination
      roughness: 0.3,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    materialsToDispose.push(whiteCardMat);
    const cardMesh = new THREE.Mesh(cardGeo, whiteCardMat);
    cardMesh.position.z = -1.5;
    gmailGroup.add(cardMesh);

    // Helper extrusion settings for M pieces
    const mExtrude = {
      depth: 2.2,
      bevelEnabled: true,
      bevelThickness: 0.4,
      bevelSize: 0.4,
      bevelSegments: 2,
    };

    // 2. Left leg: vertical strip x -50 to -38, full height (#3a76dc desaturated blue)
    const leftLegShape = new THREE.Shape();
    leftLegShape.moveTo(-50, -37.5);
    leftLegShape.lineTo(-38, -37.5);
    leftLegShape.lineTo(-38, 37.5);
    leftLegShape.lineTo(-50, 37.5);
    leftLegShape.closePath();
    const leftLegGeo = new THREE.ExtrudeGeometry(leftLegShape, mExtrude);
    geometriesToDispose.push(leftLegGeo);
    const blueMat = new THREE.MeshPhysicalMaterial({ color: 0x3a76dc, roughness: 0.25, clearcoat: 0.8 });
    materialsToDispose.push(blueMat);
    const leftLegMesh = new THREE.Mesh(leftLegGeo, blueMat);
    leftLegMesh.position.z = 1.0;
    gmailGroup.add(leftLegMesh);

    // 3. Right leg: vertical strip x 38 to 50, full height (#2e9549 desaturated green)
    const rightLegShape = new THREE.Shape();
    rightLegShape.moveTo(38, -37.5);
    rightLegShape.lineTo(50, -37.5);
    rightLegShape.lineTo(50, 37.5);
    rightLegShape.lineTo(38, 37.5);
    rightLegShape.closePath();
    const rightLegGeo = new THREE.ExtrudeGeometry(rightLegShape, mExtrude);
    geometriesToDispose.push(rightLegGeo);
    const greenMat = new THREE.MeshPhysicalMaterial({ color: 0x2e9549, roughness: 0.25, clearcoat: 0.8 });
    materialsToDispose.push(greenMat);
    const rightLegMesh = new THREE.Mesh(rightLegGeo, greenMat);
    rightLegMesh.position.z = 1.0;
    gmailGroup.add(rightLegMesh);

    // 4. Red V: chevron from top-left (-38, 37.5) down to center (0, 6) and up to top-right (38, 37.5), thickness 14 (#d1382b)
    const redVShape = new THREE.Shape();
    redVShape.moveTo(-38, 37.5);
    redVShape.lineTo(0, 10);
    redVShape.lineTo(38, 37.5);
    redVShape.lineTo(38, 23.5);
    redVShape.lineTo(0, -4);
    redVShape.lineTo(-38, 23.5);
    redVShape.closePath();
    const redVGeo = new THREE.ExtrudeGeometry(redVShape, mExtrude);
    geometriesToDispose.push(redVGeo);
    const redMat = new THREE.MeshPhysicalMaterial({ color: 0xd1382b, roughness: 0.25, clearcoat: 0.8 });
    materialsToDispose.push(redMat);
    const redVMesh = new THREE.Mesh(redVGeo, redMat);
    redVMesh.position.z = 1.3;
    gmailGroup.add(redVMesh);

    // 5. Small dark-red fold triangle (#ad1c1a) at left base of V, yellow triangle (#e0a803) at top-right
    const darkRedTriShape = new THREE.Shape();
    darkRedTriShape.moveTo(-50, 37.5);
    darkRedTriShape.lineTo(-38, 37.5);
    darkRedTriShape.lineTo(-38, 23.5);
    darkRedTriShape.closePath();
    const darkRedGeo = new THREE.ExtrudeGeometry(darkRedTriShape, mExtrude);
    geometriesToDispose.push(darkRedGeo);
    const darkRedMat = new THREE.MeshPhysicalMaterial({ color: 0xad1c1a, roughness: 0.25, clearcoat: 0.8 });
    materialsToDispose.push(darkRedMat);
    const darkRedMesh = new THREE.Mesh(darkRedGeo, darkRedMat);
    darkRedMesh.position.z = 1.5;
    gmailGroup.add(darkRedMesh);

    const yellowTriShape = new THREE.Shape();
    yellowTriShape.moveTo(38, 37.5);
    yellowTriShape.lineTo(50, 37.5);
    yellowTriShape.lineTo(38, 23.5);
    yellowTriShape.closePath();
    const yellowGeo = new THREE.ExtrudeGeometry(yellowTriShape, mExtrude);
    geometriesToDispose.push(yellowGeo);
    const yellowMat = new THREE.MeshPhysicalMaterial({ color: 0xe0a803, roughness: 0.25, clearcoat: 0.8 });
    materialsToDispose.push(yellowMat);
    const yellowMesh = new THREE.Mesh(yellowGeo, yellowMat);
    yellowMesh.position.z = 1.5;
    gmailGroup.add(yellowMesh);

    scene.add(gmailGroup);

    // ==========================================
    // 2. INSTAGRAM LOGO (80 x 80 grid)
    // ==========================================
    const instaGroup = new THREE.Group();

    const iSize = 80, iRadius = 22;
    const instaShape = new THREE.Shape();
    instaShape.absarc(-iSize/2 + iRadius, -iSize/2 + iRadius, iRadius, Math.PI, Math.PI * 1.5, false);
    instaShape.absarc(iSize/2 - iRadius, -iSize/2 + iRadius, iRadius, Math.PI * 1.5, Math.PI * 2, false);
    instaShape.absarc(iSize/2 - iRadius, iSize/2 - iRadius, iRadius, 0, Math.PI * 0.5, false);
    instaShape.absarc(-iSize/2 + iRadius, iSize/2 - iRadius, iRadius, Math.PI * 0.5, Math.PI, false);

    // Sides and back extruded in #7a329e (desaturated night Instagram purple)
    const instaSidesGeo = new THREE.ExtrudeGeometry(instaShape, {
      depth: 5,
      bevelEnabled: true,
      bevelThickness: 1.2,
      bevelSize: 1.2,
      bevelSegments: 3,
    });
    geometriesToDispose.push(instaSidesGeo);

    const instaSideMat = new THREE.MeshPhysicalMaterial({
      color: 0x7a329e,
      roughness: 0.2,
      metalness: 0.1,
      clearcoat: 1.0,
    });
    materialsToDispose.push(instaSideMat);
    const instaSidesMesh = new THREE.Mesh(instaSidesGeo, instaSideMat);
    instaSidesMesh.position.z = -2.5;
    instaGroup.add(instaSidesMesh);

    // 1024x1024 CanvasTexture gradient (radial centered at 30% x, 107% y, radius 150%)
    const iCanvas = document.createElement('canvas');
    iCanvas.width = 1024;
    iCanvas.height = 1024;
    const iCtx = iCanvas.getContext('2d');
    if (iCtx) {
      const grad = iCtx.createRadialGradient(
        1024 * 0.3, 1024 * 1.07, 100,
        1024 * 0.3, 1024 * 1.07, 1024 * 1.5
      );
      grad.addColorStop(0.0, '#dbbe68'); // slightly desaturated night gradient
      grad.addColorStop(0.1, '#d8642e');
      grad.addColorStop(0.5, '#a42870');
      grad.addColorStop(1.0, '#3f54b4');

      iCtx.fillStyle = grad;
      iCtx.fillRect(0, 0, 1024, 1024);
    }

    const instaTexture = new THREE.CanvasTexture(iCanvas);
    texturesToDispose.push(instaTexture);
    instaTexture.colorSpace = THREE.SRGBColorSpace;
    instaTexture.anisotropy = 8;

    // Front face built separately with ShapeGeometry and manually normalized UVs
    const frontGeo = new THREE.ShapeGeometry(instaShape);
    const posAttribute = frontGeo.attributes.position;
    const uvAttribute = new THREE.BufferAttribute(new Float32Array(posAttribute.count * 2), 2);
    for (let i = 0; i < posAttribute.count; i++) {
      const x = posAttribute.getX(i);
      const y = posAttribute.getY(i);
      // uv.x = (x + 40) / 80, uv.y = (y + 40) / 80
      uvAttribute.setXY(i, (x + 40) / 80, (y + 40) / 80);
    }
    frontGeo.setAttribute('uv', uvAttribute);
    geometriesToDispose.push(frontGeo);

    const frontMat = new THREE.MeshPhysicalMaterial({
      map: instaTexture,
      roughness: 0.2,
      metalness: 0.05,
      clearcoat: 1.0,
    });
    materialsToDispose.push(frontMat);
    const frontMesh = new THREE.Mesh(frontGeo, frontMat);
    frontMesh.position.z = 2.6;
    instaGroup.add(frontMesh);

    // White glyph, depth 1.5, placed 0.6 above front face with proper Shape holes
    const instaWhiteMat = new THREE.MeshPhysicalMaterial({
      color: 0xefeff1,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 0.8,
    });
    materialsToDispose.push(instaWhiteMat);

    const glyphExtrude = {
      depth: 1.5,
      bevelEnabled: true,
      bevelThickness: 0.25,
      bevelSize: 0.25,
      bevelSegments: 2,
    };

    // Outer outline ring: outer 52 x 52 radius 15, hole 42 x 42 radius 10
    const outerRingShape = new THREE.Shape();
    const ow = 52, oh = 52, or = 15;
    outerRingShape.absarc(-ow/2 + or, -oh/2 + or, or, Math.PI, Math.PI * 1.5, false);
    outerRingShape.absarc(ow/2 - or, -oh/2 + or, or, Math.PI * 1.5, Math.PI * 2, false);
    outerRingShape.absarc(ow/2 - or, oh/2 - or, or, 0, Math.PI * 0.5, false);
    outerRingShape.absarc(-ow/2 + or, oh/2 - or, or, Math.PI * 0.5, Math.PI, false);

    const innerHolePath = new THREE.Path();
    const iw = 42, ih = 42, ir = 10;
    // Clockwise for hole
    innerHolePath.absarc(-iw/2 + ir, -ih/2 + ir, ir, Math.PI * 1.5, Math.PI, true);
    innerHolePath.absarc(-iw/2 + ir, ih/2 - ir, ir, Math.PI, Math.PI * 0.5, true);
    innerHolePath.absarc(iw/2 - ir, ih/2 - ir, ir, Math.PI * 0.5, 0, true);
    innerHolePath.absarc(iw/2 - ir, -ih/2 + ir, ir, 0, Math.PI * 1.5, true);
    outerRingShape.holes.push(innerHolePath);

    const outerRingGeo = new THREE.ExtrudeGeometry(outerRingShape, glyphExtrude);
    geometriesToDispose.push(outerRingGeo);
    const outerRingMesh = new THREE.Mesh(outerRingGeo, instaWhiteMat);
    outerRingMesh.position.z = 3.2;
    instaGroup.add(outerRingMesh);

    // Lens ring: outer radius 12.5, hole radius 8
    const lensShape = new THREE.Shape();
    lensShape.absarc(0, 0, 12.5, 0, Math.PI * 2, false);
    const lensHole = new THREE.Path();
    lensHole.absarc(0, 0, 8, 0, Math.PI * 2, true);
    lensShape.holes.push(lensHole);

    const lensGeo = new THREE.ExtrudeGeometry(lensShape, glyphExtrude);
    geometriesToDispose.push(lensGeo);
    const lensMesh = new THREE.Mesh(lensGeo, instaWhiteMat);
    lensMesh.position.z = 3.2;
    instaGroup.add(lensMesh);

    // Flash dot: circle radius 3 at (+14, +14) from center, clear gap
    const dotShape = new THREE.Shape();
    dotShape.absarc(14, 14, 3, 0, Math.PI * 2, false);
    const dotGeo = new THREE.ExtrudeGeometry(dotShape, glyphExtrude);
    geometriesToDispose.push(dotGeo);
    const dotMesh = new THREE.Mesh(dotGeo, instaWhiteMat);
    dotMesh.position.z = 3.2;
    instaGroup.add(dotMesh);

    scene.add(instaGroup);

    // ==========================================
    // 3. SOFT ADDITIVE GLOW SPRITE & SPARKLES
    // ==========================================
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128;
    glowCanvas.height = 128;
    const gCtx = glowCanvas.getContext('2d');
    if (gCtx) {
      const gGrad = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gGrad.addColorStop(0, 'rgba(74, 108, 255, 0.45)');
      gGrad.addColorStop(1, 'rgba(74, 108, 255, 0)');
      gCtx.fillStyle = gGrad;
      gCtx.fillRect(0, 0, 128, 128);
    }
    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    texturesToDispose.push(glowTexture);

    const glowGeo = new THREE.PlaneGeometry(5.5, 5.5);
    geometriesToDispose.push(glowGeo);
    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materialsToDispose.push(glowMat);

    const gmailGlow = new THREE.Mesh(glowGeo, glowMat);
    gmailGlow.position.set(CONFIG.gmail.position.x, CONFIG.gmail.position.y, -1.5);
    scene.add(gmailGlow);

    const instaGlow = new THREE.Mesh(glowGeo, glowMat);
    instaGlow.position.set(CONFIG.instagram.position.x, CONFIG.instagram.position.y, -1.5);
    scene.add(instaGlow);

    // Tiny dust/sparkle points near each logo (35 points each group)
    const particleCount = 35;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 4;
      particlePositions[i + 1] = (Math.random() - 0.5) * 4;
      particlePositions[i + 2] = (Math.random() - 0.5) * 2;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    geometriesToDispose.push(particleGeo);

    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 32;
    particleCanvas.height = 32;
    const pCtx = particleCanvas.getContext('2d');
    if (pCtx) {
      const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      pGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      pGrad.addColorStop(0.5, 'rgba(157, 184, 255, 0.4)');
      pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      pCtx.fillStyle = pGrad;
      pCtx.fillRect(0, 0, 32, 32);
    }
    const particleTexture = new THREE.CanvasTexture(particleCanvas);
    texturesToDispose.push(particleTexture);

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materialsToDispose.push(particleMat);

    const gmailParticles = new THREE.Points(particleGeo, particleMat);
    gmailParticles.position.set(CONFIG.gmail.position.x, CONFIG.gmail.position.y, 0);
    scene.add(gmailParticles);

    const instaParticles = new THREE.Points(particleGeo.clone(), particleMat);
    instaParticles.position.set(CONFIG.instagram.position.x, CONFIG.instagram.position.y, 0);
    scene.add(instaParticles);

    // ==========================================
    // 4. MOUSE PARALLAX & ANIMATION LOOP
    // ==========================================
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (document.hidden) return; // Pause when hidden

      const t = clock.getElapsedTime();

      // Lerp smoothing factor 0.05
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const isSmallScreen = window.innerWidth < 600;

      if (isSmallScreen) {
        // Under 600px: scale down and show one logo only (Gmail centered)
        gmailGroup.visible = true;
        instaGroup.visible = false;
        gmailGlow.visible = true;
        instaGlow.visible = false;
        gmailParticles.visible = true;
        instaParticles.visible = false;

        const floatY = Math.sin(t * CONFIG.gmail.floatSpeed) * CONFIG.gmail.floatAmount * 0.5;
        gmailGroup.position.set(0, floatY, 0);
        gmailGroup.scale.setScalar(CONFIG.gmail.scale * 0.75);

        gmailGroup.rotation.y = Math.sin(t * 0.5) * CONFIG.gmail.tiltAmplitudeY + mouseX * CONFIG.gmail.parallaxStrength;
        gmailGroup.rotation.x = Math.cos(t * 0.4) * CONFIG.gmail.tiltAmplitudeX + mouseY * CONFIG.gmail.parallaxStrength;

        gmailGlow.position.set(0, floatY, -1.5);
        gmailParticles.position.set(0, floatY, 0);
      } else {
        gmailGroup.visible = true;
        instaGroup.visible = true;
        gmailGlow.visible = true;
        instaGlow.visible = true;
        gmailParticles.visible = true;
        instaParticles.visible = true;

        // Gmail (Upper-left)
        const gmailFloatY = Math.sin(t * CONFIG.gmail.floatSpeed) * CONFIG.gmail.floatAmount;
        gmailGroup.position.set(
          CONFIG.gmail.position.x + mouseX * CONFIG.gmail.parallaxStrength,
          CONFIG.gmail.position.y + gmailFloatY + mouseY * CONFIG.gmail.parallaxStrength,
          CONFIG.gmail.position.z
        );
        gmailGroup.scale.setScalar(CONFIG.gmail.scale);
        gmailGroup.rotation.y = Math.sin(t * 0.5) * CONFIG.gmail.tiltAmplitudeY + mouseX * CONFIG.gmail.parallaxStrength;
        gmailGroup.rotation.x = Math.cos(t * 0.4) * CONFIG.gmail.tiltAmplitudeX + mouseY * CONFIG.gmail.parallaxStrength;
        gmailGlow.position.set(gmailGroup.position.x, gmailGroup.position.y, -1.5);
        gmailParticles.position.set(gmailGroup.position.x, gmailGroup.position.y, 0);

        // Instagram (Lower-right)
        const instaFloatY = Math.cos(t * CONFIG.instagram.floatSpeed + 1.2) * CONFIG.instagram.floatAmount;
        instaGroup.position.set(
          CONFIG.instagram.position.x + mouseX * CONFIG.instagram.parallaxStrength,
          CONFIG.instagram.position.y + instaFloatY + mouseY * CONFIG.instagram.parallaxStrength,
          CONFIG.instagram.position.z
        );
        instaGroup.scale.setScalar(CONFIG.instagram.scale);
        instaGroup.rotation.y = Math.sin(t * 0.5 + 1.0) * CONFIG.instagram.tiltAmplitudeY + mouseX * CONFIG.instagram.parallaxStrength;
        instaGroup.rotation.x = Math.cos(t * 0.4 + 1.0) * CONFIG.instagram.tiltAmplitudeX + mouseY * CONFIG.instagram.parallaxStrength;
        instaGlow.position.set(instaGroup.position.x, instaGroup.position.y, -1.5);
        instaParticles.position.set(instaGroup.position.x, instaGroup.position.y, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // ==========================================
    // 5. DISPOSAL ON UNMOUNT
    // ==========================================
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      geometriesToDispose.forEach((geo) => geo.dispose());
      materialsToDispose.forEach((mat) => mat.dispose());
      texturesToDispose.forEach((tex) => tex.dispose());
      envRenderTarget.dispose();
      pmremGenerator.dispose();

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-15 pointer-events-none overflow-hidden"
      style={{ pointerEvents: 'none' }}
    />
  );
}
