import { useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import { Hands } from "@mediapipe/hands";

const HandDetectionMediaPipe = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const setupHandsModel = async () => {
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2, // Detect up to 2 hands
      modelComplexity: 1, // Set to 1 for balanced speed and accuracy
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    const detectorConfig = {
      runtime: "mediapipe", // Use MediaPipe as the backend
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
      modelType: "lite", // Choose 'lite' or 'full'
    };

    const model = await handPoseDetection.createDetector(
      handPoseDetection.SupportedModels.MediaPipeHands,
      detectorConfig
    );

    return { model, hands };
  };

  useEffect(() => {
    const setupWebcam = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();

          // Match canvas size with video size
          const videoWidth = videoRef.current.videoWidth;
          const videoHeight = videoRef.current.videoHeight;

          const canvas = canvasRef.current;
          canvas.width = videoWidth;
          canvas.height = videoHeight;
        };
      }
    };

    setupWebcam();
  }, []);
  useEffect(() => {
    let model;

    const detectHands = async () => {
      if (!videoRef.current || !model) return;

      const predictions = await model.estimateHands(videoRef.current);

      // Draw landmarks or gesture output
      drawHands(predictions);

      requestAnimationFrame(detectHands);
    };

    const drawHands = (predictions) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      predictions.forEach((prediction) => {
        const { landmarks } = prediction;

        landmarks.forEach(([x, y]) => {
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = "blue";
          ctx.fill();
        });
      });
    };

    const setupModel = async () => {
      const { model: loadedModel } = await setupHandsModel();
      model = loadedModel;
      detectHands();
    };

    setupModel();
  }, []);

  return (
    <div style={{ position: "relative", maxWidth: "800px", margin: "auto" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "auto",
          zIndex: 1,
          background: "black",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "auto",
          zIndex: 2,
        }}
      />
    </div>
  );
};

export default HandDetectionMediaPipe;
