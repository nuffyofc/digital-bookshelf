import "./globals.css";

export const metadata = {
  title: "Digital Bookshelf",
  description: "A searchable library of Markdown book summaries.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
