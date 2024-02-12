import sys
import librosa
import numpy as np
from scipy.spatial.distance import euclidean
from fastdtw import fastdtw
from pydub import AudioSegment

def convert_audio_to_wav(audio_file_path, wav_file_path, format):
    # Load the audio file with specified format
    audio = AudioSegment.from_file(audio_file_path, format=format)
    # Export as wav
    audio.export(wav_file_path, format="wav")

def load_and_extract_features(file_path):
    # Load the audio file
    y, sr = librosa.load(file_path, sr=None)  # Use the native sampling rate
    # Extract MFCC features
    mfcc = librosa.feature.mfcc(y=y, sr=sr)
    return mfcc

def compare_pronunciations(user_audio_file_path, reference_audio_file_path):
    # Convert the user audio to wav if it is in m4a
    if user_audio_file_path.endswith('.m4a'):
        user_wav_file_path = user_audio_file_path.rsplit('.', 1)[0] + '.wav'
        convert_audio_to_wav(user_audio_file_path, user_wav_file_path, 'm4a')
        user_audio_file_path = user_wav_file_path  # Use the converted wav file for comparison

    # Convert the reference audio to wav if it is in mp3
    if reference_audio_file_path.endswith('.mp3'):
        reference_wav_file_path = reference_audio_file_path.rsplit('.', 1)[0] + '.wav'
        convert_audio_to_wav(reference_audio_file_path, reference_wav_file_path, 'mp3')
        reference_audio_file_path = reference_wav_file_path  # Use the converted wav file for comparison

    mfcc1 = load_and_extract_features(user_audio_file_path)
    mfcc2 = load_and_extract_features(reference_audio_file_path)

    # Compare using DTW
    distance, _ = fastdtw(mfcc1.T, mfcc2.T, dist=euclidean)
    return distance

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python compare.py user_audio_file_path reference_audio_file_path")
        sys.exit(1)
    
    user_audio_file_path = sys.argv[1]
    reference_audio_file_path = sys.argv[2]
    
    # Perform comparison
    distance = compare_pronunciations(user_audio_file_path, reference_audio_file_path)
    print(f"Pronunciation similarity score: {distance}")
