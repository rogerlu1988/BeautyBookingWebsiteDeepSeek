// test-db.js
const { MongoClient } = require('mongodb');
require('dotenv').config({ debug: true });

console.log("Environment Variables:");
console.log("MONGODB_URI:", process.env.MONGODB_URI); // Should match .env

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is undefined in environment variables");
    return;
  }
  
  const uri = process.env.MONGODB_URI;
  console.log("Using URI:", uri);
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("✅ Connected successfully to MongoDB Atlas");
    
    const db = client.db();
    console.log(`Database name: ${db.databaseName}`);
    
    const collections = await db.listCollections().toArray();
    if (collections.length === 0) {
      console.log("No collections found (database is empty)");
    } else {
      console.log("Collections:");
      collections.forEach(col => console.log(`- ${col.name}`));
    }
    
  } catch (e) {
    console.error("❌ Connection error", e);
  } finally {
    await client.close();
    console.log("Connection closed");
  }
}

main();