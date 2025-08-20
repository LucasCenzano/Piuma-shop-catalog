// seed.js
import 'dotenv/config';
import { Client } from 'pg';
import bags from './src/data.js';

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Conectado a la base Neon.');

  for (const bag of bags) {
    const numericPrice = parseFloat(bag.price.replace(/[^\d.-]/g, '')) || 0;
    const images = bag.imagesUrl.map(img => img.toString());
    await client.query(
      `INSERT INTO products (id, name, price, images, category, inStock)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [bag.id, bag.name, numericPrice, JSON.stringify(images), bag.category, bag.inStock]
    );
    console.log(`Insertado: ${bag.name}`);
  }

  await client.end();
  console.log('Conexión finalizada, productos cargados.');
}

seed().catch(err => console.error('Error en seed:', err));
