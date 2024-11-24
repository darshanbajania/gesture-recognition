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
  const leftHand = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<handpose.HandPose>(null);
  const [leftHandPosition, setLeftHandPosition] = useState({
    x: 0,
    y: 0,
  });
  const [rightHandPosition, setRightHandPosition] = useState({
    x: 0,
    y: 0,
  });
  const isModelLoaded = useRef(false);
  const detectedHandData = useRef<handpose.AnnotatedPrediction[]>({ data: [] });
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
  function scaleCoordinates(
    x,
    y,
    videoWidth,
    videoHeight,
    windowWidth,
    windowHeight
  ) {
    const scaledX = (x / videoWidth) * windowWidth;
    const scaledY = (y / videoHeight) * windowHeight;
    return { scaledX, scaledY };
  }

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
      if (model && videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Flip the video horizontally
        ctx.save();
        ctx.scale(-1, 1); // Flip horizontally
        ctx.translate(-canvas.width, 0); // Adjust the drawing position

        // Draw the video frame onto the canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Restore the default canvas transform
        ctx.restore();

        const predictions = await model.estimateHands(canvas);
        // console.log("predictions", predictions);
        console.log(
          "predictions",
          predictions?.[0]?.keypoints[0]?.x,
          detectedHandData.current.data,
          predictions?.filter((item) => item.handedness === "Right").length > 0
        );
        const detectedLeftHandData = predictions?.filter(
          (item) => item.handedness === "Left"
        );

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        if (detectedLeftHandData.length > 0) {
          const { scaledX, scaledY } = scaleCoordinates(
            detectedLeftHandData?.[0]?.keypoints[0]?.x,
            detectedLeftHandData?.[0]?.keypoints[0]?.y,
            videoRef.current.videoWidth,
            videoRef.current.videoHeight,
            windowWidth,
            windowHeight
          );

          setLeftHandPosition({
            x: scaledX,
            y: scaledY,
          });
        }
        const detectedRightHandData = predictions?.filter(
          (item) => item.handedness === "Right"
        );
        if (detectedRightHandData.length > 0) {
          const { scaledX, scaledY } = scaleCoordinates(
            detectedRightHandData?.[0]?.keypoints[0]?.x,
            detectedRightHandData?.[0]?.keypoints[0]?.y,
            videoRef.current.videoWidth,
            videoRef.current.videoHeight,
            windowWidth,
            windowHeight
          );
          setRightHandPosition({
            x: scaledX,
            y: scaledY,
          });
        }
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
            transform: "scaleX(-1)",
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
      <div
        ref={leftHand}
        style={{
          translate: `${leftHandPosition.x || 0}px ${
            leftHandPosition.y || 0
          }px`,
        }}
        className="absolute top-0 left-0 w-[1rem] h-[1rem] bg-black border z-10"
      />
      <div
        // ref={right}
        style={{
          translate: `${rightHandPosition.x || 0}px ${
            rightHandPosition.y || 0
          }px`,
        }}
        className="absolute top-0 left-0 w-[1rem] h-[1rem] bg-black border z-10"
      />
      <p>{leftHandPosition.x || "no data found"}</p>
      <div />
    </div>
  );
};

export default HandDetectionV2;
