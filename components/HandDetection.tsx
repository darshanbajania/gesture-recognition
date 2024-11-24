import { useRef, useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";

const HandDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState<handpose.HandPose>(null);

  useEffect(() => {
    async function setupWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();

            const videoWidth = videoRef.current.videoWidth;
            const videoHeight = videoRef.current.videoHeight;

            // Set canvas dimensions
            const canvas = canvasRef.current;
            canvas.width = videoWidth;
            canvas.height = videoHeight;
          };
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    }

    async function loadModel() {
      const handposeModel = await handpose.load();
      console.log("Model loaded");
      setModel(handposeModel);
    }

    setupWebcam();
    loadModel();
  }, []);

  useEffect(() => {
    const detectHands = async () => {
      if (model && videoRef.current) {
        const predictions = await model.estimateHands(videoRef.current);
        drawHands(predictions);
      }
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

    if (model) detectHands();
  }, [model]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "800px",
        margin: "auto",
      }}
    >
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
          borderWidth: "2px",
        }}
      />
    </div>
  );
};

export default HandDetection;
