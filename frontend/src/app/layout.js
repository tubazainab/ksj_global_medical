import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ChatbotWidget from '../components/ChatbotWidget';

export const metadata = {
  title: 'KSJ Global Medical - Your Trusted Online Medical Store',
  description: 'Order prescription medicines, healthcare devices, vitamins, baby care, and personal wellness products online.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <AuthProvider>
          <ThemeProvider>
            <CartProvider>
              <Navbar />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
              <ChatbotWidget />
            </CartProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
