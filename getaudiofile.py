from pymongo import MongoClient
from gridfs import GridFS

def get_audio_file(word):
    # Connect to MongoDB
    client = MongoClient("mongodb+srv://shivohum04:admin@cluster0.pox0lut.mongodb.net/")  # Use your connection string
    db = client["audio"]  # Use your database name
    fs = GridFS(db)

    word_collection = db["audio"]  # Replace with your collection name
    word_data = word_collection.find_one({"word": word})

    if word_data:
        audio_file_id = word_data["audio_file_id"]
        audio_file = fs.get(audio_file_id)

        output_file_path = f"./audio/{word}.wav"
        with open(output_file_path, "wb") as output_file:
            output_file.write(audio_file.read())

        return output_file_path
    else:
        print(f"No audio file found for the word: {word}")
        return None

    client.close()
