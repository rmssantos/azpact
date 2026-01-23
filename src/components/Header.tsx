"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Radar, BookOpen, Info } from "lucide-react";
import { ResourcesDrawer } from "./ResourcesDrawer";
import { AboutModal } from "./AboutModal";

export function Header() {
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      <motion.header
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-gray-900/70 border-b border-gray-800/50"
        role="banner"
      >
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <motion.div
                animate={prefersReducedMotion ? {} : { rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                aria-hidden="true"
              >
                <Radar className="w-6 h-6 text-blue-400" />
              </motion.div>
              <span className="font-semibold text-gray-200">AZpact</span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1" aria-label="Main navigation">
              <button
                onClick={() => setIsResourcesOpen(true)}
                aria-label="Open resources panel"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Resources</span>
              </button>
              <button
                onClick={() => setIsAboutOpen(true)}
                aria-label="Open about dialog"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Info className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">About</span>
              </button>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-14" />

      {/* Modals/Drawers */}
      <ResourcesDrawer
        isOpen={isResourcesOpen}
        onClose={() => setIsResourcesOpen(false)}
      />
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </>
  );
}
