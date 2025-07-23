const cron = require('node-cron');
const Session = require('../models/Session');

class SessionScheduler {
  constructor() {
    this.scheduler = null;
  }

  // Start the scheduler
  start() {
    console.log('🕐 Starting session scheduler...');
    
    // Schedule task to run every 5 minutes
    // This ensures sessions are created quickly if missing
    this.scheduler = cron.schedule('*/5 * * * *', async () => {
      console.log('📅 Running session check task...');
      await this.createNextDaysSessions();
    }, {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh" // Vietnam timezone
    });

    console.log('✅ Session scheduler started successfully (runs every 5 minutes)');
  }

  // Stop the scheduler
  stop() {
    if (this.scheduler) {
      this.scheduler.stop();
      console.log('⏹️ Session scheduler stopped');
    }
  }

  // Check and create sessions for next 4 days if needed
  async createNextDaysSessions() {
    try {
      console.log('🔍 Checking if sessions need to be created...');
      
      // Get daily settings
      const settings = await Session.getDailySessionSettings();
      
      if (!settings) {
        console.log('⚠️ No daily session settings found. Skipping session creation.');
        return;
      }

      if (!settings.is_active) {
        console.log('⚠️ Automatic session creation is disabled. Skipping session creation.');
        return;
      }

      // Check existing sessions for next 4 days
      const today = new Date();
      let sessionsNeeded = 0;
      let sessionsCreated = 0;

      for (let i = 0; i < 4; i++) {
        const sessionDate = new Date(today);
        sessionDate.setDate(today.getDate() + i);
        const dateString = sessionDate.toISOString().split('T')[0];
        
        // Check if session for this date already exists
        const [existingSessions] = await require('../config/database').pool.execute(
          'SELECT * FROM sessions WHERE session_date = ?',
          [dateString]
        );
        
        if (existingSessions.length === 0) {
          sessionsNeeded++;
          // Create session for this date
          await require('../config/database').pool.execute(
            'INSERT INTO sessions (session_date, time_start, status, registration_fee) VALUES (?, ?, "active", ?)',
            [dateString, settings.time_start, settings.registration_fee]
          );
          sessionsCreated++;
          console.log(`✅ Created session for ${dateString}`);
        } else {
          console.log(`ℹ️ Session already exists for ${dateString}`);
        }
      }

      if (sessionsNeeded === 0) {
        console.log('✅ All sessions for next 4 days already exist. No action needed.');
      } else {
        console.log(`✅ Created ${sessionsCreated} new sessions for next 4 days (start time: ${settings.time_start})`);
      }
      
      // Log the total upcoming sessions
      const upcomingSessions = await Session.getUpcomingSessions();
      console.log(`📊 Total upcoming sessions: ${upcomingSessions.length}`);
      
    } catch (error) {
      console.error('❌ Error checking/creating sessions:', error.message);
    }
  }

  // Manual trigger for testing
  async triggerNow() {
    console.log('🔧 Manually triggering session creation...');
    await this.createNextDaysSessions();
  }
}

module.exports = new SessionScheduler(); 