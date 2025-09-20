'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Loader2, 
  Check, 
  AlertCircle,
  ExternalLink,
  Hash,
  DollarSign
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { uploadFileToAPI, uploadJsonToAPI } from '@/lib/pinata'
import { useMintNFT } from '@/lib/hooks/useMintNFT'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface FormData {
  name: string
  description: string
  image: File | null
  imagePreview: string
  attributes: Array<{ trait_type: string; value: string }>
  royalty: string
}

interface MintResult {
  tokenId: string
  transactionHash: string
  tokenURI: string
  ipfsUrl: string
}

export default function MintPage() {
  const { address, isConnected } = useAccount()
  const [isUploading, setIsUploading] = useState(false)
  const [mintResult, setMintResult] = useState<MintResult | null>(null)
  const [currentStep, setCurrentStep] = useState<'form' | 'uploading' | 'minting' | 'success' | 'error'>('form')
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    image: null,
    imagePreview: '',
    attributes: [{ trait_type: '', value: '' }],
    royalty: '5',
  })

  const { mintNFT, isLoading: isMinting } = useMintNFT({
    onSuccess: (tokenId, transactionHash) => {
      setMintResult(prev => prev ? {
        ...prev,
        tokenId,
        transactionHash
      } : null)
      setCurrentStep('success')
      toast.success(`NFT minted successfully! Token ID: ${tokenId}`)
    },
    onError: (error) => {
      console.error('Minting failed:', error)
      setCurrentStep('error')
    }
  })

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
        return
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast.error('File size too large. Maximum size is 10MB.')
        return
      }

      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }))
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles: 1,
  })

  const addAttribute = () => {
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }],
    }))
  }

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      ),
    }))
  }

  const removeAttribute = (index: number) => {
    if (formData.attributes.length > 1) {
      setFormData(prev => ({
        ...prev,
        attributes: prev.attributes.filter((_, i) => i !== index),
      }))
    }
  }

  const validateForm = (): boolean => {
    if (!formData.image) {
      toast.error('Please select an image file')
      return false
    }
    if (!formData.name.trim()) {
      toast.error('Please enter a name for your NFT')
      return false
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a description for your NFT')
      return false
    }
    if (formData.royalty && (isNaN(Number(formData.royalty)) || Number(formData.royalty) < 0 || Number(formData.royalty) > 100)) {
      toast.error('Royalty must be a number between 0 and 100')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsUploading(true)
    setCurrentStep('uploading')

    try {
      // Step 1: Upload image to IPFS
      toast.loading('Uploading image to IPFS...')
      const imageResult = await uploadFileToAPI(formData.image!, {
        name: `${formData.name}-image`,
        keyvalues: { type: 'nft-image', name: formData.name },
      })

      // Step 2: Create and upload metadata JSON
      toast.loading('Uploading metadata to IPFS...')
      const validAttributes = formData.attributes.filter(attr => 
        attr.trait_type.trim() && attr.value.trim()
      )

      const metadata = {
        name: formData.name,
        description: formData.description,
        image: imageResult.ipfsUrl,
        attributes: validAttributes.map(attr => ({
          trait_type: attr.trait_type,
          value: attr.value
        })),
        external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/nft/`,
        background_color: '000000',
        ...(formData.royalty && {
          seller_fee_basis_points: Math.round(Number(formData.royalty) * 100),
          fee_recipient: address
        })
      }

      const metadataResult = await uploadJsonToAPI(metadata, {
        name: `${formData.name}-metadata`,
        keyvalues: { type: 'nft-metadata', name: formData.name },
      })

      setMintResult({
        tokenId: '',
        transactionHash: '',
        tokenURI: metadataResult.tokenURI!,
        ipfsUrl: metadataResult.ipfsUrl
      })

      setIsUploading(false)
      setCurrentStep('minting')
      toast.dismiss()
      toast.success('Files uploaded successfully! Now minting NFT...')

      // Step 3: Mint NFT on blockchain
      await mintNFT(metadataResult.tokenURI!)

    } catch (error) {
      console.error('Error creating NFT:', error)
      setIsUploading(false)
      setCurrentStep('error')
      toast.dismiss()
      toast.error('Failed to create NFT. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: null,
      imagePreview: '',
      attributes: [{ trait_type: '', value: '' }],
      royalty: '5',
    })
    setMintResult(null)
    setCurrentStep('form')
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to mint NFTs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You need to connect your wallet to access the minting feature.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentStep === 'success' && mintResult) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Check className="w-6 h-6" />
                NFT Minted Successfully!
              </CardTitle>
              <CardDescription>
                Your NFT has been created and is now live on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Token ID</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Hash className="w-4 h-4" />
                    <span className="font-mono">{mintResult.tokenId}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Transaction Hash</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-mono text-xs truncate">
                      {mintResult.transactionHash.slice(0, 10)}...{mintResult.transactionHash.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Metadata URL</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <FileText className="w-4 h-4" />
                  <span className="font-mono text-xs truncate">{mintResult.tokenURI}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="flex-1">
                  <Link href="/market">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View in Marketplace
                  </Link>
                </Button>
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  Mint Another NFT
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (currentStep === 'error') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-6 h-6" />
                Minting Failed
              </CardTitle>
              <CardDescription>
                There was an error minting your NFT. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button onClick={resetForm} variant="outline" className="flex-1">
                  Start Over
                </Button>
                <Button onClick={() => setCurrentStep('form')} className="flex-1">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-6 h-6" />
              Mint New NFT
            </CardTitle>
            <CardDescription>
              Create and upload your unique digital artwork to the blockchain
            </CardDescription>
            
            {/* Progress Steps */}
            <div className="flex items-center gap-2 mt-4">
              <Badge variant={currentStep === 'form' ? 'default' : 'secondary'}>
                1. Form
              </Badge>
              <Badge variant={currentStep === 'uploading' ? 'default' : 'secondary'}>
                2. Upload
              </Badge>
              <Badge variant={currentStep === 'minting' ? 'default' : 'secondary'}>
                3. Mint
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Image *</Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  {formData.imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-muted-foreground">
                        {formData.image?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formData.image && (formData.image.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {isDragActive ? 'Drop the file here' : 'Drag & drop an image here'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          or click to select a file (Max 10MB, JPG/PNG/GIF/WebP)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter NFT name"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your NFT"
                  className="w-full min-h-[100px] px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  required
                />
              </div>

              {/* Royalty */}
              <div className="space-y-2">
                <Label htmlFor="royalty" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Royalty Percentage (Optional)
                </Label>
                <Input
                  id="royalty"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.royalty}
                  onChange={(e) => setFormData(prev => ({ ...prev, royalty: e.target.value }))}
                  placeholder="e.g., 5 (for 5%)"
                />
                <p className="text-xs text-muted-foreground">
                  Percentage of future sales you'll receive as the creator (0-100%)
                </p>
              </div>

              {/* Attributes */}
              <div className="space-y-2">
                <Label>Attributes (Optional)</Label>
                <div className="space-y-3">
                  {formData.attributes.map((attr, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Trait type (e.g., Color)"
                        value={attr.trait_type}
                        onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                      />
                      <Input
                        placeholder="Value (e.g., Blue)"
                        value={attr.value}
                        onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeAttribute(index)}
                        disabled={formData.attributes.length === 1}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addAttribute}
                    className="w-full"
                  >
                    Add Attribute
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isUploading || isMinting || !formData.image || !formData.name || !formData.description}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading to IPFS...
                  </>
                ) : isMinting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Minting NFT...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Create NFT
                  </>
                )}
              </Button>

              {/* Help Text */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Your NFT will be minted on the blockchain</p>
                <p>• Files are stored on IPFS for decentralized access</p>
                <p>• You'll retain ownership and can trade on the marketplace</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}