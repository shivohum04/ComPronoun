import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Button, Text, TouchableOpacity, Platform } from 'react-native';
import { Audio } from 'expo-av';

const App = () => {
  const [word, setWord] = useState('');
  const [referenceAudioUri, setReferenceAudioUri] = useState('');
  const [recording, setRecording] = useState(null);
  const [recordedAudioUri, setRecordedAudioUri] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [playbackInstance, setPlaybackInstance] = useState(null);

  useEffect(() => {
    Audio.requestPermissionsAsync(); // Request audio recording permissions
    async function setAudioMode() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true,
        });
      } catch (error) {
        console.error("Failed to set audio mode", error);
      }
    }

    setAudioMode();
  }, []);
  const fetchReferenceAudio = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(`http://192.168.29.95:3000/audio/reference?word=${word}`);
      const { audioUrl } = await response.json();
      console.log("connection done");
      setReferenceAudioUri(audioUrl);
      console.log(audioUrl);
    } catch (error) {
      console.error('Error fetching reference audio:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const playAudio = async (uri) => {
    if (playbackInstance) {
      await playbackInstance.unloadAsync();
      setPlaybackInstance(null); // Ensure the old instance is cleared before creating a new one
    }
    try {
      const { sound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) {
            if (status.error) {
              console.error(`Audio loading error: ${status.error}`);
            }
          } else {
            // This block can be expanded to handle other playback statuses
            if (status.isPlaying) {
              console.log('Audio is playing');
            }
          }
        }
      );
      setPlaybackInstance(sound);
      if (!status.isPlaying) {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };
  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      console.log("recording started")
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      return;
    }
    setRecording(null);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log("recording stopped")
    setRecordedAudioUri(uri); // Save recorded file URI for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });
  };

  const playRecording = async () => {
    if (!recordedAudioUri) {
      return;
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: recordedAudioUri },
      { shouldPlay: true }
    );
    console.log("playing user audio")
    sound.playAsync();
  };

  const uploadRecording = async () => {
    if (!recordedAudioUri) {
      console.log('No recording to upload');
      return;
    }
    console.log("recording sending");
    console.log(recordedAudioUri);
  
    // Assuming all recordings are in .m4a format as per your requirement
    let formData = new FormData();
    formData.append('audio', {
      uri: recordedAudioUri.startsWith('file://') ? recordedAudioUri : `file://${recordedAudioUri}`,
      name: "recording.m4a", // Static name for demonstration, consider using a dynamic name based on context
      type: "audio/mp4", // MIME type for .m4a files
    });
  
    try {
      const response = await fetch('http://192.168.29.95:3000/audio/upload', {
        method: 'POST',
        body: formData,
        // Removing Content-Type header so it's automatically set with the correct boundary
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      const responseBody = await response.json(); // If your server responds with JSON
      console.log('Upload successful', responseBody);
    } catch (error) {
      console.error("Upload failed", error);
    }
  };
  const compareAudio = async () => {
    console.log("Comparing user audio");
  
    let formData = new FormData();
    formData.append('audio', {
    uri: recordedAudioUri,
    name: "userRecording.m4a",
    type: "audio/m4a",
    });
    formData.append('word', word); // Send the word along with the audio

  
    try {
      const response = await fetch('http://192.168.29.95:3000/audio/compare', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Comparison failed');
      }
      const result = await response.json();
      console.log('Comparison successful', result.similarityScore);
      // Handle the similarity score as needed
    } catch (error) {
      console.error("Comparison error", error);
    }
  };
  
  

  return (
    <View style={styles.container}>
      {/* Existing components */}
      <TextInput
        style={styles.input}
        onChangeText={setWord}
        value={word}
        placeholder="Enter a word"
      />
      <Button title="Submit Word" onPress={fetchReferenceAudio} disabled={isFetching} />
      <TouchableOpacity onPress={() => playAudio(referenceAudioUri)} disabled={!referenceAudioUri}>
        <Text>Play Reference Audio</Text>
      </TouchableOpacity>
      <Button title="Start Audio Recording" onPress={startRecording} />
      <Button title="Stop Audio Recording" onPress={stopRecording} />
      <Button title="Play your audio" onPress={playRecording} disabled={!recordedAudioUri} />
      {/* Add the Compare Audio button */}
      <Button title="UPLOAD Audio" onPress={uploadRecording} disabled={!recordedAudioUri} />
      <Button title="COMPARE Audio" onPress={compareAudio} disabled={!recordedAudioUri} />
    </View>
  );
};

const styles = StyleSheet.create({
  // Existing styles
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  input: { height: 40, width: '90%', borderColor: 'gray', borderWidth: 1, marginBottom: 20, padding: 10 },
});

export default App;