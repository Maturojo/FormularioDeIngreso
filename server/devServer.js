import { initDb } from './jsonDb.js';
import { createApp } from './createApp.js';

const app = createApp();
const PORT = Number(process.env.PORT || 4001);

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`API lista en http://localhost:${PORT}`);
  });
});
