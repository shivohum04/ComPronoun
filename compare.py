import librosa
import numpy as np
from fastdtw import fastdtw
from scipy.spatial.distance import euclidean

def load_and_extract_features(file_path):
    # Load the audio file
    y, sr = librosa.load(file_path)
    # Extract MFCC features
    mfcc = librosa.feature.mfcc(y=y, sr=sr)
    return mfcc

def compare_pronunciations(file_path1, file_path2):
    # Load and extract features for both audio files
    mfcc1 = load_and_extract_features(file_path1)
    mfcc2 = load_and_extract_features(file_path2)

    # Compare using DTW
    distance, _ = fastdtw(mfcc1.T, mfcc2.T, dist=euclidean)
    return distance

# Example usage
file_user = './audio/Act.wav'
file_reference = './audio/Act.wav'
distance = compare_pronunciations(file_user, file_reference)

# Lower distance means better pronunciation accuracy
print(f"Pronunciation similarity score: {distance}")
