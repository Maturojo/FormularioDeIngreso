import { MongoClient, ServerApiVersion } from 'mongodb';

let clientPromise;
let initPromise;

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }

  return value;
}

function getClient() {
  if (!clientPromise) {
    const uri = getRequiredEnv('MONGODB_URI');
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    });

    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getDb() {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB_NAME?.trim() || 'formulario_de_ingreso');
}

export async function initDb() {
  const db = await getDb();

  if (!initPromise) {
    initPromise = Promise.all([
      db.collection('leads').createIndex({ email: 1 }, { unique: true }),
      db.collection('coupons').createIndex({ code: 1 }, { unique: true }),
      db.collection('coupons').createIndex({ leadId: 1 }, { unique: true }),
      db.collection('coupons').createIndex({ status: 1, createdAt: -1 })
    ]);
  }

  await initPromise;
  return db;
}
