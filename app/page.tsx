"use client";
// import HandDetection from "@/components/HandDetection";
// import HandDetectionMediaPipe from "@/components/HandDetectionMediaPipe";
import HandDetectionV2 from "@/components/HandDetectionv2";

export default function Home() {
  return (
    <div className="">
      <h1>Hand Gesture Detection</h1>
      {/* <HandDetection /> */}
      {/* <HandDetectionMediaPipe /> */}
      <HandDetectionV2 />
    </div>
  );
}
