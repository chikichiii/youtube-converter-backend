
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { EventEmitter } from 'events';

const settingsFile = path.join(os.tmpdir(), 'youtube-converter-settings.json');

export interface AppSettings {
  isDownloadsDisabled: boolean;
}

class SettingsManager extends EventEmitter {
  private settings: AppSettings = {
    isDownloadsDisabled: false,
  };
  private isSaving = false;

  constructor() {
    super();
    this.loadSettings();
  }

  private async saveSettings() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      await fs.writeJson(settingsFile, this.settings, { spaces: 2 });
      console.log('Settings saved successfully to:', settingsFile);
      this.emit('settingsChanged', this.settings);
    } catch (error) {
      console.error('Failed to save settings to', settingsFile, ':', error);
    } finally {
      this.isSaving = false;
    }
  }

  private async loadSettings() {
    try {
      if (await fs.pathExists(settingsFile)) {
        const loadedSettings = await fs.readJson(settingsFile);
        // Merge loaded settings with defaults to ensure all keys are present
        this.settings = { ...this.settings, ...loadedSettings };
        console.log('Settings loaded successfully from:', settingsFile);
      } else {
        // If no settings file exists, save the default settings
        await this.saveSettings();
      }
    } catch (error) {
      console.error('Failed to load settings from', settingsFile, ':', error);
    }
  }

  getSettings(): AppSettings {
    return this.settings;
  }

  async updateSettings(newSettings: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    return this.settings;
  }
}

export const settingsManager = new SettingsManager();
