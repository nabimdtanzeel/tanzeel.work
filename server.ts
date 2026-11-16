import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '200mb' }));
  app.use('/images', express.static(path.join(process.cwd(), 'public/images')));
  app.use('/videos', express.static(path.join(process.cwd(), 'public/videos')));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Upload single artwork directly to public/images/design-work/
  app.post('/api/upload-artwork', (req, res) => {
    try {
      const { id, dataUrl } = req.body;
      if (!id || !dataUrl) {
        return res.status(400).json({ error: 'Missing id or dataUrl' });
      }

      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const publicDir = path.join(process.cwd(), 'public/images/design-work');
      const distDir = path.join(process.cwd(), 'dist/images/design-work');

      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

      const fileName = `design-${id}.jpg`;
      fs.writeFileSync(path.join(publicDir, fileName), buffer);
      fs.writeFileSync(path.join(distDir, fileName), buffer);

      console.log(`[Upload] Saved real artwork to ${path.join(publicDir, fileName)} (${buffer.length} bytes)`);

      return res.json({
        success: true,
        path: `/images/design-work/${fileName}?t=${Date.now()}`,
        bytes: buffer.length,
      });
    } catch (err: any) {
      console.error('Error saving artwork:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Batch upload artworks directly to public/images/design-work/
  app.post('/api/batch-upload-artworks', (req, res) => {
    try {
      const { files } = req.body;
      if (!Array.isArray(files)) {
        return res.status(400).json({ error: 'Invalid files array' });
      }

      const publicDir = path.join(process.cwd(), 'public/images/design-work');
      const distDir = path.join(process.cwd(), 'dist/images/design-work');

      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

      const saved: string[] = [];
      for (const item of files) {
        const { id, dataUrl } = item;
        if (!id || !dataUrl) continue;

        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `design-${id}.jpg`;

        fs.writeFileSync(path.join(publicDir, fileName), buffer);
        fs.writeFileSync(path.join(distDir, fileName), buffer);
        saved.push(fileName);
        console.log(`[Batch Upload] Saved real artwork to ${fileName} (${buffer.length} bytes)`);
      }

      return res.json({ success: true, saved });
    } catch (err: any) {
      console.error('Error batch saving artworks:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // List current files on disk
  app.get('/api/artworks-status', (req, res) => {
    const publicDir = path.join(process.cwd(), 'public/images/design-work');
    if (!fs.existsSync(publicDir)) {
      return res.json({ files: [] });
    }
    const files = fs.readdirSync(publicDir);
    return res.json({ files });
  });

  // Upload background video directly to public/videos/design-work-bg.mp4
  app.post('/api/upload-background-video', (req, res) => {
    try {
      const { dataUrl } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ error: 'Missing dataUrl' });
      }

      const base64Data = dataUrl.replace(/^data:video\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const publicDir = path.join(process.cwd(), 'public/videos');
      const distDir = path.join(process.cwd(), 'dist/videos');

      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

      const fileName = 'design-work-bg.mp4';
      fs.writeFileSync(path.join(publicDir, fileName), buffer);
      fs.writeFileSync(path.join(distDir, fileName), buffer);

      console.log(`[Video Upload] Saved background video to ${path.join(publicDir, fileName)} (${buffer.length} bytes)`);

      return res.json({
        success: true,
        path: `/videos/${fileName}?t=${Date.now()}`,
        bytes: buffer.length,
      });
    } catch (err: any) {
      console.error('Error saving background video:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Check if Page 3 Blender video exists on disk
  app.get('/api/check-page3-video', (req, res) => {
    const videoPath = path.join(process.cwd(), 'public/videos/blender-3d-bg.mp4');
    const exists = fs.existsSync(videoPath);
    return res.json({ exists, path: exists ? '/videos/blender-3d-bg.mp4' : null });
  });

  // Upload Blender 3D video for Page 3 background
  app.post('/api/upload-page3-video', (req, res) => {
    try {
      const { dataUrl } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ error: 'Missing dataUrl' });
      }

      const base64Data = dataUrl.replace(/^data:video\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const publicDir = path.join(process.cwd(), 'public/videos');
      const distDir = path.join(process.cwd(), 'dist/videos');

      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

      const fileName = 'blender-3d-bg.mp4';
      fs.writeFileSync(path.join(publicDir, fileName), buffer);
      fs.writeFileSync(path.join(distDir, fileName), buffer);

      console.log(`[Blender 3D Video Upload] Saved to ${path.join(publicDir, fileName)} (${buffer.length} bytes)`);

      return res.json({
        success: true,
        path: `/videos/${fileName}?t=${Date.now()}`,
        bytes: buffer.length,
      });
    } catch (err: any) {
      console.error('Error saving blender 3d video:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Get current reel videos on disk
  app.get('/api/get-reels', (req, res) => {
    const reels: { slot: number; path: string }[] = [];
    const publicDir = path.join(process.cwd(), 'public/videos');
    for (let slot = 1; slot <= 4; slot++) {
      const fileName = `reel-${slot}.mp4`;
      if (fs.existsSync(path.join(publicDir, fileName))) {
        reels.push({ slot, path: `/videos/${fileName}` });
      }
    }
    return res.json({ reels });
  });

  // Upload individual reel video (slot 1 to 4)
  app.post('/api/upload-reel-video', (req, res) => {
    try {
      const { slot, dataUrl } = req.body;
      const slotNum = Number(slot);
      if (!slotNum || slotNum < 1 || slotNum > 4 || !dataUrl) {
        return res.status(400).json({ error: 'Invalid slot or missing dataUrl' });
      }

      const base64Data = dataUrl.replace(/^data:video\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const publicDir = path.join(process.cwd(), 'public/videos');
      const distDir = path.join(process.cwd(), 'dist/videos');

      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

      const fileName = `reel-${slotNum}.mp4`;
      fs.writeFileSync(path.join(publicDir, fileName), buffer);
      fs.writeFileSync(path.join(distDir, fileName), buffer);

      console.log(`[Reel Video Upload] Saved reel-${slotNum} (${buffer.length} bytes)`);

      return res.json({
        success: true,
        slot: slotNum,
        path: `/videos/${fileName}?t=${Date.now()}`,
        bytes: buffer.length,
      });
    } catch (err: any) {
      console.error('Error saving reel video:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Delete/Clear individual reel video
  app.post('/api/delete-reel-video', (req, res) => {
    try {
      const { slot } = req.body;
      const slotNum = Number(slot);
      const publicPath = path.join(process.cwd(), `public/videos/reel-${slotNum}.mp4`);
      const distPath = path.join(process.cwd(), `dist/videos/reel-${slotNum}.mp4`);
      if (fs.existsSync(publicPath)) fs.unlinkSync(publicPath);
      if (fs.existsSync(distPath)) fs.unlinkSync(distPath);
      return res.json({ success: true, slot: slotNum });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Get current 3D graphics (slots 1 to 6)
  app.get('/api/get-3d-graphics', (req, res) => {
    const graphics: { slot: number; path: string }[] = [];
    const publicDir = path.join(process.cwd(), 'public/images/3d-graphics');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const files = fs.readdirSync(publicDir);
    for (let slot = 1; slot <= 6; slot++) {
      const found = files.find((f) => f.startsWith(`graphic-${slot}.`));
      if (found) {
        graphics.push({ slot, path: `/images/3d-graphics/${found}?t=${Date.now()}` });
      }
    }
    return res.json({ graphics });
  });

  // Upload 3D graphic image (slots 1 to 6)
  app.post('/api/upload-3d-graphic', (req, res) => {
    try {
      const { slot, dataUrl } = req.body;
      const slotNum = Number(slot);
      if (!slotNum || slotNum < 1 || slotNum > 6 || !dataUrl) {
        return res.status(400).json({ error: 'Invalid slot or missing dataUrl' });
      }

      const match = dataUrl.match(/^data:image\/(\w+);base64,/);
      const ext = match ? (match[1] === 'jpeg' ? 'jpg' : match[1]) : 'jpg';
      const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const publicDir = path.join(process.cwd(), 'public/images/3d-graphics');
      const distDir = path.join(process.cwd(), 'dist/images/3d-graphics');

      if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

      const fileName = `graphic-${slotNum}.${ext}`;
      fs.writeFileSync(path.join(publicDir, fileName), buffer);
      fs.writeFileSync(path.join(distDir, fileName), buffer);

      console.log(`[3D Graphic Upload] Saved slot ${slotNum} (${buffer.length} bytes) to ${fileName}`);

      return res.json({
        success: true,
        slot: slotNum,
        path: `/images/3d-graphics/${fileName}?t=${Date.now()}`,
        bytes: buffer.length,
      });
    } catch (err: any) {
      console.error('Error saving 3d graphic:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Delete 3D graphic
  app.post('/api/delete-3d-graphic', (req, res) => {
    try {
      const { slot } = req.body;
      const slotNum = Number(slot);
      const publicDir = path.join(process.cwd(), 'public/images/3d-graphics');
      const distDir = path.join(process.cwd(), 'dist/images/3d-graphics');
      ['png', 'jpg', 'jpeg', 'webp'].forEach((ext) => {
        const p1 = path.join(publicDir, `graphic-${slotNum}.${ext}`);
        const p2 = path.join(distDir, `graphic-${slotNum}.${ext}`);
        if (fs.existsSync(p1)) fs.unlinkSync(p1);
        if (fs.existsSync(p2)) fs.unlinkSync(p2);
      });
      return res.json({ success: true, slot: slotNum });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
