const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const createTestSessions = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Creating test sessions...');

    // Get today's date and next few days
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const sessions = [
      {
        session_date: today.toISOString().split('T')[0],
        time_start: '09:00:00',
        status: 'active',
        registration_fee: 20000
      },
      {
        session_date: tomorrow.toISOString().split('T')[0],
        time_start: '14:00:00',
        status: 'active',
        registration_fee: 25000
      },
      {
        session_date: dayAfterTomorrow.toISOString().split('T')[0],
        time_start: '10:30:00',
        status: 'active',
        registration_fee: 30000
      }
    ];

    for (const session of sessions) {
      // Check if session already exists
      const [existing] = await connection.execute(
        'SELECT id FROM sessions WHERE session_date = ?',
        [session.session_date]
      );

      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO sessions (session_date, time_start, status, registration_fee) VALUES (?, ?, ?, ?)',
          [session.session_date, session.time_start, session.status, session.registration_fee]
        );
        console.log(`Created session for ${session.session_date} at ${session.time_start}`);
      } else {
        console.log(`Session for ${session.session_date} already exists`);
      }
    }

    console.log('Test sessions created successfully!');
  } catch (error) {
    console.error('Error creating test sessions:', error);
  } finally {
    await connection.end();
  }
};

createTestSessions(); 