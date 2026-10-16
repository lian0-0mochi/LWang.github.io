import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function localCmsPlugin() {
  return {
    name: 'local-cms-saver',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if ((req.url === '/api/cms-save' || req.url === '/__api/save-content') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const root = process.cwd();
              const saved = [];

              if (data.site) {
                await writeFile(join(root, 'src/content/site.json'), JSON.stringify(data.site, null, 2) + '\n');
                saved.push('src/content/site.json');
              }
              if (data.science) {
                await writeFile(join(root, 'src/content/science.json'), JSON.stringify(data.science, null, 2) + '\n');
                saved.push('src/content/science.json');
              }
              if (data.music) {
                await writeFile(join(root, 'src/content/music.json'), JSON.stringify(data.music, null, 2) + '\n');
                saved.push('src/content/music.json');
              }
              if (data.hobbies) {
                await writeFile(join(root, 'src/content/hobbies.json'), JSON.stringify(data.hobbies, null, 2) + '\n');
                saved.push('src/content/hobbies.json');
              }
              if (data.videos) {
                await writeFile(join(root, 'src/videos.json'), JSON.stringify(data.videos, null, 2) + '\n');
                saved.push('src/videos.json');
              }
              if (data.media) {
                await writeFile(join(root, 'src/media.generated.json'), JSON.stringify(data.media, null, 2) + '\n');
                saved.push('src/media.generated.json');
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true, saved, timestamp: new Date().toISOString() }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: err.message }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: '/LWang.github.io/',
  plugins: [react(), localCmsPlugin()],
  server: {
    host: true,
    port: 5173,
  },
});
