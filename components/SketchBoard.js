"use client";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { useRef, useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { DotPattern } from "./ui/dot-pattern";
import { cn } from "@/lib/utils";

const MotionButton = motion(Button);

export default function SketchBoard() {
  const ai = new GoogleGenAI({
    apiKey: "AIzaSyC0_ocMkiQTwbsTXpWEgJylURCufSDZatI",
  });

  const canvasRef = useRef(null);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState("");

  const createPrompt = async () => {
    setIsLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents:
          "Give me an idea to draw, make it simple as possible, it can be animal, fruits/vegetables, nature. Be simple as you can in your answers like 'draw a snake', or 'draw a apple tree', not longer than a sentence and only one suggestion at the moment.",
      });
      const text = response.text;
      setPrompt(text);
    } catch (error) {
      console.error("Error generating prompt:", error);
      setPrompt("Sorry, couldn't generate a prompt. Try again!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStrokeColorChange = (event) => {
    setStrokeColor(event.target.value);
  };

  const handleReset = () => {
    canvasRef.current?.resetCanvas();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <main>
      <div className="flex justify-center items-center gap-4 mb-4">
        <h1>Pick a color: </h1>
        <input
          className="border w-12 h-12"
          type="color"
          onChange={handleStrokeColorChange}
        />
      </div>
      <div className="flex justify-center items-center gap-4 mb-4">
        <MotionButton
          whileTap={{ scale: 0.9 }}
          onClick={handleReset}
          className="bg-red-500 hover:bg-red-700"
        >
          Shake
        </MotionButton>
        <Button
          onClick={createPrompt}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-700"
        >
          {isLoading ? "Generating..." : "Give me an idea"}
        </Button>
        <Button
          className="bg-blue-500 hover:bg-blue-700"
          onClick={() => {
            canvasRef.current
              ?.exportImage("png")
              .then((data) => {
                console.log(data);
              })
              .catch((e) => {
                console.log(e);
              });
          }}
        >
          Get Image
        </Button>
      </div>
      {prompt && (
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 border border-green-300 rounded-lg p-4 max-w-md text-center">
            <p className="text-lg font-medium text-green-800">Drawing Idea:</p>
            <p className="text-green-700">{prompt}</p>
          </div>
        </div>
      )}
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
          <div className="border-8 border-solid border-amber-400 rounded-lg overflow-hidden w-400 relative">
            <DotPattern
              width={20}
              height={20}
              cx={1}
              cy={1}
              cr={1}
              className={cn(
                "text-gray-300/50 absolute inset-0 z-0",
                "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]"
              )}
            />
            <ReactSketchCanvas
              ref={canvasRef}
              width="100%"
              height="560px"
              canvasColor="transparent"
              strokeColor={strokeColor}
              style={{ position: "relative", zIndex: 1 }}
            />
          </div>
        </motion.div>
      </section>
    </main>
  );
}
