# TO PUT WORD : AUDIO FILE  IN THE MONGODB 

from pymongo import MongoClient
from gridfs import GridFS
import os

# Connect to MongoDB
client = MongoClient("mongodb+srv://shivohum04:admin@cluster0.pox0lut.mongodb.net/")
db = client["audio"]
fs = GridFS(db)

# Define the word
word = "Blue"

# Upload the audio file
audio_file_path = "./audio/Blue.wav"
with open(audio_file_path, "rb") as audio_file:
    audio_file_id = fs.put(audio_file, filename="Blue.wav")

# Insert the word and the reference to the audio file in the collection
word_data = {
    "word": word,
    "audio_file_id": audio_file_id
}
word_collection = db["audio"]  # Replace with your collection name
word_collection.insert_one(word_data)

# Close the MongoDB connection
client.close()
