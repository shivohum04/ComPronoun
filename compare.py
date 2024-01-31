import librosa
import numpy as np
from fastdtw import fastdtw
from scipy.spatial.distance import euclidean
from getaudiofile import get_audio_file  # Import the function from get_audio_file.py

def load_and_extract_features(file_path):
    y, sr = librosa.load(file_path)
    mfcc = librosa.feature.mfcc(y=y, sr=sr)
    return mfcc

def compare_pronunciations(file_path1, file_path2):
    mfcc1 = load_and_extract_features(file_path1)
    mfcc2 = load_and_extract_features(file_path2)

    distance, _ = fastdtw(mfcc1.T, mfcc2.T, dist=euclidean)
    return distance

# Taking user input for word and user's audio file
word = input("Enter the word: ")
user_audio_file_path = input("Enter the path to your audio file: ")

# Fetch the reference audio file for the word
reference_audio_file_path = get_audio_file(word)
if reference_audio_file_path:
    # Compare the user's pronunciation with the reference
    distance = compare_pronunciations(user_audio_file_path, reference_audio_file_path)
    print(f"Pronunciation similarity score: {distance}")
else:
    print("Reference audio file not found.")
