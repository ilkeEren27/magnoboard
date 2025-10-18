import { Coming_Soon } from "next/font/google";
import "./globals.css";

const comingSoon = Coming_Soon({
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
      <body className={`${comingSoon.variable}`}>{children}</body>
    </html>
  );
}
