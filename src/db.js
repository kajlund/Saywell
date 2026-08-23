import mongoose from 'mongoose';

const connectDB = async (mongoUri, logger) => {
  try {
    const clientOptions = { serverApi: { version: '1', strict: false, deprecationErrors: true } };
    const conn = await mongoose.connect(mongoUri, clientOptions);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
