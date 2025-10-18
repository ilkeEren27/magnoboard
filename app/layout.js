import { Kalam } from "next/font/google";
import "./globals.css";

const kalam = Kalam({
  weight: "400",
  variable: "--font-coming-soon",
  subsets: ["latin"],
});

export const metadata = {
  title: "Magnetic Board",
  description: "Draw what you want with this digital whiteboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${kalam.variable}`}>
        {children}
        <footer className="w-full h-24 flex items-center justify-center border-t mt-8">
          <p className="text-center">
            Made by{" "}
            <a className="underline" href="https://ilkeeren.dev">
              Eren
            </a>{" "}
            with ❤️
          </p>
        </footer>
      </body>
    </html>
  );
}
