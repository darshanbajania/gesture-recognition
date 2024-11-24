import { useRef, useEffect, useState } from "react";
// import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/hands";
const HandDetectionV2 = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState<handpose.HandPose>(null);

  const isModelLoaded = useRef(false);
  console.log("this code is loading");
  const loadModel = async () => {
    if (isModelLoaded.current === true) return;
    console.log("model loading initiated");
    const model = handPoseDetection.SupportedModels.MediaPipeHands;
    const detectorConfig = {
      runtime: "mediapipe", // or 'tfjs',
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands",
      modelType: "full",
    };
    const detector = await handPoseDetection.createDetector(
      model,
      detectorConfig
    );
    // const handposeModel = await handpose.load();
    console.log("Model loaded");
    setModel(detector);
    isModelLoaded.current = true;
  };

  const startModel = async () => {
    await loadModel();
  };

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

    setupWebcam();
    // loadModel();
  }, []);

  useEffect(() => {
    const detectHands = async () => {
      if (model && videoRef.current) {
        const predictions = await model.estimateHands(videoRef.current);
        console.log("predictions", predictions);
        drawHands(predictions);
      }
      requestAnimationFrame(detectHands);
    };

    const drawHands = (predictions) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      predictions.forEach((prediction) => {
        const { keypoints } = prediction;
        keypoints.forEach(({ x, y }) => {
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
    <div className="border-2 w-full h-full">
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
      <div className="mt-[100px] border-1 border-red-500">
        <button onClick={startModel}>Start Model</button>
      </div>
      <div className="absolute top-0 left-0 w-[1rem] h-[1rem] bg-black border" />
      <div className="absolute top-0 left-5 w-[1rem] h-[1rem] bg-black border" />
      <div className="absolute top-0 left-10 w-[1rem] h-[1rem] bg-black border" />
      <div />
    </div>
  );
};

export default HandDetectionV2;
