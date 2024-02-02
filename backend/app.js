// app.js
require('dotenv').config();
const express = require('express');
const getAudioRouter = require('./getaudio'); // Make sure the path matches the location of your getAudio.js file

const app = express();
const port = process.env.PORT || 3000;

// Use the getAudioRouter for the /audio path
app.use('/audio', getAudioRouter);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
