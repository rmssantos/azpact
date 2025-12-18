"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Radar, Share2, Check, Upload } from "lucide-react";
import { VMContext, Action, ImpactReport as ImpactReportType, ActionType, DiskTopology } from "@/types";
import { evaluateImpact, getActionDisplayName } from "@/lib/engine";
import { getSKU } from "@/data/skus";
import { VMForm, ImpactReport, CloudIcon, Header, ProfileLoader, ProfileCard } from "@/components";
import { ParsedVMProfile } from "@/lib/profile-parser";

function HomeContent() {
  const searchParams = useSearchParams();
  const [report, setReport] = useState<ImpactReportType | null>(null);
  const [currentAction, setCurrentAction] = useState<Action | null>(null);
  const [currentContext, setCurrentContext] = useState<VMContext | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<ParsedVMProfile | null>(null);
  const [showProfileLoader, setShowProfileLoader] = useState(false);
  const [analyzingTooLong, setAnalyzingTooLong] = useState(false);
  const [analysisId, setAnalysisId] = useState(0); // Counter to track analysis requests
  const reportRef = useRef<HTMLDivElement>(null);
  const analyzingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate shareable URL from current context and action
  const generateShareUrl = () => {
    if (!currentContext || !currentAction) return "";

    const params = new URLSearchParams();
    params.set("action", currentAction.type);
    params.set("sku", currentContext.vm.sku);
    params.set("os", currentContext.os.family);

    if (currentAction.targetSku) {
      params.set("targetSku", currentAction.targetSku);
    }
    if (currentAction.targetLun !== undefined) {
      params.set("lun", String(currentAction.targetLun));
    }
    if (currentAction.encryptionOperation) {
      params.set("encOp", currentAction.encryptionOperation);
    }
    if (currentAction.encryptionTarget) {
      params.set("encTarget", currentAction.encryptionTarget);
    }

    // Add disk topology if present
    const targetDisk = currentContext.disks.find(d => d.lun === currentAction.targetLun);
    if (targetDisk?.topology) {
      params.set("topology", targetDisk.topology);
    }

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const handleCopyUrl = async () => {
    const url = generateShareUrl();
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = (context: VMContext, action: Action) => {
    // Set state and increment analysis ID to trigger the effect
    setCurrentAction(action);
    setCurrentContext(context);
    setIsAnalyzing(true);
    setAnalysisId((prev) => prev + 1);
  };

  // Effect to run the actual analysis when isAnalyzing becomes true
  useEffect(() => {
    if (!isAnalyzing || !currentContext || !currentAction) return;

    const currentAnalysisId = analysisId;
    let cancelled = false;

    // Use requestAnimationFrame + setTimeout for more reliable execution
    const runAnalysis = () => {
      if (cancelled) return;

      try {
        console.log("[AZpact] Running analysis...", currentAnalysisId);
        const result = evaluateImpact(currentContext, currentAction);
        console.log("[AZpact] Analysis complete", currentAnalysisId);

        if (!cancelled) {
          setReport(result);
          setIsAnalyzing(false);
        }
      } catch (error) {
        console.error("[AZpact] Error evaluating impact:", error);
        if (!cancelled) {
          setReport({
            blocked: false,
            infra: {
              reboot: "none",
              downtime: "none",
              reason: `Error evaluating rules: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
            guest: {
              risk: "low",
              reason: "Unable to evaluate guest impact due to error.",
              affectedComponents: [],
            },
            mitigations: [],
            explanation: "An error occurred during evaluation.",
            matchedRules: [],
          });
          setIsAnalyzing(false);
        }
      }
    };

    // Brief delay for UX feedback, using requestAnimationFrame for reliability
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(runAnalysis);
    }, 300);

    // Auto-recovery failsafe after 10 seconds
    const failsafeId = setTimeout(() => {
      if (!cancelled && isAnalyzing) {
        console.warn("[AZpact] Failsafe triggered: auto-recovering from stuck state");
        setIsAnalyzing(false);
        setReport({
          blocked: false,
          infra: {
            reboot: "none",
            downtime: "none",
            reason: "Analysis timed out. Please try again.",
          },
          guest: {
            risk: "low",
            reason: "Unable to complete analysis.",
            affectedComponents: [],
          },
          mitigations: [],
          explanation: "The analysis took too long and was automatically cancelled.",
          matchedRules: [],
        });
      }
    }, 10000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearTimeout(failsafeId);
    };
  }, [analysisId]); // Only re-run when analysisId changes

  // Failsafe timeout for analyzing state
  useEffect(() => {
    if (isAnalyzing) {
      setAnalyzingTooLong(false);
      analyzingTimeoutRef.current = setTimeout(() => {
        setAnalyzingTooLong(true);
      }, 5000); // Show retry option after 5 seconds
    } else {
      setAnalyzingTooLong(false);
      if (analyzingTimeoutRef.current) {
        clearTimeout(analyzingTimeoutRef.current);
        analyzingTimeoutRef.current = null;
      }
    }
    return () => {
      if (analyzingTimeoutRef.current) {
        clearTimeout(analyzingTimeoutRef.current);
      }
    };
  }, [isAnalyzing]);

  // Parse URL params and auto-evaluate on mount
  useEffect(() => {
    const actionParam = searchParams.get("action") as ActionType | null;
    const skuParam = searchParams.get("sku");
    const osParam = searchParams.get("os") as "Linux" | "Windows" | null;

    if (actionParam && skuParam && osParam) {
      const targetSkuParam = searchParams.get("targetSku");
      const lunParam = searchParams.get("lun");
      const encOpParam = searchParams.get("encOp") as "enable" | "disable" | null;
      const encTargetParam = searchParams.get("encTarget") as "os" | "all" | null;
      const topologyParam = searchParams.get("topology") as DiskTopology | null;

      // Build context from URL params
      const context: VMContext = {
        vm: { sku: skuParam, generation: "Gen2", zonal: true },
        os: { family: osParam, distro: osParam === "Linux" ? "Ubuntu" : "Windows Server", version: osParam === "Linux" ? "22.04" : "2022" },
        disks: [{ lun: 0, name: "os-disk", role: "os" as const, sizeGB: 128, type: "Premium_LRS" as const }],
      };

      // Add data disk if needed
      if (lunParam && parseInt(lunParam) > 0) {
        context.disks.push({
          lun: parseInt(lunParam),
          name: `data-disk-${lunParam}`,
          role: "data" as const,
          sizeGB: 256,
          type: "Premium_LRS" as const,
          ...(topologyParam && { topology: topologyParam }),
          ...(osParam === "Linux" && { mount: "/mnt/data" }),
          ...(topologyParam === "lvm" && { vg: "vgdata" }),
        });
      }

      // Build action from URL params
      const action: Action = {
        type: actionParam,
        ...(targetSkuParam && { targetSku: targetSkuParam }),
        ...(lunParam && { targetLun: parseInt(lunParam) }),
        ...(encOpParam && { encryptionOperation: encOpParam }),
        ...(encTargetParam && { encryptionTarget: encTargetParam }),
      };

      // Trigger evaluation
      handleSubmit(context, action);
    }
  }, [searchParams]);

  // Scroll to results on mobile and focus after report is ready
  useEffect(() => {
    if (report && reportRef.current) {
      // Focus the report section for accessibility
      reportRef.current.focus();

      // Scroll to results on mobile
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        reportRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [report]);

  const handleReset = () => {
    setReport(null);
    setCurrentAction(null);
    setCurrentContext(null);
  };

  const handleRetryAnalyzing = () => {
    // Reset states and trigger a new analysis
    setAnalyzingTooLong(false);
    if (currentContext && currentAction) {
      // Increment analysisId to trigger a fresh analysis
      setAnalysisId((prev) => prev + 1);
    }
  };

  const handleCancelAnalyzing = () => {
    setIsAnalyzing(false);
    setAnalyzingTooLong(false);
  };

  // Get SKU info for display
  const sourceSku = currentContext ? getSKU(currentContext.vm.sku) : null;
  const targetSku = currentAction?.targetSku ? getSKU(currentAction.targetSku) : null;

  return (
    <main className="min-h-screen">
      {/* Fixed Header */}
      <Header />

      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
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
              aria-hidden="true"
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

          {/* Load Profile Button */}
          {!report && !profile && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => setShowProfileLoader(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white transition-all text-sm"
            >
              <Upload className="w-4 h-4" />
              Load VM Profile from Azure CLI
            </motion.button>
          )}
        </motion.div>

        {/* Profile Card (when loaded) */}
        {profile && !report && (
          <ProfileCard
            profile={profile}
            onClear={() => setProfile(null)}
          />
        )}

        {/* Profile Loader Modal */}
        <ProfileLoader
          isOpen={showProfileLoader}
          onClose={() => setShowProfileLoader(false)}
          onProfileLoaded={(p) => setProfile(p)}
        />

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-2xl p-12 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-4"
              >
                <Radar className="w-12 h-12 text-blue-400" />
              </motion.div>
              <p className="text-lg font-medium text-gray-300">Analyzing impact...</p>
              <p className="text-sm text-gray-500 mt-2">Evaluating rules and conditions</p>

              {analyzingTooLong && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 pt-4 border-t border-gray-700"
                >
                  <p className="text-sm text-amber-400 mb-3">Taking too long?</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleRetryAnalyzing}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleCancelAnalyzing}
                      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : !report ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <VMForm onSubmit={handleSubmit} profile={profile} />
            </motion.div>
          ) : (
            <motion.div
              key="report"
              ref={reportRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              tabIndex={-1}
              className="outline-none"
            >
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to form
                </button>

                <button
                  onClick={handleCopyUrl}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Share
                    </>
                  )}
                </button>
              </div>

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
          <p>Community tool. Not affiliated with Microsoft. Always verify with official docs.</p>
        </motion.footer>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Radar className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
