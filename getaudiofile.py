from pymongo import MongoClient
from gridfs import GridFS
import os

def get_audio_file(word):
    # Connect to MongoDB
    client = MongoClient("mongodb+srv://shivohum04:admin@cluster0.pox0lut.mongodb.net/")  # Use your connection string
    db = client["audio"]  # Use your database name
    fs = GridFS(db)

    # Fetch the word data
    word_collection = db["audio"]  # Replace with your collection name
    word_data = word_collection.find_one({"word": word})

    if word_data:
        # Retrieve the audio file using the file ID
        audio_file_id = word_data["audio_file_id"]
        audio_file = fs.get(audio_file_id)

        # Save the audio file locally
        output_file_path = f"./audio/{word}.wav"
        with open(output_file_path, "wb") as output_file:
            output_file.write(audio_file.read())

        print(f"Audio file for '{word}' has been saved to '{output_file_path}'")
    else:
        print(f"No audio file found for the word: {word}")

    # Close the MongoDB connection
    client.close()

# Example usage
word_to_search = input("Enter a word to fetch its audio file: ")
get_audio_file(word_to_search)
from pymongo import MongoClient
from gridfs import GridFS
import os

def get_audio_file(word):
    # Connect to MongoDB
    client = MongoClient("your_mongodb_connection_string")  # Use your connection string
    db = client["audio"]  # Use your database name
    fs = GridFS(db)

    # Fetch the word data
    word_collection = db["audio"]  # Replace with your collection name
    word_data = word_collection.find_one({"word": word})

    if word_data:
        # Retrieve the audio file using the file ID
        audio_file_id = word_data["audio_file_id"]
        audio_file = fs.get(audio_file_id)

        # Save the audio file locally
        output_file_path = f"./audio/{word}.wav"
        with open(output_file_path, "wb") as output_file:
            output_file.write(audio_file.read())

        print(f"Audio file for '{word}' has been saved to '{output_file_path}'")
    else:
        print(f"No audio file found for the word: {word}")

    # Close the MongoDB connection
    client.close()

# Example usage
word_to_search = input("Enter a word to fetch its audio file: ")
get_audio_file(word_to_search)
