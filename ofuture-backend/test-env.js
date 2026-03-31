#!/usr/bin/env node

// Test script to check if .env is loaded correctly
require('dotenv').config({ path: '.env' });

console.log('=== Environment Check ===');
console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET value:', process.env.JWT_SECRET ? 'SET' : 'UNDEFINED');
console.log('DB_HOST:', process.env.DB_HOST || 'UNDEFINED');
console.log('DB_NAME:', process.env.DB_NAME || 'UNDEFINED');
console.log('Current working directory:', process.cwd());
console.log('=== End Check ===');