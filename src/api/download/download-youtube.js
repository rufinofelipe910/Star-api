const { gotScraping } = require('got-scraping');
const yts = require('yt-search');
const apiKeyMiddleware = require('../../middleware/apiKeyMiddleware');

async function getYouTubeFormats(videoId) {
  // Primero obtener la página para extraer el visitor data
  const pageRes = await gotScraping({
    url: `https://www.youtube.com/watch?v=${videoId}`,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'es-ES,es;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  const html = pageRes.body;

  // Extraer ytInitialPlayerResponse directamente del HTML
  const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/);
  if (playerMatch) {
    try {
      return JSON.parse(playerMatch[1]);
    } catch(e) {}
  }

  // Extraer visitor data y API key
  const visitorMatch = html.match(/"visitorData":"([^"]+)"/);
  const visitorData = visitorMatch?.[1] || '';

  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  const apiKey = apiKeyMatch?.[1] || 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

  const clientVersionMatch = html.match(/"clientVersion":"([^"]+)"/);
  const clientVersion = clientVersionMatch?.[1] || '2.20231219.01.00';

  // Llamar al player API con datos reales extraídos
  const body = JSON.stringify({
    context: {
      client: {
        clientName: 'WEB',
        clientVersion,
        visitorData,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        hl: 'es',
        gl: 'ES'
      }
    },
    videoId,
    racyCheckOk: true,
    contentCheckOk: true
  });

  const response = await gotScraping({
    url: `https://www.youtube.com/youtubei/v1/player?key=${apiKey}`,
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'X-YouTube-Client-Name': '1',
      'X-YouTube-Client-Version': clientVersion,
      'Origin': 'https://www.youtube.com',
      'Referer': `https://www.youtube.com/watch?v=${videoId}`
    },
    timeout: { request: 20000 }
  });

  return JSON.parse(response.body);
}

module.exports = function(app) {
  app.get('/download/youtube', apiKeyMiddleware, async (req, res) => {
    try {
      const { url, type } = req.query;

      if (!url) {
        return res.status(400).json({ status: false, error: 'El parámetro ?url= es requerido' });
      }

      const videoIdMatch = url.match(/(?:v=|youtu\.be\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
      if (!videoIdMatch) {
        return res.status(400).json({ status: false, error: 'URL de YouTube inválida' });
      }

      const videoId = videoIdMatch[1];
      const isAudio = type === 'audio';

      const playerData = await getYouTubeFormats(videoId);

      if (!playerData?.streamingData) {
        return res.status(500).json({ 
          status: false, 
          error: playerData?.playabilityStatus?.reason || 'No se pudo obtener el video'
        });
      }

      const allFormats = [
        ...(playerData.streamingData?.formats || []),
        ...(playerData.streamingData?.adaptiveFormats || [])
      ].filter(f => f.url);

      let selectedFormat;

      if (isAudio) {
        const audioFormats = allFormats
          .filter(f => f.mimeType?.includes('audio'))
          .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        selectedFormat = audioFormats[0];
      } else {
        const videoFormats = allFormats
          .filter(f => f.mimeType?.includes('video/mp4') && f.audioQuality)
          .sort((a, b) => (b.height || 0) - (a.height || 0));
        selectedFormat = videoFormats[0] || allFormats.find(f => f.mimeType?.includes('video/mp4'));
      }

      if (!selectedFormat?.url) {
        return res.status(500).json({ status: false, error: 'No se encontró formato disponible' });
      }

      const videoDetails = playerData.videoDetails;
      const thumbnail = videoDetails?.thumbnail?.thumbnails?.at(-1)?.url
        || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

      res.json({
        status: true,
        result: {
          title: videoDetails?.title || 'Sin título',
          duration: parseInt(videoDetails?.lengthSeconds || 0),
          thumbnail,
          author: videoDetails?.author || 'Desconocido',
          views: videoDetails?.viewCount || 0,
          type: isAudio ? 'audio' : 'video',
          format: isAudio ? 'audio' : 'mp4',
          quality: selectedFormat.qualityLabel || (isAudio ? `${selectedFormat.bitrate}bps` : 'auto'),
          mimeType: selectedFormat.mimeType,
          url: selectedFormat.url,
          videoId
        }
      });

    } catch(error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
};