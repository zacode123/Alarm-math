import { type Alarm, type InsertAlarm, type Audio, type InsertAudio } from "@shared/schema";
import { supabase } from "./db";

export interface IStorage {
  getAlarms(): Promise<Alarm[]>;
  createAlarm(alarm: InsertAlarm): Promise<Alarm>;
  updateAlarm(id: number, alarm: Partial<InsertAlarm>): Promise<Alarm>;
  deleteAlarm(id: number): Promise<void>;
  // Audio related methods
  getAudioFiles(): Promise<Audio[]>;
  getAudioFile(id: number): Promise<Audio | undefined>;
  createAudioFile(audio: InsertAudio): Promise<Audio>;
  updateAudioFile(id: number, updates: Partial<InsertAudio>): Promise<Audio>;
  deleteAudioFile(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAlarms(): Promise<Alarm[]> {
    const { data, error } = await supabase
      .from('alarms')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching alarms:', error);
      return [];
    }
    
    return data || [];
  }

  async createAlarm(insertAlarm: InsertAlarm): Promise<Alarm> {
    const { data, error } = await supabase
      .from('alarms')
      .insert({
        ...insertAlarm,
        created: Math.floor(Date.now() / 1000)
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating alarm:', error);
      throw new Error("Failed to create alarm");
    }
    
    return data;
  }

  async updateAlarm(id: number, updates: Partial<InsertAlarm>): Promise<Alarm> {
    const { data, error } = await supabase
      .from('alarms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating alarm:', error);
      throw new Error("Alarm not found");
    }

    return data;
  }

  async deleteAlarm(id: number): Promise<void> {
    const { error } = await supabase
      .from('alarms')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting alarm:', error);
      throw new Error("Alarm not found");
    }
  }

  // Audio file methods
  async getAudioFiles(): Promise<Audio[]> {
    const { data, error } = await supabase
      .from('audio_files')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      console.error('Error fetching audio files:', error);
      return [];
    }
    
    return data || [];
  }

  async getAudioFile(id: number): Promise<Audio | undefined> {
    const { data, error } = await supabase
      .from('audio_files')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching audio file:', error);
      return undefined;
    }
    
    return data;
  }

  async createAudioFile(insertAudio: InsertAudio): Promise<Audio> {
    const { data, error } = await supabase
      .from('audio_files')
      .insert({
        ...insertAudio,
        created: Math.floor(Date.now() / 1000)
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating audio file:', error);
      throw new Error("Failed to create audio file");
    }
    
    return data;
  }

  async updateAudioFile(id: number, updates: Partial<InsertAudio>): Promise<Audio> {
    const { data, error } = await supabase
      .from('audio_files')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating audio file:', error);
      throw new Error("Audio file not found");
    }

    return data;
  }

  async deleteAudioFile(id: number): Promise<void> {
    const { error } = await supabase
      .from('audio_files')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting audio file:', error);
      throw new Error("Audio file not found");
    }
  }
}

export const storage = new DatabaseStorage();