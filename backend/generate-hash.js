const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'password123';  // Change this to whatever you want
  const hash = await bcrypt.hash(password, 10);
  console.log('\n===========================================');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('===========================================\n');
  console.log('Copy this hash and update your SQL file!');
}

generateHash();
