import { precostingStore } from './precostingStore.js';
import { testConnection, pgPool } from './connection.js';
import { fileURLToPath } from 'url';

export const seedDatabase = async () => {
  const isConnected = await testConnection();
  if (!isConnected) {
    console.log('ℹ️  Skipping SQL seed: database not reachable.');
    return false;
  }

  try {
    console.log('🌱 Seeding sample precosting into PostgreSQL "PrecostingHeader"...');

    const sample = {
      PrecostingNo: 'CBD-2610-00005',
      ProdImage_base64: '',
      ProdName: 'Kemeja kotak',
      ProdQty: '1,000.00',
      Consume: '1.10',
      FabricPrice: '11000.00',
      TotalFabricPrice: '11000000.00',
      CMTPrice: '13930000.00',
      AccPrice: '180000.00',
      HPP: '25110.00',
      TaxPrice: '2640227.93',
      Fabrics: [
        {
          id: '8BHN000035',
          name: 'KAIN SCA 151 / NAVY',
          spec: '',
          part: '',
          consumption: 1100.00,
          unit: 'yd',
          unitPrice: 10000.00,
        },
      ],
      Accessories: [
        {
          id: '9ACC000001',
          name: 'INTERLINING 860 WH 40"',
          spec: '',
          qtyPerPcs: 1.00,
          unit: 'Yd',
          unitPrice: 0.00,
        },
        {
          id: '9ACC001058',
          name: 'MAIN LABEL SIZE S',
          spec: '',
          qtyPerPcs: 378.00,
          unit: 'PCS',
          unitPrice: 190.00,
        },
      ],
      Services: [
        {
          id: '10JAS000001',
          name: 'JASA CMT',
          category: 'Jasa',
          unitPrice: 38850.00,
        },
      ],
    };

    await precostingStore.create(sample);
    console.log('✅ [Database] Seed data berhasil di-populate ke PostgreSQL!');
    return true;
  } catch (error) {
    console.error('❌ [Database] Gagal melakukan seed:', error.message);
    return false;
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(async () => {
      await pgPool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pgPool.end();
      process.exit(1);
    });
}
