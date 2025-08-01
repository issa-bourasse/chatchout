// Add this file to your server/api folder to override CORS for Vercel deployment

const express = require('express');
const cors = require('cors');
const app = require('../server'); // Import your main server app

// Special handling for OPTIONS requests (preflight)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Apply Vercel-specific CORS configuration
// This will override the CORS settings in your main server.js
app.use(cors({
  origin: '*', // For testing only, replace with specific domains after testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

module.exports = app;
