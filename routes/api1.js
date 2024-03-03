const express = require('express');
const router = express.Router();
const axios = require('axios');

// Route to handle user input and fetch summarized information from Wikipedia
router.post('/api1/search', async (req, res) => {
    try {
        const { query } = req.body;
        const options = {
            method: 'GET',
            url: 'https://wiki-briefs.p.rapidapi.com/search',
            params: {
                q: query,
                topk: '5'
            },
            headers: {
                'X-RapidAPI-Key': '9276b158d5msh54bc03810ac4a5fp1ff9dejsncc89434f6404',
                'X-RapidAPI-Host': 'wiki-briefs.p.rapidapi.com'
            }
        };

        const response = await axios.request(options);
        const summarizedInfo = response.data;
        res.render('api1', { summarizedInfo });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving summarized information from Wikipedia.');
    }
});

module.exports = router;
