import { useRef, useEffect, useState } from "react";

const WebcamHandler = ({ onStream }) => {
  const videoRef = useRef(null);

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
          };
          if (onStream) onStream(stream);
        }
      } catch (error) {
        console.error("Error accessing webcam", error);
      }
    }
    setupWebcam();
  }, [onStream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{ width: "100%", height: "auto" }}
    />
  );
};

export default WebcamHandler;
