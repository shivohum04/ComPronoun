const express = require('express');
const multer = require('multer');
const azureStorage = require('azure-storage');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');


// File filter to accept only .m4a files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'audio/mp4' || file.mimetype === 'audio/x-m4a') {
    cb(null, true);
  } else {
    cb(new Error('Only .m4a files are allowed!'), false);
  }
};

// Custom storage configuration to specify file names and location
const storage = multer.diskStorage({
  destination: 'temp/', // Make sure this directory exists or is created on startup
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.m4a'); // Naming files with a unique suffix and .m4a extension
  }
});

// Apply the storage and file filter configuration to multer
const upload = multer({ storage: storage, fileFilter: fileFilter });

// Azure storage configuration
const blobService = azureStorage.createBlobService(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerName = process.env.AZURE_CONTAINER_NAME;

// Function to generate a SAS (Shared Access Signature) URL for a blob
const getSasUrl = (blobName) => {
  const startDate = new Date();
  const expiryDate = new Date(startDate);
  expiryDate.setMinutes(startDate.getMinutes() + 5); // SAS URL is valid for 5 minutes
  const sharedAccessPolicy = {
    AccessPolicy: {
      Permissions: azureStorage.BlobUtilities.SharedAccessPermissions.READ,
      Start: startDate,
      Expiry: expiryDate,
    },
  };

  const token = blobService.generateSharedAccessSignature(containerName, blobName, sharedAccessPolicy);
  return blobService.getUrl(containerName, blobName, token, true);
};

// Endpoint to save user audio
router.post('/upload', upload.single('audio'), async (req, res) => {
  console.log("Uploading");
  try {
    const tempPath = req.file.path;
    console.log("Got file in backend");
    console.log(`Received file: ${tempPath}`);
    res.json({ message: 'File uploaded successfully.', filePath: tempPath });
  } catch (error) {
    res.status(500).send(`Error uploading file: ${error}`);
  }
});

// Endpoint to get reference audio SAS URL
router.get('/reference', async (req, res) => {
  const { word } = req.query;
  const blobName = `${word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()}.mp3`; // Adjust for case-insensitivity

  blobService.doesBlobExist(containerName, blobName, (error, result) => {
    if (error) {
      return res.status(500).send('Error checking blob existence');
    }
    if (!result.exists) {
      return res.status(404).send('Audio file not found');
    }
    const audioUrl = getSasUrl(blobName);
    res.json({ audioUrl });
  });
});
router.post('/compare', upload.single('audio'), async (req, res) => {
  const userAudioPath = req.file.path; // Path to the uploaded user audio file
  const word = req.body.word; // Assuming the word or some identifier is sent along with the file
  
  // The reference audio path in the Azure blob
  const blobName = `${word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()}.mp3`;
  
  // Local directory and file path for the reference audio
  const referDir = path.join(__dirname, 'refer');
  const referenceAudioPath = path.join(referDir, blobName);

  // Ensure the 'refer' directory exists
  if (!fs.existsSync(referDir)){
    fs.mkdirSync(referDir, { recursive: true });
  }

  try {
    // Download the reference audio file from Azure Blob Storage
    await downloadBlobToLocal(blobService, containerName, blobName, referenceAudioPath);

    // Command to execute compare.py with the paths to the user and reference audio files
    const command = `python compare.py "${userAudioPath}" "${referenceAudioPath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).send({ error: `Error executing compare.py: ${stderr}` });
      }
      const similarityScore = parseFloat(stdout);
      res.send({ similarityScore });

      // Optionally, delete the downloaded reference audio file after comparison
      fs.unlink(referenceAudioPath, (err) => {
        if (err) console.error(`Error deleting reference audio file: ${err}`);
      });
    });
  } catch (error) {
    console.error(`Error downloading reference audio from Azure Blob Storage: ${error}`);
    return res.status(500).send('Error preparing audio comparison');
  }
});

module.exports = router;