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

const correctHash = '$2b$10$b7HrVKEQqGGQj3CdXhlYJOtyibfYkcQPAI3eQ6qx9apqCDqO8WdAq';

sql.connect(config)
    .then(pool => {
        return pool.request()
            .input('Hash', sql.NVarChar, correctHash)
            .query("UPDATE Users SET PasswordHash = @Hash WHERE Username = 'admin'");
    })
    .then(result => {
        console.log('Password hash updated successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Update failed:', err.message);
        process.exit(1);
    });
