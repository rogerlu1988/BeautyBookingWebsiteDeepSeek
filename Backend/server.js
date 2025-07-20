const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Database connection
let db;
async function connectDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db();
  console.log('✅ MongoDB connected');
}

// Routes
app.get('/', (req, res) => {
  res.send('Beauty Booking API is running!');
});

// User creation endpoint
app.post('/users', async (req, res) => {
  try {
    const user = req.body;
    
    // Basic validation
    if (!user.name || !user.email) {
      return res.status(400).json({ error: "Name and email are required" });
    }
    
    // Insert into users collection
    const result = await db.collection('users').insertOne(user);
    
    res.status(201).json({
      message: "User created successfully",
      userId: result.insertedId
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET ALL USERS ENDPOINT - MAKE SURE THIS EXISTS
app.get('/users', async (req, res) => {
  try {
    const users = await db.collection('users').find().toArray();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET SINGLE USER BY ID ENDPOINT - MAKE SURE THIS EXISTS
app.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(port, async () => {
  await connectDB();
  console.log(`Server running on port ${port}`);
});