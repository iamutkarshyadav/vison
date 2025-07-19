import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupDatabase() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('payments');

    console.log('🧹 Cleaning up payment collection...');

    // Drop the old stripeSessionId index
    try {
      await collection.dropIndex('stripeSessionId_1');
      console.log('✅ Dropped stripeSessionId_1 index');
    } catch (error) {
      console.log('ℹ️  stripeSessionId_1 index not found or already dropped');
    }

    // Remove any payment records with stripeSessionId: null
    const result = await collection.deleteMany({ stripeSessionId: null });
    console.log(`✅ Removed ${result.deletedCount} payment records with stripeSessionId: null`);

    // Remove any payment records with stripeSessionId field (clean slate)
    const result2 = await collection.deleteMany({ stripeSessionId: { $exists: true } });
    console.log(`✅ Removed ${result2.deletedCount} payment records with stripeSessionId field`);

    console.log('🎉 Database cleanup completed!');
    console.log('💡 You can now restart your server and test payments.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

cleanupDatabase(); 