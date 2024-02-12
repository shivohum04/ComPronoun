// app.js
require('dotenv').config();
const express = require('express');
const getAudioRouter = require('./getaudio'); // Make sure the path matches the location of your getAudio.js file

const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');

// Use the getAudioRouter for the /audio path
app.use('/audio', getAudioRouter);
app.use(cors()); // Enable CORS for all requests


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
