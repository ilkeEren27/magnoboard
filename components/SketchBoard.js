"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { GoogleGenAI } from "@google/genai";
import { motion } from "motion/react";

// Components from ShadCN/MagicUI
import { DotPattern } from "./ui/dot-pattern";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

// Detecting shake for phones
import useShake from "@/hooks/useShake";

// Did this so I can use Framer Motion on ShadCN's Button component
const MotionButton = motion(Button);

export default function SketchBoard() {
  // mlh.link/gemini-quickstart helped me
  const ai = new GoogleGenAI({
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  });

  const canvasRef = useRef(null);
  const colorChangeTimeoutRef = useRef(null);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [previousColor1, setPreviousColor1] = useState("#ffffff");
  const [previousColor2, setPreviousColor2] = useState("#ffffff");
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState("");

  // iOS motion permission (Got help from ChatGPT here)
  const [motionReady, setMotionReady] = useState(false);
  const askMotionPermission = async () => {
    try {
      const DM =
        typeof window !== "undefined" ? window.DeviceMotionEvent : null;
      if (DM && typeof DM.requestPermission === "function") {
        const res = await DM.requestPermission();
        setMotionReady(res === "granted");
      } else {
        setMotionReady(true); // Android/desktop
      }
    } catch {
      setMotionReady(false);
    }
  };
  useEffect(() => {
    const DM = typeof window !== "undefined" ? window.DeviceMotionEvent : null;
    if (!(DM && typeof DM.requestPermission === "function"))
      setMotionReady(true);
  }, []);

  // Canvas features
  // Store the previous stroke color to track changes
  const [lastCommittedColor, setLastCommittedColor] = useState("#000000");

  const handleStrokeColorChange = useCallback((event) => {
    const newColor = event.target.value;

    // Update stroke color immediately for visual feedback
    setStrokeColor(newColor);
  }, []);

  const handleStrokeColorChangeEnd = useCallback(
    (event) => {
      const newColor = event.target.value;

      // Clear existing timeout
      if (colorChangeTimeoutRef.current) {
        clearTimeout(colorChangeTimeoutRef.current);
      }

      // Set a timeout to save the color to history only after user stops changing
      colorChangeTimeoutRef.current = setTimeout(() => {
        // Only update previous colors if the color actually changed and is different
        if (newColor !== lastCommittedColor && newColor !== previousColor1) {
          // Shift colors: current -> previous1, previous1 -> previous2
          setPreviousColor2(previousColor1);
          setPreviousColor1(lastCommittedColor);
        }
        setLastCommittedColor(newColor);
      }, 100); // Reduced delay
    },
    [lastCommittedColor, previousColor1]
  );

  const handlePreviousColorClick = useCallback(
    (color) => {
      if (color !== strokeColor) {
        // Clear any pending timeout since this is an intentional color change
        if (colorChangeTimeoutRef.current) {
          clearTimeout(colorChangeTimeoutRef.current);
        }

        // Swap colors instead of shifting to preserve all three colors
        if (color === previousColor1) {
          // Swap current color with previous color 1
          setPreviousColor1(strokeColor);
          setStrokeColor(color);
          setLastCommittedColor(color);
        } else if (color === previousColor2) {
          // Swap current color with previous color 2
          setPreviousColor2(strokeColor);
          setStrokeColor(color);
          setLastCommittedColor(color);
        }
      }
    },
    [strokeColor, previousColor1, previousColor2]
  );

  const handleReset = useCallback(() => {
    canvasRef.current?.resetCanvas();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  }, []);

  // 🌀 shake → reset
  useShake({
    onShake: handleReset,
    threshold: 30, // tweak if too sensitive
    cooldown: 900, // prevent spam
  });

  // mlh.link/gemini-quickstart helped me
  const createPrompt = async () => {
    setIsLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents:
          "You are an idea generator for a drawing app. Each time you are asked, give one short, clear idea for something to draw. Keep it very simple, like something a child could doodle in less than a minute. Use short phrasing such as “draw a big green frog” or “draw a smiling sun.” Vary your subjects across animals, food, nature, and everyday objects. Do not repeat previous ideas within the same session if possible. The response should only contain the drawing idea and nothing else.",
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

  // Downloading the image (canvas size adapts to users device size (ISN'T IT SO COOL?))
  const downloadImageWithWhiteBackground = async () => {
    try {
      const data = await canvasRef.current?.exportImage("png");

      const tempImg = new Image();

      tempImg.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = tempImg.width;
        canvas.height = tempImg.height;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(tempImg, 0, 0);

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = `sketch-${
            new Date().toISOString().split("T")[0]
          }-${Date.now()}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, "image/png");
      };

      tempImg.src = data;
    } catch (e) {
      console.error("Error exporting image:", e);
    }
  };

  return (
    <main>
      {/* Desktop */}
      <div className="hidden md:flex justify-center items-center gap-4 mb-4">
        {/* Color Picker */}
        <h1>Pick a color: </h1>
        <input
          className="border w-12 h-12 -p-12"
          type="color"
          value={strokeColor}
          onChange={handleStrokeColorChange}
          onBlur={handleStrokeColorChangeEnd}
          onMouseUp={handleStrokeColorChangeEnd}
        />

        {/* Previous Color Buttons */}
        <button
          onClick={() => handlePreviousColorClick(previousColor1)}
          className="w-8 h-8 border-2 border-gray-300 rounded cursor-pointer hover:border-gray-500 transition-colors"
          style={{ backgroundColor: previousColor1 }}
          title="Previous color 1"
        />
        <button
          onClick={() => handlePreviousColorClick(previousColor2)}
          className="w-8 h-8 border-2 border-gray-300 rounded cursor-pointer hover:border-gray-500 transition-colors"
          style={{ backgroundColor: previousColor2 }}
          title="Previous color 2"
        />
      </div>

      {/* Functions */}
      <div className="hidden md:flex justify-center items-center gap-4 mb-4">
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
          onClick={downloadImageWithWhiteBackground}
        >
          Download Image
        </Button>
      </div>

      {prompt && (
        <div className="hidden md:flex justify-center mb-4">
          <div className="bg-green-100 border border-green-300 rounded-lg p-4 max-w-md text-center">
            <p className="text-lg font-medium text-green-800">Drawing Idea:</p>
            <p className="text-green-700">{prompt}</p>
          </div>
        </div>
      )}

      <section>
        <motion.div
          animate={isShaking ? { x: [-10, 10, -8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="hidden md:flex justify-center"
        >
          <div className="border-10 border-solid border-indigo-300 rounded-lg overflow-hidden w-400 relative">
            <DotPattern
              width={20}
              height={20}
              cx={1}
              cy={1}
              cr={1}
              className={cn(
                "text-gray-300/50 absolute inset-0 z-0",
                "[mask-image:radial-gradient(2000px_circle_at_center,white,transparent)]"
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

        <p className="hidden md:block text-center text-xs text-gray-500 mt-2">
          Tip: motion sensors need HTTPS and may require tapping “Enable motion
          access” on iOS.
        </p>
      </section>
      {/* Mobile */}
      <div className="flex md:hidden justify-center items-center gap-4 mb-4">
        {/* Color Picker */}
        <h1>Pick a color: </h1>
        <input
          className="border w-12 h-12"
          type="color"
          value={strokeColor}
          onChange={handleStrokeColorChange}
          onBlur={handleStrokeColorChangeEnd}
          onMouseUp={handleStrokeColorChangeEnd}
        />

        {/* Previous Color Buttons */}
        <button
          onClick={() => handlePreviousColorClick(previousColor1)}
          className="w-8 h-8 border-2 border-gray-300 rounded cursor-pointer hover:border-gray-500 transition-colors"
          style={{ backgroundColor: previousColor1 }}
          title="Previous color 1"
        />
        <button
          onClick={() => handlePreviousColorClick(previousColor2)}
          className="w-8 h-8 border-2 border-gray-300 rounded cursor-pointer hover:border-gray-500 transition-colors"
          style={{ backgroundColor: previousColor2 }}
          title="Previous color 2"
        />
      </div>

      <div className="flex md:hidden justify-center my-4">
        {" "}
        {/* Enable motion access for iOS */}
        {!motionReady && (
          <Button
            onClick={askMotionPermission}
            className="bg-amber-500 hover:bg-amber-600"
          >
            Enable motion access
          </Button>
        )}
      </div>

      {/* Functions */}
      <div className="flex md:hidden justify-center items-center gap-4 mb-4">
        <Button onClick={handleReset} className="bg-red-500 hover:bg-red-700">
          Shake
        </Button>

        <Button
          onClick={createPrompt}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-700"
        >
          {isLoading ? "Generating..." : "Give me an idea"}
        </Button>

        <Button
          className="bg-blue-500 hover:bg-blue-700"
          onClick={downloadImageWithWhiteBackground}
        >
          Download Image
        </Button>
      </div>

      {prompt && (
        <div className="flex md:hidden justify-center mb-4">
          <div className="bg-green-100 border border-green-300 rounded-lg p-4 max-w-md text-center">
            <p className="text-lg font-medium text-green-800">Drawing Idea:</p>
            <p className="text-green-700">{prompt}</p>
          </div>
        </div>
      )}

      <section>
        <motion.div
          animate={isShaking ? { x: [-10, 10, -8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="flex md:hidden justify-center"
        >
          <div className="border-8 border-solid border-indigo-300 rounded-lg overflow-hidden w-400 relative">
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

        <p className="block md:hidden text-center text-xs text-gray-500 mt-2">
          Tip: motion sensors need HTTPS and may require tapping “Enable motion
          access” on iOS.
        </p>
      </section>
    </main>
  );
}
