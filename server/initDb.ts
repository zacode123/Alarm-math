import { supabase, testConnection } from "./db";

export async function initDb() {
  try {
    console.log('Starting database initialization...');
    
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      console.log('Please add your SUPABASE_KEY to connect to Supabase');
      throw new Error('Database connection failed');
    }

    // For Supabase, tables can be created via dashboard or SQL Editor
    // Let's test if tables exist by trying to read from them
    try {
      await supabase.from('alarms').select('count', { count: 'exact', head: true });
      console.log('Alarms table verified');
    } catch (error) {
      console.log('Create "alarms" table in Supabase dashboard with the schema from shared/schema.ts');
    }

    try {
      await supabase.from('audio_files').select('count', { count: 'exact', head: true });
      console.log('Audio files table verified');
    } catch (error) {
      console.log('Create "audio_files" table in Supabase dashboard with the schema from shared/schema.ts');
    }

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
}