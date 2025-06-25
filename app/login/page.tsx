'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, signOut } from 'firebase/auth'; // Import sign-in methods
import { authClient, googleAuthProvider } from '@/lib/firebase/firebaseClient'; // Import client-side Firebase Auth

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in via Firebase Auth state observer
    const unsubscribe = authClient.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in, store UID and redirect
        localStorage.setItem('userId', user.uid); // Store Firebase UID
        router.push('/');
      } else {
        // User is signed out or not logged in, clear local storage
        localStorage.removeItem('userId');
      }
      setLoading(false);
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(authClient, googleAuthProvider);
      // After successful sign-in, onAuthStateChanged listener will handle redirect
      console.log('Signed in successfully:', result.user.uid);
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError(err.message || 'Falha ao fazer login com o Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Login Gia AI Assistant</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <button
          onClick={handleGoogleSignIn}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 flex items-center justify-center space-x-2"
          disabled={loading}
        >
          {loading ? (
            'Entrando...'
          ) : (
            <>
              <img src="/google-logo.svg" alt="Google Logo" className="h-5 w-5" />
              <span>Entrar com Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}