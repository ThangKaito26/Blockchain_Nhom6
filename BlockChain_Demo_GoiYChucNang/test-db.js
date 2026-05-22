const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    driver: 'ODBC Driver 17 for SQL Server',
    options: {
        trustedConnection: true,
        trustServerCertificate: true
    }
};

console.log("Testing Windows Auth Connection to:", config.server);

sql.connect(config)
    .then(pool => {
        console.log('Connected to SQL Server successfully using Windows Auth.');
        return pool.request().query('SELECT * FROM Users');
    })
    .then(result => {
        console.log('Users found:', result.recordset.length);
        console.log('Users:', result.recordset);
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection or Query failed:', err.message);
        process.exit(1);
    });
