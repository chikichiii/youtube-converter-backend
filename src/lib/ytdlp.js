const { YtDlp } = require('ytdlp-nodejs');
const path = require('path');
const fs = require('fs');

let ytdlpInstance = null;
let initializePromise = null;

// Define and export paths
const ytdlpPath = path.join(process.cwd(), 'node_modules', 'ytdlp-nodejs', 'bin', 'yt-dlp');
const ffmpegPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');


const initializeYtdlp = async () => {
  if (ytdlpInstance) {
    return;
  }
  if (!initializePromise) {
    initializePromise = (async () => {
      console.log('[ytdlp.js] Initializing YtDlp...');
      if (!fs.existsSync(ytdlpPath)) {
        throw new Error(`yt-dlp binary not found at ${ytdlpPath}`);
      }
      if (!fs.existsSync(ffmpegPath)) {
        throw new Error(`ffmpeg binary not found at ${ffmpegPath}`);
      }
      const ytdlp = new YtDlp({ ytdlpPath, ffmpegPath });
      await ytdlp.execAsync('', { printVersion: true });
      ytdlpInstance = ytdlp;
      console.log('[ytdlp.js] YtDlp initialized successfully.');
    })();
  }
  await initializePromise;
};

const getYtdlpInstance = () => {
  if (!ytdlpInstance) {
    throw new Error('YtDlp has not been initialized. Please call initializeYtdlp() on application startup.');
  }
  return ytdlpInstance;
};

module.exports = {
  initializeYtdlp,
  getYtdlpInstance,
  ytdlpPath, // Export the path
  ffmpegPath, // Export the path
};
