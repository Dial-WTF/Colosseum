'use client';

import { useEffect } from 'react';
import { Loader2, CheckCircle2, XCircle, Upload, Coins, Shield, ExternalLink } from 'lucide-react';

export interface MintingStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  icon: 'upload' | 'coins' | 'shield' | 'check';
  errorMessage?: string;
}

interface MintingProgressModalProps {
  isOpen: boolean;
  steps: MintingStep[];
  currentStep: string;
  explorerUrl?: string;
  mintAddress?: string;
  onClose: () => void;
}

export function MintingProgressModal({
  isOpen,
  steps,
  currentStep,
  explorerUrl,
  mintAddress,
  onClose,
}: MintingProgressModalProps) {
  const allCompleted = steps.every(step => step.status === 'completed');
  const hasError = steps.some(step => step.status === 'error');

  // Auto-close after success (optional)
  useEffect(() => {
    if (allCompleted && explorerUrl) {
      // Don't auto-close, let user manually close
    }
  }, [allCompleted, explorerUrl]);

  if (!isOpen) return null;

  const getIcon = (step: MintingStep) => {
    switch (step.icon) {
      case 'upload':
        return Upload;
      case 'coins':
        return Coins;
      case 'shield':
        return Shield;
      case 'check':
        return CheckCircle2;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white rounded-t-xl">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            {allCompleted ? (
              <>
                <CheckCircle2 className="h-7 w-7" />
                NFT Minted Successfully!
              </>
            ) : hasError ? (
              <>
                <XCircle className="h-7 w-7" />
                Minting Failed
              </>
            ) : (
              <>
                <Loader2 className="h-7 w-7 animate-spin" />
                Minting Your NFT...
              </>
            )}
          </h2>
          <p className="text-purple-100 text-sm mt-1">
            {allCompleted
              ? 'Your NFT is now on the Solana blockchain'
              : hasError
              ? 'Something went wrong during minting'
              : 'Please wait while we process your transaction'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="p-6 space-y-4">
          {steps.map((step, index) => {
            const Icon = getIcon(step);
            const isActive = step.id === currentStep;
            
            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                  step.status === 'completed'
                    ? 'bg-green-500/10 border-green-500/30'
                    : step.status === 'error'
                    ? 'bg-red-500/10 border-red-500/30'
                    : isActive
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-muted/30 border-border'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : step.status === 'error' ? (
                    <XCircle className="h-6 w-6 text-red-500" />
                  ) : step.status === 'in_progress' ? (
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  ) : (
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{step.label}</h3>
                    <span className="text-xs text-muted-foreground">
                      {step.status === 'completed' && '✓'}
                      {step.status === 'in_progress' && 'Processing...'}
                      {step.status === 'error' && 'Failed'}
                    </span>
                  </div>
                  {step.errorMessage && (
                    <p className="text-sm text-red-500 mt-1">{step.errorMessage}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mint Address */}
        {mintAddress && (
          <div className="px-6 pb-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Mint Address</p>
              <p className="text-sm font-mono text-foreground break-all">{mintAddress}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-2 flex gap-3">
          {explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              View on Solscan
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          
          <button
            onClick={onClose}
            disabled={!allCompleted && !hasError}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
              allCompleted || hasError
                ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {allCompleted ? 'Close' : hasError ? 'Try Again' : 'Please Wait...'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage minting progress state
 */
export function useMintingProgress() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [steps, setSteps] = React.useState<MintingStep[]>([
    {
      id: 'metadata',
      label: 'Uploading Metadata',
      status: 'pending',
      icon: 'upload',
    },
    {
      id: 'creating',
      label: 'Creating NFT',
      status: 'pending',
      icon: 'coins',
    },
    {
      id: 'confirming',
      label: 'Confirming Transaction',
      status: 'pending',
      icon: 'shield',
    },
  ]);
  const [currentStep, setCurrentStep] = React.useState('metadata');
  const [explorerUrl, setExplorerUrl] = React.useState<string>();
  const [mintAddress, setMintAddress] = React.useState<string>();

  const startMinting = () => {
    setIsOpen(true);
    setSteps([
      {
        id: 'metadata',
        label: 'Uploading Metadata',
        status: 'in_progress',
        icon: 'upload',
      },
      {
        id: 'creating',
        label: 'Creating NFT',
        status: 'pending',
        icon: 'coins',
      },
      {
        id: 'confirming',
        label: 'Confirming Transaction',
        status: 'pending',
        icon: 'shield',
      },
    ]);
    setCurrentStep('metadata');
    setExplorerUrl(undefined);
    setMintAddress(undefined);
  };

  const updateStep = (
    stepId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'error',
    errorMessage?: string
  ) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, status, errorMessage } : step
      )
    );
    if (status === 'in_progress') {
      setCurrentStep(stepId);
    }
  };

  const complete = (explorerUrl: string, mintAddress: string) => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'completed' as const })));
    setExplorerUrl(explorerUrl);
    setMintAddress(mintAddress);
  };

  const error = (stepId: string, errorMessage: string) => {
    updateStep(stepId, 'error', errorMessage);
  };

  const close = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    steps,
    currentStep,
    explorerUrl,
    mintAddress,
    startMinting,
    updateStep,
    complete,
    error,
    close,
  };
}

// Import React at the bottom to avoid circular dependency issues
import React from 'react';

