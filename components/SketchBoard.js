"use client";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { useRef, useState } from "react";
import { motion } from "motion/react";

export default function SketchBoard() {
  const canvasRef = useRef(null);
  const [isShaking, setIsShaking] = useState(false);

  const handleReset = () => {
    canvasRef.current?.resetCanvas();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <main>
      <div className="flex justify-center items-center gap-4 mb-4">
        <h1 className="text-3xl">Sketch Board</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleReset}
          className="text-3xl"
        >
          Reset
        </motion.button>
      </div>
      <section>
        <motion.div
          animate={
            isShaking
              ? {
                  x: [-10, 10, -8, 8, -6, 6, 0],
                }
              : {}
          }
          transition={{
            duration: 0.5,
            ease: "easeInOut",
          }}
          className="flex justify-center"
        >
          <div className="border-8 border-solid border-amber-400 rounded-lg overflow-hidden w-400">
            <ReactSketchCanvas
              ref={canvasRef}
              width="100%"
              height="400px"
              canvasColor="#f2f3f4"
              strokeColor="#000000"
            />
          </div>
        </motion.div>
      </section>
    </main>
  );
}
