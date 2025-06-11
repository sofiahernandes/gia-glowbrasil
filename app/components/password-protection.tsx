"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Lock, Eye, EyeOff } from "lucide-react"

interface PasswordProtectionProps {
  children: React.ReactNode
}

export function PasswordProtection({ children }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const correctPassword = "glow#lock"

  // Reset authentication on page refresh
  useEffect(() => {
    setIsAuthenticated(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simulate a brief loading delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (password === correctPassword) {
      setIsAuthenticated(true)
    } else {
      setError("Senha incorreta. Tente novamente.")
      setPassword("")
    }
    setIsLoading(false)
  }

  if (isAuthenticated) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Lock Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg mb-4">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Acesso Restrito</h1>
        </div>

        {/* Password Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Input */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="Digite a senha..."
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 disabled:bg-white hover:bg-blue-200 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-1"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verificando...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Entrar
                </>
              )}
            </button>
          </form>

          {/* Warning Text */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg mt-2 p-4">
              <div className="flex items-start gap-3">
                <p className="text-amber-800 text-sm font-medium leading-relaxed">
                  Não compartilhe este acesso. Sujeito a multas.
                </p>
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}
