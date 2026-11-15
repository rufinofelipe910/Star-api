const axios = require('axios');

module.exports = function(app) {
  app.get('/search/apk', async (req, res) => {
    try {
      const { query } = req.query;
      if (!query) return res.status(400).json({ status: false, error: 'Query is required' });
      const { data } = await axios.get('https://rest.alyabotpe.xyz/search/apk', {
        params: { query, key: 'stellar-GWS5mKiT' }
      });
      res.status(200).json({ status: true, result: data.data });
    } catch (error) {
      res.status(500).json({ status: false, error: error.message });
    }
  });
};