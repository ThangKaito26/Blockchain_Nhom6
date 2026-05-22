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

sql.connect(config)
    .then(async pool => {
        try {
            // Alter Users table
            await pool.request().query(`
                IF COL_LENGTH('Users', 'Email') IS NULL
                BEGIN
                    ALTER TABLE Users ADD Email NVARCHAR(100);
                    ALTER TABLE Users ADD GoogleId NVARCHAR(100);
                    ALTER TABLE Users ALTER COLUMN PasswordHash NVARCHAR(255) NULL;
                END
            `);
            
            // Create UserCertificates table
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserCertificates' and xtype='U')
                BEGIN
                    CREATE TABLE UserCertificates (
                        Id INT IDENTITY(1,1) PRIMARY KEY,
                        UserId INT NOT NULL,
                        CertCode NVARCHAR(50) NOT NULL,
                        AddedDate DATETIME DEFAULT GETDATE(),
                        FOREIGN KEY (UserId) REFERENCES Users(UserId)
                    )
                END
            `);
            console.log('Database updated successfully for User Login!');
            process.exit(0);
        } catch (err) {
            console.error('Migration error:', err);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('Connection failed:', err.message);
        process.exit(1);
    });
