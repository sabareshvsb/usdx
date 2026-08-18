import "./globals.css";
import "./guide.css";
import ChatWidget from "../components/ChatWidget";

export const metadata = {
  title: "USDX Compounding Guide",
  description: "Professional Compounding Guide for $500, $1000 and $5000 Plans",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0B0B0B] text-white antialiased">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
