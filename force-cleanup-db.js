import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function forceCleanupDatabase() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    console.log('📋 Database name:', db.databaseName);
    
    // Check if payments collection exists
    const collections = await db.listCollections().toArray();
    const paymentCollectionExists = collections.some(col => col.name === 'payments');
    
    if (!paymentCollectionExists) {
      console.log('ℹ️  Payments collection does not exist - nothing to clean up');
      return;
    }

    const collection = db.collection('payments');

    console.log('🧹 Force cleaning up payment collection...');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:', indexes.map(idx => idx.name));

    // Force drop the stripeSessionId index if it exists
    try {
      await collection.dropIndex('stripeSessionId_1');
      console.log('✅ Dropped stripeSessionId_1 index');
    } catch (error) {
      console.log('ℹ️  stripeSessionId_1 index not found or already dropped');
    }

    // Try alternative index names
    try {
      await collection.dropIndex('stripeSessionId');
      console.log('✅ Dropped stripeSessionId index');
    } catch (error) {
      console.log('ℹ️  stripeSessionId index not found');
    }

    // Remove ALL payment records to start fresh
    const result = await collection.deleteMany({});
    console.log(`✅ Removed ${result.deletedCount} payment records (clean slate)`);

    // Recreate the collection with proper indexes
    await collection.createIndex({ user: 1, createdAt: -1 });
    console.log('✅ Recreated user index');

    console.log('🎉 Force cleanup completed!');
    console.log('💡 You can now restart your server and test payments.');

  } catch (error) {
    console.error('❌ Force cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

forceCleanupDatabase(); 