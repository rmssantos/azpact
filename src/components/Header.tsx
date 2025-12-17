"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Radar, BookOpen, Info } from "lucide-react";
import { ResourcesDrawer } from "./ResourcesDrawer";
import { AboutModal } from "./AboutModal";

export function Header() {
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-gray-900/70 border-b border-gray-800/50"
      >
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Radar className="w-6 h-6 text-blue-400" />
              </motion.div>
              <span className="font-semibold text-gray-200">AZpact</span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <button
                onClick={() => setIsResourcesOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Resources</span>
              </button>
              <button
                onClick={() => setIsAboutOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <Info className="w-4 h-4" />
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
