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
      <body className="bg-[#0B0B0B] text-white antialiased">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
