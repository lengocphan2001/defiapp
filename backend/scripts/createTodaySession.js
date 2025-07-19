const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../config.env' });

const createTodaySession = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'defiapp',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('🔗 Connected to database successfully');
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Check if session already exists for today
    const [existingSessions] = await connection.execute(
      'SELECT * FROM sessions WHERE session_date = ?',
      [today]
    );
    
    if (existingSessions.length > 0) {
      console.log('⚠️  Session for today already exists!');
      console.log('📋 Existing session details:');
      console.log(`   Date: ${existingSessions[0].session_date}`);
      console.log(`   Time: ${existingSessions[0].time_start}`);
      console.log(`   Status: ${existingSessions[0].status}`);
      console.log(`   Registration Fee: ${existingSessions[0].registration_fee} SMP`);
      return;
    }
    
    // Default values
    const defaultTime = '09:00:00';
    const defaultFee = 20000.00000000;
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const timeStart = args[0] || defaultTime;
    const registrationFee = args[1] || defaultFee;
    
    console.log('📋 Creating session with parameters:');
    console.log(`   Date: ${today}`);
    console.log(`   Time: ${timeStart}`);
    console.log(`   Registration Fee: ${registrationFee} SMP`);
    
    // Create the session
    const [result] = await connection.execute(
      'INSERT INTO sessions (session_date, time_start, status, registration_fee) VALUES (?, ?, "active", ?)',
      [today, timeStart, registrationFee]
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Session created successfully!');
      console.log(`   Session ID: ${result.insertId}`);
      console.log('\n💡 Users can now register for today\'s session!');
    } else {
      console.log('❌ Failed to create session');
    }
    
  } catch (error) {
    console.error('❌ Error creating session:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('\n🔌 Database connection closed');
  }
};

// Usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\n📖 Usage: node createTodaySession.js [time] [registration_fee]');
  console.log('\nParameters:');
  console.log('  time              Session start time (default: 09:00:00)');
  console.log('  registration_fee  Registration fee in SMP (default: 20000)');
  console.log('\nExamples:');
  console.log('  node createTodaySession.js');
  console.log('  node createTodaySession.js 14:30:00');
  console.log('  node createTodaySession.js 10:00:00 25000');
  console.log('\n⚠️  This script will not create a session if one already exists for today.');
  process.exit(0);
}

// Run the script
createTodaySession()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 