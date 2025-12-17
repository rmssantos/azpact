"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, BookOpen, Shield, Wrench, Lightbulb, HardDrive } from "lucide-react";
import { articles, Article } from "@/data/articles";

interface ResourcesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryConfig = {
  action: {
    label: "How-To Guides",
    icon: BookOpen,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  backup: {
    label: "Backup & Recovery",
    icon: Shield,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  troubleshoot: {
    label: "Troubleshooting",
    icon: Wrench,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  "best-practice": {
    label: "Best Practices",
    icon: Lightbulb,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
};

const actionLabels: Record<string, string> = {
  ResizeVM: "Resize VM",
  ResizeOSDisk: "Resize OS Disk",
  ResizeDataDisk: "Resize Data Disk",
  DetachDisk: "Detach Disk",
  RedeployVM: "Redeploy VM",
  EnableEncryption: "Disk Encryption",
  ChangeZone: "Availability Zones",
  CrossRegionMove: "Cross-Region Move",
  general: "General",
};

export function ResourcesDrawer({ isOpen, onClose }: ResourcesDrawerProps) {
  // Group all articles by category
  const articlesByCategory = Object.entries(articles).reduce(
    (acc, [actionType, actionArticles]) => {
      actionArticles.forEach((article) => {
        if (!acc[article.category]) {
          acc[article.category] = [];
        }
        // Add action type context to article for display
        acc[article.category].push({
          ...article,
          actionType,
        });
      });
      return acc;
    },
    {} as Record<string, (Article & { actionType: string })[]>
  );

  // Remove duplicates based on article id
  Object.keys(articlesByCategory).forEach((category) => {
    const seen = new Set<string>();
    articlesByCategory[category] = articlesByCategory[category].filter(
      (article) => {
        if (seen.has(article.id)) return false;
        seen.add(article.id);
        return true;
      }
    );
  });

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] bg-gray-900 border-l border-gray-800 z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Resources</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <p className="text-sm text-gray-400">
                Official Microsoft documentation organized by category. Click any article to open in a new tab.
              </p>

              {Object.entries(categoryConfig).map(([category, config]) => {
                const Icon = config.icon;
                const categoryArticles = articlesByCategory[category] || [];

                if (categoryArticles.length === 0) return null;

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-1.5 rounded-lg ${config.bg}`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <h3 className={`text-sm font-medium ${config.color}`}>
                        {config.label}
                      </h3>
                      <span className="text-xs text-gray-500">
                        ({categoryArticles.length})
                      </span>
                    </div>

                    <div className="space-y-2">
                      {categoryArticles.map((article) => (
                        <a
                          key={`${article.actionType}-${article.id}`}
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                                  {actionLabels[article.actionType]}
                                </span>
                              </div>
                              <h4 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">
                                {article.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {article.description}
                              </p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 text-center">
              <a
                href="https://learn.microsoft.com/en-us/azure/virtual-machines/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Browse all Azure VM documentation
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
