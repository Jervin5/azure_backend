const sql = require('mssql');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const blacklistedTokens = new Set();

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  const token = authHeader && authHeader.split(' ')[1];
// console.log("token: ",token)
  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  if (blacklistedTokens.has(token)) {
    return res.status(401).json({ message: 'Token is blacklisted (logged out)' });
  }


  const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
      encrypt: true,
      trustServerCertificate: true
    }
  };

  try {
    const user = jwt.verify(token, JWT_SECRET);
    // console.log("user",user)

  //  console.log("user.UserName",user.username)

    if (!user.username) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }


    await sql.connect(config);
    const request = new sql.Request();
    request.input('username', sql.VarChar, user.username);
    const result = await request.query('SELECT Token FROM TokenStore WHERE UserName = @username');

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'No active session found' });
    }

    const storedToken = result.recordset[0].Token;
   
    if (storedToken !== token) {
      return res.status(401).json({ message: 'Session expired or logged in elsewhere' });
    }

    req.user = {     
      userrole:user.UserRole,
      username: user.UserName,
    };

    // console.log("req.user",req.user)

    next();

  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { authenticateToken, blacklistedTokens };
 