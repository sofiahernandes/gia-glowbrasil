"use client"

import { useState, useRef, useEffect } from "react"
import { useTheme } from "../contexts/theme-context"
import { Palette, Moon, Sun, Check, ChevronDown } from "lucide-react"

type ThemeType = "light" | "dark" | "blue" | "purple" | "green"

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const themes = [
    { id: "light", name: "Claro", icon: Sun },
    { id: "dark", name: "Escuro", icon: Moon },
    { id: "blue", name: "Azul", icon: Palette },
    { id: "purple", name: "Roxo", icon: Palette },
    { id: "green", name: "Verde", icon: Palette },
  ]

  const currentTheme = themes.find((t) => t.id === theme) || themes[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-theme-secondary text-theme-secondary-foreground hover:bg-theme-secondary-hover transition-colors"
      >
        <currentTheme.icon className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">{currentTheme.name}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-theme-card border border-theme-border z-50">
          <div className="py-1 rounded-md bg-theme-card">
            {themes.map((themeOption) => {
              const ThemeIcon = themeOption.icon
              return (
                <button
                  key={themeOption.id}
                  onClick={() => {
                    setTheme(themeOption.id as ThemeType)
                    setIsOpen(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-theme-foreground hover:bg-theme-accent"
                >
                  <ThemeIcon className="w-4 h-4 mr-2" />
                  <span>{themeOption.name}</span>
                  {theme === themeOption.id && <Check className="w-4 h-4 ml-auto" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
