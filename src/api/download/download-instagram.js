const { gotScraping } = require('got-scraping');
const apiKeyMiddleware = require('../../middleware/apiKeyMiddleware');

module.exports = function(app) {
  app.get('/download/instagram', apiKeyMiddleware, async (req, res) => {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({ status: false, error: 'El parámetro ?url= es requerido' });
      }

      // Extraer shortcode del URL de Instagram
      const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
      if (!match) {
        return res.status(400).json({ status: false, error: 'URL de Instagram inválida. Usa links de posts, reels o TV.' });
      }

      const shortcode = match[1];

      // Usar API pública de Instagram
      const response = await gotScraping({
        url: `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'es-ES,es;q=0.9',
          'Referer': 'https://www.instagram.com/'
        }
      });

      const data = JSON.parse(response.body);
      const media = data?.items?.[0] || data?.graphql?.shortcode_media;

      if (!media) {
        // Fallback: usar servicio alternativo
        const fallback = await gotScraping({
          url: `https://imginn.com/p/${shortcode}/`,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        const body = fallback.body;
        const videoMatch = body.match(/href="(https:\/\/[^"]+\.mp4[^"]*)" download/);
        const imageMatch = body.match(/src="(https:\/\/[^"]+\.jpg[^"]*)"/);

        if (videoMatch) {
          return res.json({
            status: true,
            result: {
              type: 'video',
              url: videoMatch[1].replace(/&amp;/g, '&'),
              shortcode
            }
          });
        }

        if (imageMatch) {
          return res.json({
            status: true,
            result: {
              type: 'image',
              url: imageMatch[1].replace(/&amp;/g, '&'),
              shortcode
            }
          });
        }

        return res.status(404).json({ status: false, error: 'No se pudo obtener el contenido. El post puede ser privado.' });
      }

      // Procesar respuesta de Instagram
      const isVideo = media.media_type === 2 || media.is_video;

      if (isVideo) {
        const videoUrl = media.video_url || media.video_versions?.[0]?.url;
        return res.json({
          status: true,
          result: {
            type: 'video',
            url: videoUrl,
            thumbnail: media.thumbnail_url || media.image_versions2?.candidates?.[0]?.url,
            duration: media.video_duration,
            likes: media.like_count,
            shortcode
          }
        });
      } else {
        const imageUrl = media.image_versions2?.candidates?.[0]?.url
          || media.display_url;
        return res.json({
          status: true,
          result: {
            type: 'image',
            url: imageUrl,
            likes: media.like_count,
            shortcode
          }
        });
      }

    } catch(error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
};