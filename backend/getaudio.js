require('dotenv').config();
const express = require('express');
const router = express.Router();
const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');
const { BlobServiceClient } = require('@azure/storage-blob');

const azureStorageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_CONTAINER_NAME;

// Ensure the temp directory exists
const tempDir = './temp';
if (!fs.existsSync(tempDir)){
    fs.mkdirSync(tempDir);
}

router.get('/:wordName', async (req, res) => {
    const wordName = req.params.wordName;
    const blobServiceClient = BlobServiceClient.fromConnectionString(azureStorageConnectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    try {
        const blobName = `${wordName}.mp3`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        if (!(await blockBlobClient.exists())) {
            return res.status(404).send('Reference audio file not found.');
        }

        const downloadFilePath = `${tempDir}/${wordName}.mp3`;

        // Download the blob to a temporary file
        const downloadBlockBlobResponse = await blockBlobClient.downloadToFile(downloadFilePath);
        
        console.log(`Downloaded blob to ${downloadFilePath}`);

        // Path to the user's audio file for testing (MANUAL FOR NOW)
        const userAudioFilePath = '../audio/Blue.wav';

        // Construct the command to call the Python script
        const pythonCommand = `python3 ../ml/compare.py "${userAudioFilePath}" "${downloadFilePath}"`;

        exec(pythonCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).send('Error comparing pronunciations.');
            }
            console.log(`stdout: ${stdout}`);
            res.send({ comparisonResult: stdout });
            
            // Clean up: delete the downloaded reference file
            fs.unlink(downloadFilePath, (err) => {
                if (err) throw err;
                console.log('Temporarily downloaded reference audio file deleted.');
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing request.');
    }
});

module.exports = router;
