// app/layout.tsx
import '../style.css'; // Pfad ggf. anpassen!
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
