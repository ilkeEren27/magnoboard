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
      <body className={`${kalam.variable}`}>{children}</body>
    </html>
  );
}
