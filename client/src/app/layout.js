import './globals.css';

export const metadata = {
  title: 'ChatBot SaaS — Chatbot Inteligente para WhatsApp',
  description: 'Plataforma de chatbot con IA para WhatsApp. Conecta tu número, personaliza las respuestas y automatiza tu negocio.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
