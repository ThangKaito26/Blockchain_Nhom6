const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('admin123', 10);
console.log("CORRECT HASH:", hash);
