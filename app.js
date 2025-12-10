require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const sql = require('mssql'); // Import the SQL package
const app = express();

// ------------------------------
// CORS Configuration
// ------------------------------

// Allowed origins for CORS
const allowedOrigins = [
  'http://172.23.0.141:5173',  // Your local frontend
  'https://node-application.azurewebsites.net' // Future hosted frontend
];

// CORS Middleware
app.use(cors({
  origin: allowedOrigins,  // Dynamically use allowedOrigins array
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // Allow credentials like cookies or JWT tokens
  optionsSuccessStatus: 200  // Success status for preflight responses
}));

// ------------------------------
// Parse JSON
// ------------------------------
app.use(express.json()); // Parse incoming requests with JSON payloads

// ------------------------------
// SQL Database Configuration
// ------------------------------
// Configure the SQL server connection settings (Replace these with your actual credentials)
const config = {
  user: process.env.DB_USER,  // SQL Server username from .env
  password: process.env.DB_PASSWORD,  // SQL Server password from .env
  server: process.env.DB_SERVER,  // SQL Server address (e.g., localhost or Azure server)
  database: process.env.DB_DATABASE,  // Database name
  options: {
    encrypt: true, // Use encryption (recommended for Azure)
    trustServerCertificate: true, // Trust the certificate (only if you are using self-signed certificates)
  }
};

// ------------------------------
// Routes and Logic
// ------------------------------
app.get("/",(req,res)=>{
  res.status(200).json({
      message: 'Welcome.',
    });
})
app.get('/login', async (req, res) => {
  const { username, password } = req.body;  // Get the username and password from the request body

  // Basic validation for missing username or password
  if (!username || !password) {
    return res.status(400).json({
      message: 'Username and password are required.',
    });
  }

  try {
    // Connect to the SQL Server
    await sql.connect(config);

    const request = new sql.Request();
    request.input('Username', sql.VarChar, username);  // Prepare the SQL query parameter

    // Query the database for the user with the given username
    const result = await request.query('SELECT * FROM [dbo].[Login] WHERE Username = @Username');

    const user = result.recordset[0];  // Get the first user from the result

    // If the user is not found, return a 404 error
    if (!user) {
      return res.status(404).json({
        message: 'Invalid username or password.',
      });
    }

    // Here you could add password verification logic (e.g., bcrypt.compare)
    // For now, we'll assume the password is valid if the user is found.

    // Successful login - issue JWT token
    const payload = {
      username: user.Username,  // Add any other user info you'd like in the token
    };

    // Create a JWT token with the payload and secret
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send the response with the user details and the token
    res.status(200).json({
      user: payload,
      token,
    });

  } catch (err) {
    console.error('Login error:', err);  // Log the error to the console
    res.status(500).json({
      message: 'Internal server error during login.',
    });
  }
});

// ------------------------------
// Start server
// ------------------------------
const port = process.env.PORT || 8081;  // Port from environment variables or fallback to 8081
app.listen(port, () => {
  console.log(`Server running on port ${port}`);  // Log that the server is running
});
