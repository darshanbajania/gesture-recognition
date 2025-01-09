import { useRef, useEffect, useState } from "react";
// import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import * as handPoseDetection from "@tensorflow-models/hand-pose-detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/hands";
import GestureComponent from "./GestureComponent";
const HandDetectionV2 = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const leftHand = useRef<HTMLDivElement>(null);
  const [model, setModel] = useState<handpose.HandPose>(null);
  const [leftHandPosition, setLeftHandPosition] = useState({
    type: "pan",
    x: 0,
    y: 0,
  });
  const [rightHandPosition, setRightHandPosition] = useState({
    type: "pan",
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

  const detectOverlap = (targetElement, elementsToCheck) => {
    const targetRect = targetElement.getBoundingClientRect();
    const overlappedElements = [];

    elementsToCheck.forEach((element) => {
      const elementRect = element.getBoundingClientRect();
      const isOverlapping =
        targetRect.left < elementRect.right &&
        targetRect.right > elementRect.left &&
        targetRect.top < elementRect.bottom &&
        targetRect.bottom > elementRect.top;

      if (isOverlapping) {
        overlappedElements.push(element);
      }
    });

    return overlappedElements;
  };

  const detectOverlapV2 = async (
    targetElement,
    elementCoordinates,
    element
  ) => {
    const targetRect = targetElement?.getBoundingClientRect();
    const overlappedElements = [];

    // const elementRect = element.getBoundingClientRect();
    const isOverlapping =
      targetRect.left <= elementCoordinates.x &&
      targetRect.right > elementCoordinates.x &&
      targetRect.top <= elementCoordinates.y &&
      targetRect.bottom > elementCoordinates.y;

    if (isOverlapping) {
      overlappedElements.push(targetElement);
      targetElement.style.outline = "5px solid blue";
    } else {
      targetElement.style.outline = "none";
    }

    return overlappedElements;
  };
  const detectOverlapV3 = async (elementsToCheck = [], elementCoordinates) => {
    const overlappedElements = [];

    for (const element of elementsToCheck) {
      const elementRect = element.getBoundingClientRect();
      const isOverlapping =
        elementRect.left <= elementCoordinates.x &&
        elementRect.right > elementCoordinates.x &&
        elementRect.top <= elementCoordinates.y &&
        elementRect.bottom > elementCoordinates.y;

      if (isOverlapping) {
        overlappedElements.push(element);
        element.style.outline = "5px solid blue";
      } else {
        element.style.outline = "none";
      }
    }
    return overlappedElements;
  };
  const isPointer = (handData) => {
    let fingerTipTotal = 0;
    let indexFingerTipPosition = 0;
    handData?.[0]?.keypoints.map((item) => {
      if (
        ["middle_finger_tip", "ring_finger_tip", "pinky_finger_tip"].includes(
          item.name
        )
      ) {
        fingerTipTotal += item.y;
      } else if (["index_finger_tip"].includes(item.name)) {
        indexFingerTipPosition = item.y;
      }
    });
    const distanceBetweenIndexFingerAndOtherFingers =
      fingerTipTotal / 3 - indexFingerTipPosition;

    // console.log(
    //   distanceBetweenIndexFingerAndOtherFingers > 10 ? true : false,
    //   fingerTipTotal,
    //   indexFingerTipPosition
    // );
    return distanceBetweenIndexFingerAndOtherFingers > 10 ? true : false;
  };

  useEffect(() => {
    async function setupWebcam() {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
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
        // console.log(
        //   "predictions",
        //   predictions?.[0]?.keypoints[0]?.x,
        //   detectedHandData.current.data,
        //   predictions?.filter((item) => item.handedness === "Right").length > 0
        // );
        const detectedLeftHandData = predictions?.filter(
          (item) => item.handedness === "Left"
        );

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const rightHandElement = document.getElementById("right-hand");
        const gestureComponentElement = document.getElementById(
          "gesture-component-1"
        );
        const gestureComponentElements =
          document.getElementsByClassName("gesture-component");
        // console.log(
        //   "gesture component element",
        //   gestureComponentElements.length
        // );
        // const overlappingElements = detectOverlap(
        //   rightHandElement,
        //   gestureComponentElement
        // );
        // console.log("overlapping elements", overlappingElements.length);
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
            type: isPointer(detectedLeftHandData) ? "pointer" : "pan",
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
            type: isPointer(detectedRightHandData) ? "pointer" : "pan",
            x: scaledX,
            y: scaledY,
          });
          const overlappingElements = await detectOverlapV3(
            gestureComponentElements,
            { x: scaledX, y: scaledY }
          );
          // console.log(
          //   "overlapping elements",
          //   overlappingElements?.[0],
          //   { x: scaledX, y: scaledY },
          //   gestureComponentElements?.[0]?.getBoundingClientRect()
          // );
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
    <div className="w-full h-full ">
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "800px",
          height: "580px",
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
        <button
          onClick={startModel}
          className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2"
        >
          Start Model
        </button>
      </div>
      <div
        id={"left-hand"}
        ref={leftHand}
        style={{
          translate: `${leftHandPosition.x || 0}px ${
            leftHandPosition.y || 0
          }px`,
        }}
        className="absolute top-0 left-0 z-10"
      >
        {leftHandPosition.type === "pointer" ? (
          <img
            style={{ transform: "scaleX(-1)" }}
            src="pointer-hand.png"
            className="h-[350px] w-[350px] opacity-50"
          />
        ) : (
          <img
            style={{ transform: "scaleX(-1)" }}
            src="right-hand.png"
            className="h-[350px] w-[350px] opacity-50"
          />
        )}
      </div>
      <div
        id="right-hand"
        style={{
          translate: `${rightHandPosition.x || 0}px ${
            rightHandPosition.y || 0
          }px`,
        }}
        className="absolute top-0 left-0 z-10"
      >
        {/* {rightHandPosition.type === "pointer" ? (
          <div className="h-[5px] w-[5px] bg-[#ff0000]" />
        ) : (
          <div className="h-[5px] w-[5px] bg-black" />
        )} */}
        {rightHandPosition.type === "pointer" ? (
          <img
            src="pointer-hand.png"
            className="h-[350px] w-[350px] opacity-50 "
          />
        ) : (
          <img
            src="right-hand.png"
            className="h-[350px] w-[350px] opacity-50 "
          />
        )}

        {/* <img src="right-hand.png" className="h-[350px] w-[350px] opacity-50 " /> */}
      </div>
      <p>{leftHandPosition.x || "no data found"}</p>
      <div />
      <div className="flex gap-5 justify-center">
        <GestureComponent itemKey={1}>
          <button className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2">
            Click Me
          </button>
        </GestureComponent>
        <GestureComponent itemKey={1}>
          <button className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2">
            Click Me
          </button>
        </GestureComponent>
        <GestureComponent itemKey={1}>
          <button className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2">
            Click Me
          </button>
        </GestureComponent>
      </div>
    </div>
  );
};

export default HandDetectionV2;
