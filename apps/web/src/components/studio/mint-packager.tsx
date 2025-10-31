'use client';

import { useState } from 'react';
import {
  Package,
  Music,
  User,
  Tag,
  DollarSign,
  Image as ImageIcon,
  FileText,
  Sparkles,
  X,
  Upload,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { BondingCurveConfig } from '@dial/bonding-curve';
import { solToLamports, formatLamportsToSOL } from '@dial/bonding-curve';
import { BondingCurveConfigurator } from '~/mint/bonding-curve-configurator';

interface MintPackagerProps {
  audioData: {
    audioUrl: string;
    duration: number;
    audioBuffer?: AudioBuffer;
  };
  initialData?: {
    soundName?: string;
    artistName?: string;
    walletAddress?: string;
  };
  onClose: () => void;
  onMint: (packagedData: PackagedNFTData) => Promise<void>;
}

export interface PackagedNFTData {
  // Metadata
  name: string;
  symbol: string;
  description: string;
  artistName: string;
  
  // Media
  audioUrl: string;
  coverImage?: string;
  duration: number;
  
  // Minting Configuration
  nftType: 'master-edition' | 'sft' | 'cnft';
  royaltyPercentage: number;
  
  // Bonding Curve
  bondingCurve: BondingCurveConfig;
  
  // Attributes/Tags
  attributes: Array<{ trait_type: string; value: string }>;
  tags: string[];
}

export function MintPackager({ audioData, initialData, onClose, onMint }: MintPackagerProps) {
  const [currentStep, setCurrentStep] = useState<'metadata' | 'configure' | 'review'>('metadata');
  const [isMinting, setIsMinting] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  
  // AI Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('A vibrant abstract design with musical notes, neon colors and digital waves');
  const [generateStyle, setGenerateStyle] = useState('sticker');

  // Metadata
  const [name, setName] = useState(initialData?.soundName || '');
  const [symbol, setSymbol] = useState('DIAL');
  const [description, setDescription] = useState('A unique audio NFT created on Dial.WTF - your sound, on-chain forever.');
  const [artistName, setArtistName] = useState(initialData?.artistName || '');
  
  // Minting config
  const [nftType, setNftType] = useState<'master-edition' | 'sft' | 'cnft'>('master-edition');
  const [royaltyPercentage, setRoyaltyPercentage] = useState(5);
  
  // Bonding curve
  const [bondingCurve, setBondingCurve] = useState<BondingCurveConfig>({
    type: 'linear',
    basePrice: solToLamports(0.010),
    priceIncrement: solToLamports(0.001),
    maxSupply: 100,
  });
  
  // Attributes and tags
  const [attributes, setAttributes] = useState<Array<{ trait_type: string; value: string }>>([
    { trait_type: 'Duration', value: `${Math.floor(audioData.duration)}s` },
    { trait_type: 'Type', value: 'Audio NFT' },
  ]);
  const [tags, setTags] = useState<string[]>(['ringtone', 'audio']);
  const [newTag, setNewTag] = useState('');

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAIGenerate = async () => {
    if (!generatePrompt.trim()) {
      alert('Please enter a description for your cover art');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: generatePrompt,
          style: generateStyle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate cover art');
      }

      const data = await response.json();
      setCoverImagePreview(data.imageUrl);
      setShowGenerateModal(false);
      setGeneratePrompt('');
    } catch (error: any) {
      console.error('Error generating cover art:', error);
      alert(error.message || 'Failed to generate cover art');
    } finally {
      setIsGenerating(false);
    }
  };

  const addAttribute = () => {
    setAttributes([...attributes, { trait_type: '', value: '' }]);
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const updated = [...attributes];
    updated[index][field] = value;
    setAttributes(updated);
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const canProceedFromMetadata = () => {
    return name.trim() && symbol.trim() && artistName.trim() && description.trim();
  };

  const handleMint = async () => {
    if (!canProceedFromMetadata()) {
      alert('Please fill in all required fields');
      return;
    }

    const packagedData: PackagedNFTData = {
      name,
      symbol,
      description,
      artistName,
      audioUrl: audioData.audioUrl,
      coverImage: coverImagePreview || undefined,
      duration: audioData.duration,
      nftType,
      royaltyPercentage,
      bondingCurve,
      attributes: attributes.filter(attr => attr.trait_type && attr.value),
      tags,
    };

    setIsMinting(true);
    try {
      await onMint(packagedData);
      onClose();
    } catch (error) {
      console.error('Minting failed:', error);
      alert('Failed to mint NFT. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Package & Mint NFT</h2>
                <p className="text-purple-100 text-sm">Prepare your audio for the blockchain</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={isMinting}
            >
              <X size={24} />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="mt-6 flex items-center justify-between max-w-md mx-auto">
            {[
              { id: 'metadata', label: 'Metadata' },
              { id: 'configure', label: 'Configure' },
              { id: 'review', label: 'Review & Mint' },
            ].map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    currentStep === step.id
                      ? 'bg-white text-purple-600 border-white'
                      : 'bg-purple-600 text-white border-purple-400'
                  }`}
                >
                  {index + 1}
                </div>
                {index < 2 && (
                  <div className="w-16 h-0.5 bg-purple-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* Step 1: Metadata */}
          {currentStep === 'metadata' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
                      <Music size={16} />
                      Track Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Awesome Ringtone"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
                      <Tag size={16} />
                      Symbol *
                    </label>
                    <input
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      placeholder="RING"
                      maxLength={10}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground uppercase"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Short identifier (e.g., DIAL, TONE)
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
                      <User size={16} />
                      Artist Name *
                    </label>
                    <input
                      type="text"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      placeholder="Your artist name"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
                      <ImageIcon size={16} />
                      Cover Image
                    </label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                      {coverImagePreview ? (
                        <div className="relative">
                          <img
                            src={coverImagePreview}
                            alt="Cover"
                            className="w-full h-48 object-cover rounded"
                          />
                          <button
                            onClick={() => setCoverImagePreview(null)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload size={32} className="mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Upload or generate cover art</p>
                          
                          <div className="flex gap-2 mt-3">
                            <label className="flex-1 cursor-pointer">
                              <div className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2">
                                <Upload size={16} />
                                <span className="text-sm">Upload</span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleCoverImageUpload}
                                className="hidden"
                              />
                            </label>
                            <button
                              onClick={() => setShowGenerateModal(true)}
                              disabled={isGenerating}
                              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <Sparkles size={16} />
                              <span className="text-sm">Generate</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
                  <FileText size={16} />
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your audio NFT..."
                  rows={4}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
                  <Tag size={16} />
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add a tag..."
                    className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-primary/70">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Configure */}
          {currentStep === 'configure' && (
            <div className="space-y-6">
              {/* NFT Type Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block text-foreground">NFT Type</label>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    {
                      value: 'master-edition',
                      title: 'Master Edition',
                      description: 'Limited supply, higher value',
                      icon: '👑',
                    },
                    {
                      value: 'sft',
                      title: 'Semi-Fungible',
                      description: 'Multiple identical copies',
                      icon: '📦',
                    },
                    {
                      value: 'cnft',
                      title: 'Compressed NFT',
                      description: 'Low-cost, high volume',
                      icon: '⚡',
                    },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setNftType(type.value as typeof nftType)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        nftType === type.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{type.icon}</div>
                      <h4 className="font-semibold mb-1 text-foreground">{type.title}</h4>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Royalty Percentage */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
                  <DollarSign size={16} />
                  Royalty Percentage
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={royaltyPercentage}
                    onChange={(e) => setRoyaltyPercentage(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-lg font-semibold text-foreground w-16 text-right">
                    {royaltyPercentage}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll earn {royaltyPercentage}% on all secondary sales
                </p>
              </div>

              {/* Bonding Curve */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Pricing Configuration</h3>
                <BondingCurveConfigurator
                  initialConfig={bondingCurve}
                  currentEdition={0}
                  totalSupply={bondingCurve.maxSupply}
                  editable={true}
                  onConfigChange={setBondingCurve}
                />
              </div>

              {/* Custom Attributes */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-3 text-foreground">
                  <Sparkles size={16} />
                  Custom Attributes
                </label>
                <div className="space-y-2">
                  {attributes.map((attr, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={attr.trait_type}
                        onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                        placeholder="Trait name"
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      />
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      />
                      <button
                        onClick={() => removeAttribute(index)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addAttribute}
                    className="w-full py-2 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    + Add Attribute
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-foreground">
                  <p className="font-medium mb-1">Ready to Mint</p>
                  <p className="text-muted-foreground">
                    Review your NFT details below. Once minted, these cannot be changed.
                  </p>
                </div>
              </div>

              {/* NFT Preview Card */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 h-48 flex items-center justify-center relative">
                  {coverImagePreview ? (
                    <img src={coverImagePreview} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <Music size={64} className="text-white/50" />
                  )}
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium">
                    {nftType === 'master-edition' ? '👑 Master' : nftType === 'sft' ? '📦 SFT' : '⚡ cNFT'}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2 text-foreground">{name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">by {artistName}</p>
                  <p className="text-foreground mb-4">{description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Symbol</p>
                      <p className="font-semibold text-foreground">{symbol}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Duration</p>
                      <p className="font-semibold text-foreground">{Math.floor(audioData.duration)}s</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Initial Price</p>
                      <p className="font-semibold text-primary">
                        {formatLamportsToSOL(bondingCurve.basePrice, 4)} SOL
                      </p>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Royalties</p>
                      <p className="font-semibold text-foreground">{royaltyPercentage}%</p>
                    </div>
                  </div>

                  {attributes.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2 text-foreground">Attributes</p>
                      <div className="grid grid-cols-2 gap-2">
                        {attributes.map((attr, index) => (
                          <div key={index} className="bg-secondary rounded px-3 py-2 text-sm">
                            <span className="text-muted-foreground">{attr.trait_type}:</span>{' '}
                            <span className="font-medium text-foreground">{attr.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-foreground">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Costs */}
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-foreground">Estimated Costs</h4>
                <div className="space-y-2 text-sm">
                  {(() => {
                    // Calculate costs dynamically
                    const LAMPORTS_PER_SOL = 1_000_000_000;
                    
                    // NFT costs based on type
                    const nftMintingCost = nftType === 'master-edition' ? 0.02 : nftType === 'sft' ? 0.015 : 0.001;
                    const metadataStorageCost = 0.002;
                    const networkFees = 0.001;
                    
                    // Bonding curve price (current edition price)
                    const bondingCurvePrice = bondingCurve.basePrice / LAMPORTS_PER_SOL;
                    
                    // Total
                    const total = nftMintingCost + metadataStorageCost + networkFees + bondingCurvePrice;
                    
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">NFT Minting</span>
                          <span className="font-medium text-foreground">~{nftMintingCost.toFixed(4)} SOL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Metadata Storage</span>
                          <span className="font-medium text-foreground">~{metadataStorageCost.toFixed(4)} SOL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Network Fees</span>
                          <span className="font-medium text-foreground">~{networkFees.toFixed(4)} SOL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bonding Curve Purchase</span>
                          <span className="font-medium text-primary">~{bondingCurvePrice.toFixed(4)} SOL</span>
                        </div>
                        <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold">
                          <span className="text-foreground">Total</span>
                          <span className="text-primary">~{total.toFixed(4)} SOL</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 bg-muted/30 flex-shrink-0">
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                if (currentStep === 'metadata') {
                  onClose();
                } else if (currentStep === 'configure') {
                  setCurrentStep('metadata');
                } else {
                  setCurrentStep('configure');
                }
              }}
              className="px-6 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-foreground"
              disabled={isMinting}
            >
              {currentStep === 'metadata' ? 'Cancel' : 'Back'}
            </button>

            <button
              onClick={() => {
                if (currentStep === 'metadata') {
                  if (canProceedFromMetadata()) {
                    setCurrentStep('configure');
                  } else {
                    alert('Please fill in all required fields');
                  }
                } else if (currentStep === 'configure') {
                  setCurrentStep('review');
                } else {
                  handleMint();
                }
              }}
              className="px-8 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              disabled={isMinting || (currentStep === 'metadata' && !canProceedFromMetadata())}
            >
              {isMinting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Minting...
                </span>
              ) : currentStep === 'review' ? (
                'Mint NFT'
              ) : (
                'Next'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="text-primary" size={20} />
                Generate Cover Art
              </h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                disabled={isGenerating}
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Describe your cover art
                </label>
                <textarea
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder="e.g., A vibrant abstract design with musical notes, neon colors and digital waves..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-foreground"
                  rows={3}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Style</label>
                <select
                  value={generateStyle}
                  onChange={(e) => setGenerateStyle(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  disabled={isGenerating}
                >
                  <option value="meme">Meme Style</option>
                  <option value="sticker">Sticker/Die Cut</option>
                  <option value="anime">Anime</option>
                  <option value="pepe">Pepe</option>
                  <option value="wojak">Wojak</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setShowGenerateModal(false)}
                disabled={isGenerating}
                className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAIGenerate}
                disabled={isGenerating || !generatePrompt.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

