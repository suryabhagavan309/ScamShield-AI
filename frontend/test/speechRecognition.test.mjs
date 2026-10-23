import test from 'node:test';
import assert from 'node:assert/strict';

// Mirror mapRecognitionError from useSpeechRecognition.ts for unit test verification
function mapRecognitionError(error) {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was denied. Please allow microphone permissions in your browser to speak.';
    case 'no-speech':
      return 'No speech was detected. Please try speaking again.';
    case 'audio-capture':
      return 'No microphone was detected. Please connect an audio input device.';
    case 'network':
      return 'Speech recognition network error. Please check your internet connection or type below.';
    case 'aborted':
      return ''; // User intentionally stopped or aborted
    default:
      return `Speech recognition notice (${error}). You can also type your description below.`;
  }
}

test('mapRecognitionError translates permission denial gracefully', () => {
  const msg1 = mapRecognitionError('not-allowed');
  assert.match(msg1, /Microphone access was denied/i);
  assert.match(msg1, /allow microphone permissions/i);

  const msg2 = mapRecognitionError('service-not-allowed');
  assert.match(msg2, /Microphone access was denied/i);
});

test('mapRecognitionError handles no-speech and audio-capture cleanly', () => {
  const noSpeech = mapRecognitionError('no-speech');
  assert.match(noSpeech, /No speech was detected/i);

  const noMic = mapRecognitionError('audio-capture');
  assert.match(noMic, /No microphone was detected/i);
});

test('mapRecognitionError handles network and aborted events safely', () => {
  const network = mapRecognitionError('network');
  assert.match(network, /network error/i);

  // Aborted should be silent / non-disruptive
  const aborted = mapRecognitionError('aborted');
  assert.equal(aborted, '');
});

test('mapRecognitionError handles unknown errors with fallback typing advice', () => {
  const unknown = mapRecognitionError('custom-failure-code');
  assert.match(unknown, /Speech recognition notice \(custom-failure-code\)/i);
  assert.match(unknown, /type your description below/i);
});
