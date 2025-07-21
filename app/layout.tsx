// app/layout.tsx
import '../globals.css';   // dort liegen dann Tailwind + Custom-Stile drin
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
