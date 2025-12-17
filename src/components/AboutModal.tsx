"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Radar, Github, AlertTriangle, Heart, Headphones, ExternalLink, Linkedin } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="relative p-6 pb-4 text-center border-b border-gray-800">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-3"
                >
                  <Radar className="w-12 h-12 text-blue-400" />
                </motion.div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Azure Change Impact Radar
                </h2>
                <p className="text-sm text-gray-400 mt-1">AZpact</p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <p className="text-gray-300 text-sm leading-relaxed">
                  A decision-support tool to help you understand the real impact of Azure VM changes
                  before execution. Analyze resize operations, disk changes, encryption, zone migrations,
                  and more.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="p-1.5 rounded bg-blue-500/20">
                      <Radar className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-300">Impact Analysis</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Evaluates infrastructure and guest OS impacts based on your specific VM configuration
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="p-1.5 rounded bg-green-500/20">
                      <Headphones className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-green-300">Official Microsoft Support</h4>
                      <p className="text-xs text-gray-400 mt-0.5 mb-2">
                        For production issues, always contact official Azure support channels.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href="https://azure.microsoft.com/en-us/support/options/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                        >
                          Azure Support Plans
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-gray-600">|</span>
                        <a
                          href="https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                        >
                          Create Support Request
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-gray-600">|</span>
                        <a
                          href="https://learn.microsoft.com/en-us/answers/tags/133/azure"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                        >
                          Q&A Community
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="p-1.5 rounded bg-amber-500/20">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-amber-300">Disclaimer</h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        This tool is not affiliated with Microsoft. Always verify information with official
                        Azure documentation. Use at your own risk.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 border-t border-gray-800 space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <a
                    href="https://github.com/rmssantos/azpact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                  <a
                    href="https://www.linkedin.com/in/rmssantos/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    Author
                  </a>
                </div>
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                  <span>Made with</span>
                  <Heart className="w-3 h-3 text-red-400" />
                  <span>for Azure admins</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
