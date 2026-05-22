const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { poolPromise, sql } = require('../models/db');
require('dotenv').config();

passport.serializeUser((user, done) => {
    done(null, user.UserId);
});

passport.deserializeUser(async (id, done) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserId', sql.Int, id)
            .query('SELECT * FROM Users WHERE UserId = @UserId');
        done(null, result.recordset[0]);
    } catch (err) {
        done(err, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
    callbackURL: '/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
      try {
          const pool = await poolPromise;
          // Check if user already exists
          let result = await pool.request()
              .input('GoogleId', sql.NVarChar, profile.id)
              .query('SELECT * FROM Users WHERE GoogleId = @GoogleId');

          if (result.recordset.length > 0) {
              // Existing user
              return done(null, result.recordset[0]);
          }

          // Check if email already exists
          const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
          if (email) {
              let emailResult = await pool.request()
                  .input('Email', sql.NVarChar, email)
                  .query('SELECT * FROM Users WHERE Email = @Email');
              
              if (emailResult.recordset.length > 0) {
                  // Update Google ID for existing email
                  await pool.request()
                      .input('GoogleId', sql.NVarChar, profile.id)
                      .input('Email', sql.NVarChar, email)
                      .query('UPDATE Users SET GoogleId = @GoogleId WHERE Email = @Email');
                  return done(null, emailResult.recordset[0]);
              }
          }

          // Create new user
          const insertResult = await pool.request()
              .input('Username', sql.NVarChar, email || profile.id)
              .input('FullName', sql.NVarChar, profile.displayName)
              .input('Email', sql.NVarChar, email)
              .input('GoogleId', sql.NVarChar, profile.id)
              .input('Role', sql.NVarChar, 'User')
              .query(`
                  INSERT INTO Users (Username, FullName, Email, GoogleId, Role) 
                  OUTPUT INSERTED.* 
                  VALUES (@Username, @FullName, @Email, @GoogleId, @Role)
              `);
          
          return done(null, insertResult.recordset[0]);
      } catch (err) {
          return done(err, null);
      }
  }
));
