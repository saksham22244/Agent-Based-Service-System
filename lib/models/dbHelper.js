import clientPromise from '../mongodb';

const DB_NAME = process.env.MONGODB_DB_NAME || 'finalyearproject';

export async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}
