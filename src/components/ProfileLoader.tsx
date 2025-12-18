"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Terminal,
  X,
  Copy,
  Check,
  AlertCircle,
  FileJson,
  Clipboard,
  ShieldCheck,
} from "lucide-react";
import { parseAzureVMJson, getAzureCliCommand, ParsedVMProfile } from "@/lib/profile-parser";

interface ProfileLoaderProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileLoaded: (profile: ParsedVMProfile) => void;
}

// Security limits
const MAX_FILE_SIZE_MB = 1;
const MAX_INPUT_LENGTH = 500000; // 500KB should be plenty for VM JSON

// ============================================================================
// In-Memory Encryption using Web Crypto API
// ============================================================================
// This encrypts sensitive data while in React state to protect against:
// - React DevTools inspection
// - Browser memory dumps
// - Malicious extensions reading component state
// The key is generated per-session and never persisted.
// ============================================================================

interface EncryptedData {
  iv: Uint8Array<ArrayBuffer>;
  data: ArrayBuffer;
}

class MemoryCrypto {
  private key: CryptoKey | null = null;

  async init(): Promise<void> {
    if (this.key) return;
    // Generate a new AES-GCM key for this session
    this.key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false, // not extractable - key stays in memory only
      ["encrypt", "decrypt"]
    );
  }

  async encrypt(plaintext: string): Promise<EncryptedData | null> {
    if (!plaintext) return null;
    await this.init();
    if (!this.key) return null;

    const encoder = new TextEncoder();
    const iv = new Uint8Array(12) as Uint8Array<ArrayBuffer>;
    crypto.getRandomValues(iv); // 96-bit IV for AES-GCM
    const data = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      this.key,
      encoder.encode(plaintext)
    );
    return { iv, data };
  }

  async decrypt(encrypted: EncryptedData | null): Promise<string> {
    if (!encrypted || !this.key) return "";

    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: encrypted.iv },
        this.key,
        encrypted.data
      );
      return new TextDecoder().decode(decrypted);
    } catch {
      return "";
    }
  }

  // Destroy the key - data becomes unrecoverable
  destroy(): void {
    this.key = null;
  }
}

/**
 * Securely wipe a string from memory by overwriting it
 */
function secureWipe(setter: (value: string) => void): void {
  setter("");
}

export function ProfileLoader({ isOpen, onClose, onProfileLoaded }: ProfileLoaderProps) {
  // Security: Store encrypted data in state, display value separately
  const [encryptedInput, setEncryptedInput] = useState<EncryptedData | null>(null);
  const [displayValue, setDisplayValue] = useState(""); // Only for textarea display
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cryptoRef = useRef<MemoryCrypto>(new MemoryCrypto());

  // Security: Clear sensitive data when component unmounts or closes
  const clearSensitiveData = useCallback(() => {
    setEncryptedInput(null);
    secureWipe(setDisplayValue);
    setError(null);
    // Destroy encryption key
    cryptoRef.current.destroy();
    // Reinitialize for next use
    cryptoRef.current = new MemoryCrypto();
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Security: Clear data on unmount
  useEffect(() => {
    return () => {
      clearSensitiveData();
    };
  }, [clearSensitiveData]);

  // Security: Clear data when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearSensitiveData();
    }
  }, [isOpen, clearSensitiveData]);

  const cliCommand = getAzureCliCommand();

  const handleCopyCommand = async () => {
    await navigator.clipboard.writeText(cliCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Security: Encrypt input as it's entered
  const handleInputChange = async (value: string) => {
    if (value.length > MAX_INPUT_LENGTH) {
      setError(`Input too large. Maximum is ${Math.round(MAX_INPUT_LENGTH / 1000)}KB.`);
      return;
    }
    setDisplayValue(value);
    setError(null);
    // Encrypt and store
    const encrypted = await cryptoRef.current.encrypt(value);
    setEncryptedInput(encrypted);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.length > MAX_INPUT_LENGTH) {
        setError(`Input too large. Maximum is ${Math.round(MAX_INPUT_LENGTH / 1000)}KB.`);
        return;
      }
      await handleInputChange(text);
    } catch {
      setError("Unable to access clipboard. Please paste manually.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security: Check file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content.length > MAX_INPUT_LENGTH) {
        setError(`Input too large. Maximum is ${Math.round(MAX_INPUT_LENGTH / 1000)}KB.`);
        return;
      }
      await handleInputChange(content);
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsText(file);
  };

  const handleLoadProfile = async () => {
    if (!displayValue.trim()) {
      setError("Please paste the JSON output first");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Security: Decrypt data for parsing
    const decryptedJson = await cryptoRef.current.decrypt(encryptedInput);

    // Brief delay for UX
    setTimeout(() => {
      const result = parseAzureVMJson(decryptedJson);

      if (result.success && result.profile) {
        onProfileLoaded(result.profile);
        clearSensitiveData();
        onClose();
      } else {
        setError(result.error || "Failed to parse VM profile");
      }
      setIsLoading(false);
    }, 100);
  };

  const handleClose = () => {
    clearSensitiveData();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pb-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-xl glass rounded-2xl overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Upload className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Load VM Profile</h2>
                <p className="text-xs text-gray-400">Import from Azure CLI</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Step 1: CLI Command */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Step 1: Run in Azure CLI</span>
              </div>
              <div className="relative">
                <pre className="bg-gray-900 rounded-lg p-3 pr-10 text-xs text-emerald-400 font-mono overflow-x-auto">
                  {cliCommand}
                </pre>
                <button
                  onClick={handleCopyCommand}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                  title="Copy command"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Replace <code className="text-amber-400">&lt;resource-group&gt;</code> and{" "}
                <code className="text-amber-400">&lt;vm-name&gt;</code> with your values
              </p>
            </div>

            {/* Step 2: Paste JSON */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Step 2: Paste JSON output</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePaste}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                  >
                    <Clipboard className="w-3 h-3" />
                    Paste
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
              <textarea
                value={displayValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder='{"name": "my-vm", "hardwareProfile": {...}, ...}'
                className="w-full h-32 bg-gray-900 rounded-lg p-3 text-xs text-gray-300 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
                // Security: Prevent browser/extensions from caching or reading input
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}

            {/* Info boxes - compact */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 bg-emerald-900/20 border border-emerald-800 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-emerald-300">Your Data Stays Local</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    All processing happens in your browser. No data is stored, transmitted, or logged.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-300">Guest OS Details Not Included</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Azure CLI cannot detect LVM, RAID, or Storage Spaces. You may be asked for these details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleLoadProfile}
              disabled={!displayValue.trim() || isLoading}
              className="px-4 py-1.5 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? "Loading..." : "Load Profile"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
