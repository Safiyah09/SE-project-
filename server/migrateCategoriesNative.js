const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const migrateCategories = async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    const db = client.db();
    console.log('Connected to db');
    
    const products = await db.collection('products').find({}).toArray();
    console.log(`Found ${products.length} products.`);

    let migratedCount = 0;
    
    for (const product of products) {
      if (typeof product.category === 'string' && product.category.length !== 24) {
        const categoryName = product.category;
        console.log(`Migrating ${product.productName} with category ${categoryName}`);
        
        let catDoc = await db.collection('categories').findOne({ name: categoryName });
        if (!catDoc) {
          const res = await db.collection('categories').insertOne({
            name: categoryName,
            description: 'Auto-migrated category',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          catDoc = { _id: res.insertedId, name: categoryName };
        }
        
        await db.collection('products').updateOne(
          { _id: product._id },
          { $set: { category: catDoc._id } }
        );
        migratedCount++;
      }
    }
    
    console.log(`Migrated ${migratedCount} products.`);
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
};

migrateCategories();
