const bcrypt = require('bcryptjs');

async function generateHashes() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('\n===========================================');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('===========================================\n');
  console.log('Update your database with this SQL:');
  console.log(`
UPDATE Users 
SET password_hash = '${hash}'
WHERE email IN (
  'john.doe@email.com',
  'sarah.smith@email.com',
  'ahmed.hassan@email.com',
  'fatma.ali@email.com',
  'mike.johnson@email.com',
  'pizza.owner@email.com',
  'burger.owner@email.com',
  'sushi.owner@email.com',
  'shawarma.owner@email.com',
  'pasta.owner@email.com',
  'driver1@email.com',
  'driver2@email.com',
  'driver3@email.com',
  'admin@foodease.com'
);
  `);
}

generateHashes();
