import './globals.css';

export const metadata = {
  title: 'Yoga Session Generator',
  description: 'Eine Webanwendung zur Erstellung und Verwaltung von Yoga-Sessions',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
