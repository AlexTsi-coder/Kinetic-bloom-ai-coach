const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const feedbackElement = document.getElementById('feedback');

function onResults(results) {
  // Καθαρισμός canvas
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Mirror the canvas because video is mirrored
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.poseLandmarks) {
    // Σχεδίασε τα σημεία και συνδέσμους
    window.drawConnectors(canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS,
      { color: '#00FF00', lineWidth: 4 });
    window.drawLandmarks(canvasCtx, results.poseLandmarks,
      { color: '#FF0000', lineWidth: 2 });

    // Παράδειγμα απλής αξιολόγησης: Έλεγχος για στάση σώματος (πχ κορμός)
    const leftShoulder = results.poseLandmarks[11];
    const rightShoulder = results.poseLandmarks[12];
    const leftHip = results.poseLandmarks[23];
    const rightHip = results.poseLandmarks[24];

    // Υπολόγισε αν οι ώμοι και οι γοφοί είναι σχεδόν σε ευθεία γραμμή
    const shoulderAvgY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipAvgY = (leftHip.y + rightHip.y) / 2;

    const diff = Math.abs(shoulderAvgY - hipAvgY);

    if (diff < 0.1) {
      feedbackElement.textContent = "Καλή στάση! Κράτα την πλάτη ίσια.";
      feedbackElement.style.color = '#4ade80'; // πράσινο
    } else {
      feedbackElement.textContent = "Διόρθωσε την στάση σου, τέντωσε την πλάτη.";
      feedbackElement.style.color = '#f87171'; // κόκκινο
    }
  } else {
    feedbackElement.textContent = "Περίμενε, ανίχνευση σε εξέλιξη...";
    feedbackElement.style.color = '#fbbf24'; // κίτρινο
  }

  canvasCtx.restore();
}

// Δημιουργία Pose αντικειμένου από MediaPipe
const pose = new window.Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`
});
pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  smoothSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
pose.onResults(onResults);

// Εκκίνηση κάμερας
const camera = new window.Camera(videoElement, {
  onFrame: async () => {
    await pose.send({ image: videoElement });
  },
  width: 320,
  height: 240
});
camera.start();
