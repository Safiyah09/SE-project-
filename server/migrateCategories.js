const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');

dotenv.config();

const migrateCategories = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected.');

    // Find all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to check.`);

    let migratedCount = 0;

    for (const product of products) {
      // If product.category is a valid ObjectId, it might already be migrated
      // If it's a string like "Fruits", it will fail ObjectId cast if we don't migrate
      // Actually, we can check if it's a 24 character hex string.
      const isObjectId = mongoose.Types.ObjectId.isValid(product.category) && (String(product.category).length === 24);
      
      if (!isObjectId && typeof product.category === 'string') {
        const categoryName = product.category;
        console.log(`Migrating product ${product.productName} with category string: ${categoryName}`);
        
        let catDoc = await Category.findOne({ name: categoryName });
        if (!catDoc) {
          console.log(`Creating new category: ${categoryName}`);
          catDoc = await Category.create({ name: categoryName, description: 'Auto-migrated category' });
        }
        
        // Use db.collection update to bypass mongoose schema validation temporarily if it conflicts
        await mongoose.connection.collection('products').updateOne(
          { _id: product._id },
          { $set: { category: catDoc._id } }
        );
        migratedCount++;
      }
    }

    console.log(`Migration completed! Migrated ${migratedCount} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateCategories();
