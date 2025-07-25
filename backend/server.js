const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const testRoutes = require('./routes/tests');

// const questionRoutes = require('./routes/questions');

// ✅ Middleware (correct order)
app.use(cors());
app.use(express.json()); // ✅ This parses JSON bodies (not body-parser)

// ✅ Routes
app.use('/auth', authRoutes);


// Test Route
app.get('/', (req, res) => {
  res.send('Backend running');
});
app.use('/api/tests', testRoutes);
// app.use('/api/questions', questionRoutes);
// app.use('/api/answers', require('./routes/answers'));


app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
