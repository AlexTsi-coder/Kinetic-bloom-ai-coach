const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const feedbackElement = document.querySelector('.feedback-text');

// MediaPipe Configuration
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// Real-time Feedback Logic
pose.onResults((results) => {
  if (results.poseLandmarks) {
    const landmarks = results.poseLandmarks;
    
    // ΠΑΡΑΔΕΙΓΜΑ: Ανίχνευση squat
    const leftHip = landmarks[23].y;  // αριστερό γοφό
    const leftKnee = landmarks[25].y; // αριστερό γόνατο
    
    if (leftHip > leftKnee) {
      feedbackElement.innerText = "ΚΑΛΗ ΒΑΘΙΑ!";
    } else {
      feedbackElement.innerText = "ΠΗΓΑΙΝΕ ΠΙΟ ΚΑΤΩ!";
    }
  }
});

// Ενεργοποίηση κάμερας
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({image: videoElement});
  },
  facingMode: 'user' // Προσοψιαία κάμερα
});
camera.start();