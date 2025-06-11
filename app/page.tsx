"use client"

import type React from "react"
import { Brain, Target, Zap } from "lucide-react"
import { ThemeSelector } from "./components/theme-selector"
import dynamic from "next/dynamic";

const FullPageChat = dynamic(
  () => import("flowise-embed-react").then(mod => mod.FullPageChat),
  { ssr: false }
);

export default function GiaAssistant() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-gradient-from via-theme-background to-theme-gradient-to">
      {/* Header Section */}
      <div className="relative z-10 bg-theme-header-bg backdrop-blur-sm border-b border-theme-header-border">
        <div className="max-w-4xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex justify-end mb-4">
            <ThemeSelector />
          </div>
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

      {/* Chat Container */}
      <div className="relative pt-10">
        {/* Chat Interface */}
        <div className="relative z-10 h-[calc(100vh-280px)] min-h-[500px]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-theme-card rounded-t-2xl shadow-xl border border-theme-border overflow-hidden flex flex-col">
              <FullPageChat
                  chatflowid="e945adfd-2c50-42c5-8cc3-04cb4f978837"
                  apiHost="https://cloud.flowiseai.com"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle footer */}
      <div className="text-center py-4 text-sm text-theme-secondary-foreground opacity-70">
        <p>Desenvolvido para maximizar seu potencial</p>
      </div>
    </div>
  )
}
