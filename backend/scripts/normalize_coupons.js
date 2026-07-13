const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce";

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const Coupon = mongoose.model('Coupon', new mongoose.Schema({}, { strict: false }), 'coupons');

  // Normalize codes to uppercase and trim
  const res = await Coupon.updateMany({}, [
    { $set: { code: { $toUpper: { $trim: { input: "$code" } } } } }
  ]);

  console.log('Updated documents:', res.modifiedCount || res.nModified || res.modifiedCount === 0 ? res.modifiedCount : res.n);

  // ensure index
  try {
    await Coupon.collection.createIndex({ code: 1 }, { unique: true });
    console.log('Ensured index on code');
  } catch (e) {
    console.error('Index creation error (may already exist):', e.message);
  }

  await mongoose.disconnect();
  console.log('Done');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
