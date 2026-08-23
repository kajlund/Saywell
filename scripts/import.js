import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import 'dotenv/config';
import mongoose from 'mongoose';

import connectDB from '../src/db.js';
import { getConfig } from '../src/config.js';
import { getLogger } from '../src/logger.js';
import Proverb from '../src/models/proverb.js';

const config = await getConfig();
const logger = getLogger(config);
const DEV_USER_ID = new mongoose.Types.ObjectId('6a429a49d33d3ca603ded5d9');

async function addProverbs(proverbs) {
  for (const proverbData of proverbs) {
    try {
      const proverb = new Proverb({ userId: DEV_USER_ID, ...proverbData });
      await proverb.save();
    } catch (err) {
      logger.error(`Failed to import proverb: ${proverbData.title}. Error: ${err.message}`);
    }
  }
}

try {
  const data = readFileSync(
    join(process.cwd(), 'data/proverbdata.json'),
    'utf-8',
  );

  await connectDB(config.mongoUri, logger);

  const proverbs = JSON.parse(data);
  await addProverbs(proverbs);
  logger.info(`${proverbs.length} proverbs imported`);
  await mongoose.connection.close();
  logger.info('Proverbs imported!');
} catch (err) {
  logger.error(err, 'Import failed!');
  throw err;
}