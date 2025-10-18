"use client";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { useRef } from "react";
import { Button } from "./ui/button";

export default function SketchBoard() {
  const canvasRef = useRef(null);

  const handleReset = () => {
    canvasRef.current?.resetCanvas();
  };

  return (
    <main>
      <div className="flex justify-center items-center gap-4 mb-4">
        <h1>Sketch Board</h1>
        <Button onClick={handleReset}>Reset</Button>
      </div>
      <section className="flex justify-center">
        <ReactSketchCanvas
          ref={canvasRef}
          width="80%"
          height="250px"
          canvasColor="#e5e5e5"
          strokeColor="#000000"
        />
      </section>
    </main>
  );
}
