import { initDb } from './db.js';

initDb()
  .then(() => {
    console.log('Base de datos inicializada.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('No se pudo inicializar la base de datos.', error);
    process.exit(1);
  });
