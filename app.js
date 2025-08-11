const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const feedbackElement = document.querySelector('.feedback-text');

// Προσθήκη βοηθητικών συναρτήσεων για σχεδίαση
function drawLine(ctx, from, to, color, lineWidth) {
  ctx.beginPath();
  ctx.moveTo(from.x * canvasElement.width, from.y * canvasElement.height);
  ctx.lineTo(to.x * canvasElement.width, to.y * canvasElement.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawPoint(ctx, point, color, radius) {
  ctx.beginPath();
  ctx.arc(point.x * canvasElement.width, point.y * canvasElement.height, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

// MediaPipe Configuration
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  enableSegmentation: false
});

pose.onResults((results) => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Σχεδίαση βίντεο στο canvas
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  
  if (results.poseLandmarks) {
    // Σχεδίαση σημείων και γραμμών
    for (const landmark of results.poseLandmarks) {
      drawPoint(canvasCtx, landmark, '#FF0000', 5);
    }
    
    // Σύνδεση σημείων (απλοποιημένο)
    if (results.poseLandmarks.length > 24) {
      // Γόνατο-αστράγαλος
      drawLine(canvasCtx, results.poseLandmarks[25], results.poseLandmarks[27], '#00FF00', 3);
      drawLine(canvasCtx, results.poseLandmarks[26], results.poseLandmarks[28], '#00FF00', 3);
      
      // Μηροί-γόνατα
      drawLine(canvasCtx, results.poseLandmarks[23], results.poseLandmarks[25], '#00FF00', 3);
      drawLine(canvasCtx, results.poseLandmarks[24], results.poseLandmarks[26], '#00FF00', 3);
    }
    
    // Λογική ανίχνευσης για squats
    if (results.poseLandmarks.length > 25) {
      const leftHip = results.poseLandmarks[23];
      const leftKnee = results.poseLandmarks[25];
      const leftAnkle = results.poseLandmarks[27];
      
      // Υπολογισμός γωνίας
      const angle = Math.atan2(leftAnkle.y - leftKnee.y, leftAnkle.x - leftKnee.x) - 
                   Math.atan2(leftHip.y - leftKnee.y, leftHip.x - leftKnee.x);
      const degrees = Math.abs(angle * 180 / Math.PI);
      
      // Εμφάνιση γωνίας για debugging
      canvasCtx.fillStyle = '#FFFFFF';
      canvasCtx.font = '20px Arial';
      canvasCtx.fillText(`Γωνία: ${degrees.toFixed(1)}°`, 20, 40);
      
      // Απλός κανόνας για squats
      if (degrees < 90) {
        feedbackElement.innerText = "ΚΑΛΗ ΒΑΘΙΑ!";
      } else {
        feedbackElement.innerText = "ΠΗΓΑΙΝΕ ΠΙΟ ΚΑΤΩ!";
      }
    }
  } else {
    feedbackElement.innerText = "ΠΑΡΑΚΑΛΩ ΘΕΣΤΕ ΟΛΗ ΤΗ ΣΩΜΑΤΟΣΤΑΣΗ ΣΤΗΝ ΟΘΟΝΗ";
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
  facingMode: 'user'
});

camera.start();

// Εμφάνιση σφαλμάτων στην κονσόλα
pose.onError(error => {
  console.error('MediaPipe Σφάλμα:', error);
  feedbackElement.innerText = "ΣΦΑΛΜΑ: " + error.message;
});