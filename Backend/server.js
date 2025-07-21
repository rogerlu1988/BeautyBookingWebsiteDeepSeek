const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parse JSON bodies
app.use(express.json());

// Database connection setup
let db;
async function connectDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1); // Exit if DB connection fails
  }
}

// Authorization Middleware
const authenticate = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token using JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to request object
    next(); // Proceed to next middleware/route
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// ===== Routes ===== //

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = {
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      createdAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    
    // Create JWT token
    const token = jwt.sign(
      { userId: result.insertedId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



apiRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await db.collection('users').findOne({ email });
    
    // Validate credentials
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );
    
    res.json({ 
      message: "Login successful",
      token,
      userId: user._id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Beauty Booking API is running!');
});

// Get all users (Protected)
app.get('/users', authenticate, async (req, res) => {
  try {
    // Get users but exclude passwords
    const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single user by ID (Protected)
app.get('/users/:id', authenticate, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Validate ID format
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    
    // Find user but exclude password
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create appointment (Protected)
app.post('/appointments', authenticate, async (req, res) => {
  try {
    const { service, date, notes } = req.body;
    const userId = req.user.userId; // From authenticated user
    
    // Validation
    if (!service || !date) {
      return res.status(400).json({ error: "Service and date are required" });
    }
    
    // Create appointment object
    const newAppointment = {
      userId: new ObjectId(userId),
      service,
      date: new Date(date),
      notes: notes || '',
      status: 'booked',
      createdAt: new Date()
    };
    
    const result = await db.collection('appointments').insertOne(newAppointment);
    
    res.status(201).json({
      message: "Appointment created successfully",
      appointmentId: result.insertedId
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get appointments for current user (Protected)
app.get('/appointments', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId; // From authenticated user
    
    const appointments = await db.collection('appointments')
      .find({ userId: new ObjectId(userId) })
      .sort({ date: 1 }) // Sort by date ascending
      .toArray();
    
    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Error handling middleware - Must be last!
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 Handler - Must be last route!
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(port, async () => {
  try {
    await connectDB();
    console.log(`Server running on port ${port}`);
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  }
});