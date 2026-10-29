require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const mongoose = require('mongoose');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const data = mongoose.mongo.BSON.EJSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  for (const name of ['products', 'categories', 'settings', 'currencies', 'posts']) {
    const collection = db.collection(name);
    if (await collection.countDocuments()) throw new Error(`${name} is not empty; import stopped`);
    if (data[name]?.length) await collection.insertMany(data[name]);
    console.log(`${name}: ${data[name]?.length || 0}`);
  }
  await mongoose.disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
