"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Shield,
  Server,
  HardDrive,
  BookOpen,
  FileText,
  Bookmark,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ImpactReport as ImpactReportType, ActionType } from "@/types";
import { ImpactBadge } from "./ImpactBadge";
import { getArticlesForAction, getGeneralArticles, Article } from "@/data/articles";

interface ImpactReportProps {
  report: ImpactReportType;
  actionType?: ActionType;
}

// Severity legend explanations
const severityLegend = {
  reboot: {
    none: "No reboot required - operation completes without restart",
    possible: "Reboot may occur - depends on specific conditions",
    likely: "Reboot expected - plan for brief interruption",
    guaranteed: "Reboot required - VM will definitely restart",
  },
  downtime: {
    none: "No downtime - service remains available",
    low: "Brief interruption - seconds to a minute",
    medium: "Moderate downtime - several minutes expected",
    high: "Extended downtime - significant service interruption",
  },
  risk: {
    low: "Low risk - standard operation with minimal concerns",
    medium: "Medium risk - take precautions, backup recommended",
    high: "High risk - potential data impact, backup required",
    critical: "Critical risk - data loss possible, verify backups first",
  },
};

export function ImpactReport({ report, actionType }: ImpactReportProps) {
  const [showLegend, setShowLegend] = useState(false);
  const actionArticles = actionType ? getArticlesForAction(actionType) : [];
  const generalArticles = getGeneralArticles();
  if (report.blocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6 glow-critical"
      >
        <div className="flex items-center gap-3 mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
          <h2 className="text-2xl font-bold text-red-400">Operation Blocked</h2>
        </div>
        <p className="text-gray-300 text-lg">{report.blockerReason}</p>
      </motion.div>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical":
        return "text-red-400";
      case "high":
        return "text-orange-400";
      case "medium":
        return "text-yellow-400";
      default:
        return "text-emerald-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Summary Header */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" />
          Impact Analysis
        </h2>

        <div className="flex flex-wrap gap-3">
          <ImpactBadge type="reboot" level={report.infra.reboot} />
          <ImpactBadge type="downtime" level={report.infra.downtime} />
          <ImpactBadge type="risk" level={report.guest.risk} />
        </div>

        {/* Severity Legend Toggle */}
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="mt-4 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          What do these levels mean?
          {showLegend ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Legend Content */}
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-700 space-y-4"
          >
            {/* Reboot Legend */}
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Reboot</p>
              <div className="grid gap-1 text-xs">
                {Object.entries(severityLegend.reboot).map(([level, desc]) => (
                  <div key={level} className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded ${
                      level === "none" ? "bg-emerald-900/50 text-emerald-300" :
                      level === "possible" ? "bg-yellow-900/50 text-yellow-300" :
                      level === "likely" ? "bg-orange-900/50 text-orange-300" :
                      "bg-red-900/50 text-red-300"
                    }`}>{level}</span>
                    <span className="text-gray-400">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Downtime Legend */}
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Downtime</p>
              <div className="grid gap-1 text-xs">
                {Object.entries(severityLegend.downtime).map(([level, desc]) => (
                  <div key={level} className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded ${
                      level === "none" ? "bg-emerald-900/50 text-emerald-300" :
                      level === "low" ? "bg-yellow-900/50 text-yellow-300" :
                      level === "medium" ? "bg-orange-900/50 text-orange-300" :
                      "bg-red-900/50 text-red-300"
                    }`}>{level}</span>
                    <span className="text-gray-400">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Legend */}
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Risk</p>
              <div className="grid gap-1 text-xs">
                {Object.entries(severityLegend.risk).map(([level, desc]) => (
                  <div key={level} className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded ${
                      level === "low" ? "bg-emerald-900/50 text-emerald-300" :
                      level === "medium" ? "bg-yellow-900/50 text-yellow-300" :
                      level === "high" ? "bg-orange-900/50 text-orange-300" :
                      "bg-red-900/50 text-red-300"
                    }`}>{level}</span>
                    <span className="text-gray-400">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Infrastructure Impact */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-400" />
          Azure Platform Impact
        </h3>
        <p className="text-gray-300">{report.infra.reason}</p>
      </motion.div>

      {/* Guest OS Impact */}
      {report.guest.risk !== "low" && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`glass rounded-xl p-6 ${
            report.guest.risk === "critical"
              ? "glow-critical"
              : report.guest.risk === "high"
              ? "glow-error"
              : "glow-warning"
          }`}
        >
          <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${getRiskColor(report.guest.risk)}`}>
            <HardDrive className="w-5 h-5" />
            Guest OS Impact
          </h3>
          <p className="text-gray-300 mb-3">{report.guest.reason}</p>

          {report.guest.affectedComponents.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Affected Components:</p>
              <div className="flex flex-wrap gap-2">
                {report.guest.affectedComponents.map((component) => (
                  <span
                    key={component}
                    className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300"
                  >
                    {component}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Mitigations */}
      {report.mitigations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            Required Mitigations
          </h3>

          <div className="space-y-3">
            {report.mitigations
              .filter((m) => m.required)
              .map((mitigation, index) => (
                <motion.div
                  key={mitigation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg"
                >
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-white">{mitigation.title}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {mitigation.description}
                    </p>
                    {mitigation.docUrl && (
                      <a
                        href={mitigation.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Microsoft Learn
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>

          {/* Recommended mitigations */}
          {report.mitigations.filter((m) => !m.required).length > 0 && (
            <>
              <h4 className="text-md font-medium mt-6 mb-3 text-gray-300">
                Recommended Steps
              </h4>
              <div className="space-y-2">
                {report.mitigations
                  .filter((m) => !m.required)
                  .map((mitigation) => (
                    <div
                      key={mitigation.id}
                      className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg"
                    >
                      <CheckCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">{mitigation.title}</p>
                        {mitigation.docUrl && (
                          <a
                            href={mitigation.docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Learn more
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Related Documentation */}
      {(actionArticles.length > 0 || generalArticles.length > 0) && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Related Documentation
          </h3>

          {/* Action-specific articles */}
          {actionArticles.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                For this operation
              </p>
              <div className="grid gap-2">
                {actionArticles.slice(0, 4).map((article, index) => (
                  <motion.a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors group"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm group-hover:text-blue-300 transition-colors">
                        {article.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {article.description}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      article.category === "action" ? "bg-blue-900/50 text-blue-300" :
                      article.category === "troubleshoot" ? "bg-amber-900/50 text-amber-300" :
                      "bg-emerald-900/50 text-emerald-300"
                    }`}>
                      {article.category === "action" ? "How-to" :
                       article.category === "troubleshoot" ? "Troubleshoot" : "Best Practice"}
                    </span>
                  </motion.a>
                ))}
              </div>
            </div>
          )}

          {/* General articles (backup, recovery) */}
          <div>
            <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Backup & Recovery
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {generalArticles
                .filter((a) => a.category === "backup")
                .slice(0, 4)
                .map((article) => (
                  <a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors text-sm"
                  >
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-300 hover:text-blue-300 transition-colors truncate">
                      {article.title}
                    </span>
                  </a>
                ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Matched Rules (Debug/Transparency) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs text-gray-500"
      >
        <details>
          <summary className="cursor-pointer hover:text-gray-400">
            View matched rules ({report.matchedRules.length})
          </summary>
          <div className="mt-2 p-3 bg-gray-900 rounded-lg font-mono">
            {report.matchedRules.map((rule) => (
              <div key={rule}>{rule}</div>
            ))}
          </div>
        </details>
      </motion.div>
    </motion.div>
  );
}
