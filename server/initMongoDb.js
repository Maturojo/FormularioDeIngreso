import { initDb } from './mongoDb.js';

initDb()
  .then(() => {
    console.log('Base de datos MongoDB inicializada.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('No se pudo inicializar MongoDB.', error);
    process.exit(1);
  });
