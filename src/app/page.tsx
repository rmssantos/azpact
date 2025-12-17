"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Radar } from "lucide-react";
import { VMContext, Action, ImpactReport as ImpactReportType } from "@/types";
import { evaluateImpact, getActionDisplayName } from "@/lib/engine";
import { getSKU } from "@/data/skus";
import { VMForm, ImpactReport, CloudIcon, Header } from "@/components";

export default function Home() {
  const [report, setReport] = useState<ImpactReportType | null>(null);
  const [currentAction, setCurrentAction] = useState<Action | null>(null);
  const [currentContext, setCurrentContext] = useState<VMContext | null>(null);

  const handleSubmit = (context: VMContext, action: Action) => {
    const result = evaluateImpact(context, action);
    setReport(result);
    setCurrentAction(action);
    setCurrentContext(context);
  };

  const handleReset = () => {
    setReport(null);
    setCurrentAction(null);
    setCurrentContext(null);
  };

  // Get SKU info for display
  const sourceSku = currentContext ? getSKU(currentContext.vm.sku) : null;
  const targetSku = currentAction?.targetSku ? getSKU(currentAction.targetSku) : null;

  return (
    <main className="min-h-screen">
      {/* Fixed Header */}
      <Header />

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-10 opacity-20"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <CloudIcon size={200} animated={false} />
        </motion.div>
        <motion.div
          className="absolute bottom-20 left-10 opacity-10"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <CloudIcon size={150} animated={false} />
        </motion.div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Radar className="w-10 h-10 text-blue-400" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Azure Change Impact Radar
            </h1>
          </div>
          <p className="text-gray-400">
            Understand the real impact of Azure VM changes before execution
          </p>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {!report ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <VMForm onSubmit={handleSubmit} />
            </motion.div>
          ) : (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to form
              </button>

              {currentAction && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass rounded-xl p-4 mb-6"
                >
                  <p className="text-sm text-gray-400">Analyzing action:</p>
                  <p className="text-lg font-semibold text-blue-400">
                    {getActionDisplayName(currentAction.type, currentAction)}
                    {currentAction.targetLun !== undefined &&
                      ` (LUN ${currentAction.targetLun})`}
                  </p>
                  {currentAction.type === "ResizeVM" && sourceSku && targetSku && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">From:</span>
                        <span className="px-2 py-1 rounded bg-gray-800 text-gray-200">
                          [{sourceSku.processor}] {sourceSku.family} • {sourceSku.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">To:</span>
                        <span className="px-2 py-1 rounded bg-blue-900/50 text-blue-300">
                          [{targetSku.processor}] {targetSku.family} • {targetSku.name}
                        </span>
                      </div>
                      {sourceSku.processor !== targetSku.processor && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 rounded bg-amber-900/50 text-amber-300 text-xs font-medium">
                            ⚡ Processor change: {sourceSku.processor} → {targetSku.processor}
                          </span>
                        </div>
                      )}
                      {sourceSku.family !== targetSku.family && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded bg-purple-900/50 text-purple-300 text-xs font-medium">
                            📦 Family change: {sourceSku.family} → {targetSku.family}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              <ImpactReport report={report} actionType={currentAction?.type} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-sm text-gray-500"
        >
          <p>Not affiliated with Microsoft. Use at your own risk.</p>
        </motion.footer>
      </div>
    </main>
  );
}
