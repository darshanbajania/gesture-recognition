"use client";

import HandDetectionV2 from "@/components/HandDetection-V2";

// import HandDetection from "@/components/HandDetection";
// import HandDetectionMediaPipe from "@/components/HandDetectionMediaPipe";

export default function Home() {
  return (
    <div className="relative">
      <h1>Hand Gesture Detection</h1>
      <HandDetectionV2 />
      {/* <HandDetection /> */}
      {/* <HandDetectionMediaPipe /> */}
    </div>
  );
}
