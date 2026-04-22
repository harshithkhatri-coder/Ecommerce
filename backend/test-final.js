const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

console.log('=== MongoDB Atlas Connection Test ===\n');
console.log('URI:', MONGO_URI.replace(/:[^:@]+@/, ':****@'));

const hostname = MONGO_URI.split('@')[1].split('/')[0];
console.log('Hostname:', hostname);

const dns = require('dns');
dns.lookup(hostname, (dnsErr, address) => {
  if (dnsErr) {
    console.error('❌ DNS Error:', dnsErr.message);
    process.exit(1);
  }
  
  console.log('✅ DNS Resolved:', address);
  
  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
  })
    .then(async () => {
      console.log('\n✅ SUCCESS: MongoDB Connected!');
      console.log('   Database:', mongoose.connection.name);
      console.log('   Host:', mongoose.connection.host);
      console.log('\n✅ Backend ready at http://localhost:5000');
      console.log('   Run: cd backend && npm start');
      console.log('   Or: npm run dev (from project root)\n');
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Connection failed:', err.message);
      if (err.message.includes('whitelist') || err.message.includes('IP')) {
        console.error('\n📝 IP Whitelist Required:');
        console.error('   1. Atlas → Security → Network Access');
        console.error('   2. Add IP Address: 0.0.0.0/0');
        console.error('   3. Wait 30 seconds, retry\n');
      } else if (err.message.includes('auth')) {
        console.error('\n📝 Authentication failed - check username/password\n');
      }
      process.exit(1);
    });
});
