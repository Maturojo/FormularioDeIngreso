import { initDb } from './mongoDb.js';
import { createMongoApp } from './createMongoApp.js';

const app = createMongoApp();
const PORT = Number(process.env.PORT || 4001);

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`API lista en http://localhost:${PORT}`);
  });
});
