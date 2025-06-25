'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { authClient } from '@/lib/firebase/firebaseClient';
import { Brain, Target, Zap } from "lucide-react"
import { ThemeSelector } from "./components/theme-selector"

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null); // State to hold Firebase UID
  const [userEmail, setUserEmail] = useState<string | null>(null); // State to hold user email

  // Check for stored userId on component mount and listen to auth state
  useEffect(() => {
    const unsubscribe = authClient.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email); // Set user email from Firebase Auth
        localStorage.setItem('userId', user.uid); // Keep in local storage for quick access
      } else {
        setUserId(null);
        setUserEmail(null);
        localStorage.removeItem('userId');
        router.push('/login'); // Redirect to login if not authenticated
      }
    });

    return () => unsubscribe(); // Clean up subscription
  }, [router]);

  // Scroll to the bottom of the chat box when messages update
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (input.trim() === '') return;
    if (!userId) {
      console.error('User not authenticated. Cannot send message.');
      router.push('/login');
      return;
    }

    const newUserMessage: Message = { role: 'user', content: input };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId, // Use the Firebase UID as userId
        },
        body: JSON.stringify({
          prompt: input,
          history: messages.map(msg => ({ role: msg.role, content: msg.content }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.error || 'Unknown error.'}`);
      }

      const data = await response.json();
      const aiResponse: Message = { role: 'model', content: data.response };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      let errorMessage = 'Desculpe, algo deu errado. Por favor, tente novamente.';
      if (error.message.includes('403')) {
        errorMessage = 'Você atingiu o limite de mensagens para o seu plano este mês. Faça upgrade para continuar!';
      } else if (error.message.includes('404')) {
        errorMessage = 'Usuário não encontrado. Por favor, faça login novamente.';
      } else if (error.message.includes('Message:')) {
        errorMessage = error.message.split('Message:')[1].trim();
      }
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'model', content: errorMessage },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(authClient);
      localStorage.removeItem('userId'); // Clear userId from local storage
      router.push('/login'); // Redirect to login page
    } catch (error) {
      console.error('Logout error:', error);
      alert('Falha ao sair. Tente novamente.');
    }
  };

  // Render nothing or a loading spinner until userId is determined
  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen animate-pulse">
        <img width="50px" alt="App loading icon" src="butterfly-icon.png"/>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-theme-accent p-4">
      {/* Header Section */}
      <div className="relative w-full p-5 z-10 bg-theme-header-bg backdrop-blur-sm mb-6">
        <div className="flex justify-end mb-4">
          <ThemeSelector />
        </div>
        <div className="max-w-4xl mx-auto">

          <div className="text-center space-y-4">
            {/* Logo/Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-theme-primary rounded-full flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 text-theme-primary-foreground" />
              </div>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-theme-foreground tracking-tight">
              Olá! Eu sou a <span className="font-semibold text-theme-primary">Gia</span>
            </h1>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-theme-secondary text-theme-secondary-foreground rounded-full text-sm font-medium">
                <Target className="w-4 h-4" />
                Foco
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-theme-secondary text-theme-secondary-foreground rounded-full text-sm font-medium">
                <Zap className="w-4 h-4" />
                Produtividade
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-theme-secondary text-theme-secondary-foreground rounded-full text-sm font-medium">
                <Brain className="w-4 h-4" />
                Disciplina
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Box Section */}
      <div className="w-full max-w-3xl border border-theme-border bg-theme-card rounded-lg shadow-md flex flex-col h-[70vh]">
        <div ref={chatBoxRef} className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-theme-user-message text-white self-end ml-auto'
                  : 'bg-theme-assistant-message text-gray-800 self-start mr-auto'
              }`}
              style={{ maxWidth: '80%' }}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="p-3 rounded-lg bg-gray-200 text-theme-assistant-message-text self-start mr-auto animate-pulse">
              ...
            </div>
          )}
        </div>
        <div className="p-4 border-t flex">
          <input
            type="text"
            className="flex-1 p-2 border rounded-l-lg focus:outline-none "
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-4 py-2 bg-theme-user-message text-white rounded-r-lg hover:bg-theme-primary-foreground disabled:bg-theme-accent focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Enviar
          </button>
        </div>
      </div>

      <button
              onClick={handleLogout}
              className="px-4 pb-1 pt-8 text-xs rounded-md hover:text-red-700 hover:font-bold focus:ring-2 focus:ring-red-700 focus:ring-offset-2"
            >
              Sair ({userEmail || 'Usuário'})
            </button>
    </div>
  );
}