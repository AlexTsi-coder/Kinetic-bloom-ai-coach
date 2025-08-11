// Στοιχεία DOM
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const feedbackElement = document.querySelector('.feedback-text');

// Αρχικοποίηση MediaPipe Pose
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

// Ρυθμίσεις
pose.setOptions({
  modelComplexity: 2,         // Ακριβέστερο μοντέλο
  smoothLandmarks: true,      // Ομαλά αποτελέσματα
  enableSegmentation: false,  // Χωρίς segmentation
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// Συνάρτηση υπολογισμού γωνίας μεταξύ 3 σημείων
function calculateAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  return angle > 180.0 ? 360 - angle : angle;
}

// Χειρισμός αποτελεσμάτων
pose.onResults((results) => {
  // Καθαρισμός canvas
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Σχεδίαση βίντεο
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  
  // Ανίχνευση πόζας
  if (results.poseLandmarks) {
    // Σχεδίαση landmarks
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: '#00FF00',
      lineWidth: 2
    });
    
    drawLandmarks(canvasCtx, results.poseLandmarks, {
      color: '#FF0000',
      lineWidth: 1,
      radius: 4
    });
    
    // Λήψη landmarks
    const landmarks = results.poseLandmarks;
    
    // Αναγνωριστικά σημείων για squat
    const LEFT_HIP = 23;
    const LEFT_KNEE = 25;
    const LEFT_ANKLE = 27;
    const RIGHT_HIP = 24;
    const RIGHT_KNEE = 26;
    const RIGHT_ANKLE = 28;
    
    // Υπολογισμός γωνιών
    const leftAngle = calculateAngle(
      landmarks[LEFT_HIP],
      landmarks[LEFT_KNEE],
      landmarks[LEFT_ANKLE]
    );
    
    const rightAngle = calculateAngle(
      landmarks[RIGHT_HIP],
      landmarks[RIGHT_KNEE],
      landmarks[RIGHT_ANKLE]
    );
    
    // Μέση γωνία
    const avgAngle = (leftAngle + rightAngle) / 2;
    
    // Εμφάνιση γωνίας (debugging)
    canvasCtx.fillStyle = '#FFFFFF';
    canvasCtx.font = '16px Arial';
    canvasCtx.fillText(`Γωνία: ${avgAngle.toFixed(1)}°`, 20, 30);
    
    // Κανόνες ανατροφοδότησης
    if (avgAngle > 160) {
      feedbackElement.textContent = "ΕΤΟΙΜΑΣΟΥ ΓΙΑ SQUAT!";
      feedbackElement.style.background = 'linear-gradient(90deg, #ff7e00, #ffaa00)';
    } else if (avgAngle > 120) {
      feedbackElement.textContent = "ΠΗΓΑΙΝΕ ΠΙΟ ΚΑΤΩ!";
      feedbackElement.style.background = 'linear-gradient(90deg, #ff5500, #ff7e00)';
    } else if (avgAngle > 80) {
      feedbackElement.textContent = "ΤΕΛΕΙΑ ΒΑΘΙΑ! ΚΡΑΤΑ ΤΗ ΘΕΣΗ!";
      feedbackElement.style.background = 'linear-gradient(90deg, #00c896, #00ffaa)';
    } else {
      feedbackElement.textContent = "ΑΡΧΙΣΕ ΝΑ ΣΗΚΩΝΕΣΑΙ!";
      feedbackElement.style.background = 'linear-gradient(90deg, #00aaff, #00ddff)';
    }
  } else {
    feedbackElement.textContent = "ΑΝΙΧΝΕΥΣΤΕ ΣΤΗΝ ΟΘΟΝΗ";
    feedbackElement.style.background = 'linear-gradient(90deg, #5555ff, #8888ff)';
  }
  
  canvasCtx.restore();
});

// Ενεργοποίηση κάμερας
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({image: videoElement});
  },
  width: 640,
  height: 480,
  facingMode: 'user'  // Χρήση front camera
});

// Έναρξη κάμερας
camera.start();


// Χειρισμός σφαλμάτων
pose.onError(error => {
  console.error('MediaPipe Σφάλμα:', error);
  feedbackElement.textContent = "ΣΦΑΛΜΑ: " + error.message;
});

// Έλεγχος υποστήριξης
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  feedbackElement.textContent = "Η ΣΥΣΚΕΥΗ ΣΑΣ ΔΕΝ ΥΠΟΣΤΗΡΙΖΕΙ ΚΑΜΕΡΑ";
}

// Έλεγχος κάμερας
navigator.mediaDevices.getUserMedia({ video: true })
  .then(() => feedbackElement.textContent = "Camera OK")
  .catch(err => feedbackElement.textContent = "Camera error: " + err.message);

// Έλεγχος MediaPipe
pose.onResults(results => {
  console.log("MediaPipe results:", results);
});
