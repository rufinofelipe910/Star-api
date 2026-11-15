const { gotScraping } = require('got-scraping');
const cheerio = require('cheerio');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36';

module.exports = function(app) {
  app.get('/download/mediafire', async (req, res) => {
    try {
      const { url } = req.query;
      if (!url) return res.status(400).json({ status: false, error: 'URL is required' });

      const r = await gotScraping({
        url,
        headers: { 'User-Agent': UA, Accept: 'text/html' }
      });

      const $ = cheerio.load(r.body);
      const dl = $('#downloadButton').attr('href') ||
                 $('a.popsok').attr('href') ||
                 $('a[aria-label="Download file"]').attr('href');

      if (!dl) return res.status(404).json({ status: false, error: 'No se encontró link de descarga' });

      const name = decodeURIComponent(dl.split('/').pop());

      res.status(200).json({
        status: true,
        result: {
          filename: name,
          download_url: dl
        }
      });

    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
};