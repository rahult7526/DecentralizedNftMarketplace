# Soroban (Stellar) Migration Plan

This comprehensive plan outlines the migration from Ethereum/Solidity contracts to Stellar's Soroban smart contracts platform, including frontend provider abstraction for seamless blockchain switching.

## 🌟 Overview: Ethereum to Soroban Migration

### Current Architecture (Ethereum)
```
Frontend (Next.js) ←→ Wagmi/Ethers ←→ Ethereum RPC ←→ Solidity Contracts
     ↕                                                        ↕
   IPFS Metadata                                         ERC-721 + Marketplace
```

### Target Architecture (Soroban)
```
Frontend (Next.js) ←→ Provider Abstraction ←→ Stellar RPC ←→ Soroban Contracts
     ↕                                                           ↕
   IPFS Metadata                                       Soroban Token + Marketplace
```

## 📊 Functionality Mapping: Solidity to Soroban

### 1. Token Standard Mapping

#### Current: ERC-721 NFT Contract
```solidity
// DeNftToken.sol - Ethereum ERC-721
contract DeNftToken is ERC721, ERC721URIStorage, Ownable, Pausable {
    mapping(uint256 => string) private _tokenURIs;
    
    function mint(address to, string memory tokenURI) external;
    function ownerOf(uint256 tokenId) external view returns (address);
    function approve(address to, uint256 tokenId) external;
}
```

#### Target: Soroban Token Contract
```rust
// nft_token.rs - Soroban Implementation
use soroban_sdk::{contract, contractimpl, Address, String, Map};

#[contract]
pub struct NFTContract;

#[contractimpl]
impl NFTContract {
    // Mint new NFT
    pub fn mint(env: Env, to: Address, token_id: u64, metadata_uri: String) -> Result<(), Error>;
    
    // Get owner of token
    pub fn owner_of(env: Env, token_id: u64) -> Result<Address, Error>;
    
    // Approve spender for token
    pub fn approve(env: Env, spender: Address, token_id: u64) -> Result<(), Error>;
    
    // Transfer token
    pub fn transfer_from(env: Env, from: Address, to: Address, token_id: u64) -> Result<(), Error>;
}
```

**Key Differences:**
- **Storage**: Soroban uses `Storage` API instead of Solidity mappings
- **Types**: Rust types (`u64`, `String`) instead of Solidity types
- **Error Handling**: Rust `Result<T, Error>` pattern
- **Authorization**: Soroban's built-in authorization system

### 2. Marketplace Contract Mapping

#### Current: Solidity Marketplace
```solidity
contract NFTMarketplace {
    struct Listing {
        bytes32 id;
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
    }
    
    function listItem(address nftContract, uint256 tokenId, uint256 price) external;
    function buyNow(bytes32 listingId) external payable;
    function createAuction(address nftContract, uint256 tokenId, uint256 startingBid, uint256 duration) external;
}
```

#### Target: Soroban Marketplace
```rust
// marketplace.rs - Soroban Implementation
use soroban_sdk::{contract, contractimpl, Address, Map, Vec};

#[derive(Clone)]
pub struct Listing {
    pub id: u64,
    pub nft_contract: Address,
    pub token_id: u64,
    pub seller: Address,
    pub price: i128,
    pub is_active: bool,
}

#[contract]
pub struct MarketplaceContract;

#[contractimpl]
impl MarketplaceContract {
    pub fn list_item(
        env: Env,
        nft_contract: Address,
        token_id: u64,
        price: i128
    ) -> Result<u64, Error>;
    
    pub fn buy_now(env: Env, listing_id: u64) -> Result<(), Error>;
    
    pub fn create_auction(
        env: Env,
        nft_contract: Address,
        token_id: u64,
        starting_bid: i128,
        duration: u64
    ) -> Result<u64, Error>;
}
```

### 3. Metadata & IPFS Integration

**Status**: ✅ **UNCHANGED**
- IPFS metadata storage remains identical
- Same JSON metadata structure
- Same Pinata integration
- Same frontend file upload process

```json
// Metadata format (same for both chains)
{
  "name": "NFT Name",
  "description": "NFT Description",
  "image": "ipfs://QmHash...",
  "attributes": [...]
}
```

### 4. Wallet Integration Changes

#### Current: Ethereum Wallets
```typescript
// Ethereum wallet integration
import { useAccount, useConnect } from 'wagmi'
import { MetaMaskConnector, WalletConnectConnector } from 'wagmi/connectors'

const { connect } = useConnect({
  connector: new MetaMaskConnector(),
})
```

#### Target: Stellar Wallets
```typescript
// Stellar wallet integration
import { 
  isConnected, 
  getPublicKey, 
  signTransaction 
} from '@stellar/freighter-api'

// Freighter wallet (most popular Stellar wallet)
const connectFreighter = async () => {
  if (await isConnected()) {
    const publicKey = await getPublicKey()
    return publicKey
  }
}

// Alternative: Albedo wallet
import { albedo } from '@albedo-link/intent'
const connectAlbedo = async () => {
  const result = await albedo.publicKey()
  return result.pubkey
}
```

**Supported Stellar Wallets:**
- **Freighter**: Browser extension (like MetaMask for Stellar)
- **Albedo**: Web-based wallet
- **Lobstr**: Mobile wallet with WalletConnect
- **XBULL**: Advanced Stellar wallet

## 🏗️ Provider Abstraction Architecture

### Frontend Provider Abstraction Layer

Create a unified interface that abstracts blockchain-specific implementations:

```typescript
// lib/blockchain/types.ts
export interface BlockchainProvider {
  // Network info
  getNetwork(): Promise<NetworkInfo>
  
  // Wallet operations
  connectWallet(): Promise<string>
  getBalance(address: string): Promise<string>
  
  // NFT operations
  mintNFT(to: string, metadata: string): Promise<TransactionResult>
  transferNFT(from: string, to: string, tokenId: string): Promise<TransactionResult>
  
  // Marketplace operations
  listItem(nftContract: string, tokenId: string, price: string): Promise<TransactionResult>
  buyItem(listingId: string, price: string): Promise<TransactionResult>
  
  // Event listening
  subscribeToEvents(eventType: string, callback: EventCallback): void
}

export interface NetworkInfo {
  chainId: string
  name: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

export interface TransactionResult {
  hash: string
  status: 'pending' | 'success' | 'failed'
  blockNumber?: number
}
```

### Ethereum Provider Implementation

```typescript
// lib/blockchain/providers/ethereum.ts
import { ethers } from 'ethers'
import { BlockchainProvider, NetworkInfo, TransactionResult } from '../types'

export class EthereumProvider implements BlockchainProvider {
  private provider: ethers.Provider
  private signer?: ethers.Signer
  
  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl)
  }
  
  async getNetwork(): Promise<NetworkInfo> {
    const network = await this.provider.getNetwork()
    return {
      chainId: network.chainId.toString(),
      name: network.name,
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      }
    }
  }
  
  async connectWallet(): Promise<string> {
    if (!window.ethereum) throw new Error('No Ethereum wallet found')
    
    const provider = new ethers.BrowserProvider(window.ethereum)
    this.signer = await provider.getSigner()
    return await this.signer.getAddress()
  }
  
  async mintNFT(to: string, metadata: string): Promise<TransactionResult> {
    if (!this.signer) throw new Error('Wallet not connected')
    
    const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, this.signer)
    const tx = await contract.mint(to, metadata)
    
    return {
      hash: tx.hash,
      status: 'pending'
    }
  }
  
  async listItem(nftContract: string, tokenId: string, price: string): Promise<TransactionResult> {
    if (!this.signer) throw new Error('Wallet not connected')
    
    const contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, this.signer)
    const tx = await contract.listItem(nftContract, tokenId, ethers.parseEther(price))
    
    return {
      hash: tx.hash,
      status: 'pending'
    }
  }
  
  // ... other methods
}
```

### Soroban Provider Implementation

```typescript
// lib/blockchain/providers/soroban.ts
import { 
  Server, 
  Keypair, 
  TransactionBuilder, 
  Operation,
  Account,
  Networks
} from 'stellar-sdk'
import { BlockchainProvider, NetworkInfo, TransactionResult } from '../types'

export class SorobanProvider implements BlockchainProvider {
  private server: Server
  private keypair?: Keypair
  
  constructor(rpcUrl: string) {
    this.server = new Server(rpcUrl)
  }
  
  async getNetwork(): Promise<NetworkInfo> {
    return {
      chainId: 'stellar-testnet',
      name: 'Stellar Testnet',
      nativeCurrency: {
        name: 'Lumen',
        symbol: 'XLM',
        decimals: 7
      }
    }
  }
  
  async connectWallet(): Promise<string> {
    // Use Freighter wallet
    const { isConnected, getPublicKey } = await import('@stellar/freighter-api')
    
    if (await isConnected()) {
      const publicKey = await getPublicKey()
      return publicKey
    }
    
    throw new Error('Freighter wallet not connected')
  }
  
  async mintNFT(to: string, metadata: string): Promise<TransactionResult> {
    // Build Soroban contract invocation
    const account = await this.server.getAccount(this.getPublicKey())
    
    const transaction = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: Networks.TESTNET
    })
    .addOperation(
      Operation.invokeContract({
        contract: NFT_CONTRACT_ID,
        method: 'mint',
        args: [to, metadata]
      })
    )
    .setTimeout(30)
    .build()
    
    // Sign with Freighter
    const { signTransaction } = await import('@stellar/freighter-api')
    const signedTx = await signTransaction(transaction.toXDR(), {
      networkPassphrase: Networks.TESTNET
    })
    
    const result = await this.server.submitTransaction(signedTx)
    
    return {
      hash: result.hash,
      status: result.successful ? 'success' : 'failed'
    }
  }
  
  // ... other methods
}
```

### Provider Factory & Context

```typescript
// lib/blockchain/provider-factory.ts
import { BlockchainProvider } from './types'
import { EthereumProvider } from './providers/ethereum'
import { SorobanProvider } from './providers/soroban'

export type SupportedChain = 'ethereum' | 'soroban'

export class ProviderFactory {
  static create(chain: SupportedChain, rpcUrl: string): BlockchainProvider {
    switch (chain) {
      case 'ethereum':
        return new EthereumProvider(rpcUrl)
      case 'soroban':
        return new SorobanProvider(rpcUrl)
      default:
        throw new Error(`Unsupported chain: ${chain}`)
    }
  }
}

// React Context for provider
import { createContext, useContext, ReactNode } from 'react'

interface BlockchainContextType {
  provider: BlockchainProvider
  currentChain: SupportedChain
  switchChain: (chain: SupportedChain) => void
}

const BlockchainContext = createContext<BlockchainContextType | null>(null)

export function BlockchainProvider({ 
  children, 
  initialChain = 'ethereum' 
}: { 
  children: ReactNode
  initialChain?: SupportedChain 
}) {
  const [currentChain, setCurrentChain] = useState(initialChain)
  const [provider, setProvider] = useState(
    () => ProviderFactory.create(currentChain, getRpcUrl(currentChain))
  )
  
  const switchChain = useCallback((chain: SupportedChain) => {
    setCurrentChain(chain)
    setProvider(ProviderFactory.create(chain, getRpcUrl(chain)))
  }, [])
  
  return (
    <BlockchainContext.Provider value={{ provider, currentChain, switchChain }}>
      {children}
    </BlockchainContext.Provider>
  )
}

export const useBlockchain = () => {
  const context = useContext(BlockchainContext)
  if (!context) throw new Error('useBlockchain must be used within BlockchainProvider')
  return context
}
```

## 📋 Step-by-Step Migration Plan

### Phase 1: Soroban Contract Development

#### Step 1.1: Set Up Soroban Development Environment
```bash
# Install Rust and Soroban CLI
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install --locked soroban-cli

# Create Soroban project
soroban contract init soroban-nft-marketplace
cd soroban-nft-marketplace

# Project structure
mkdir contracts
mkdir contracts/nft-token
mkdir contracts/marketplace
```

#### Step 1.2: Implement NFT Token Contract
```bash
# Create NFT contract
cd contracts/nft-token
soroban contract init .

# Implement nft_token.rs with Soroban token standards
# Test contract locally
soroban contract build
soroban test
```

**Key Implementation Files:**
- `contracts/nft-token/src/lib.rs` - Main NFT contract
- `contracts/nft-token/src/storage.rs` - Data storage management
- `contracts/nft-token/src/metadata.rs` - Token metadata handling
- `contracts/nft-token/src/events.rs` - Event definitions

#### Step 1.3: Implement Marketplace Contract
```bash
# Create marketplace contract
cd ../marketplace
soroban contract init .

# Implement marketplace.rs with listing/auction functionality
# Test integration with NFT contract
soroban contract build
soroban test
```

#### Step 1.4: Deploy to Soroban Testnet
```bash
# Configure Soroban CLI for testnet
soroban network add testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Create test identity
soroban identity generate deployer
soroban identity fund deployer --network testnet

# Deploy NFT contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nft_token.wasm \
  --network testnet \
  --source deployer

# Deploy marketplace contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/marketplace.wasm \
  --network testnet \
  --source deployer
```

### Phase 2: Frontend Provider Abstraction

#### Step 2.1: Create Provider Abstraction Layer
```bash
# Create provider abstraction files
mkdir -p app-client/lib/blockchain/{types,providers,hooks}

# Implement base provider interface
touch app-client/lib/blockchain/types.ts
touch app-client/lib/blockchain/provider-factory.ts

# Implement Ethereum provider (existing)
touch app-client/lib/blockchain/providers/ethereum.ts

# Implement Soroban provider (new)
touch app-client/lib/blockchain/providers/soroban.ts
```

#### Step 2.2: Install Soroban Dependencies
```bash
cd app-client

# Install Stellar SDK
npm install stellar-sdk @stellar/freighter-api

# Install additional Soroban tools
npm install @stellar/wallet-sdk
```

#### Step 2.3: Implement Provider Switching UI
```typescript
// components/ChainSwitcher.tsx
export function ChainSwitcher() {
  const { currentChain, switchChain } = useBlockchain()
  
  return (
    <Select value={currentChain} onValueChange={switchChain}>
      <SelectItem value="ethereum">
        <div className="flex items-center">
          <EthereumIcon className="mr-2" />
          Ethereum
        </div>
      </SelectItem>
      <SelectItem value="soroban">
        <div className="flex items-center">
          <StellarIcon className="mr-2" />
          Stellar (Soroban)
        </div>
      </SelectItem>
    </Select>
  )
}
```

#### Step 2.4: Update Existing Components
```bash
# Update components to use provider abstraction
# Instead of direct ethers/wagmi calls, use useBlockchain hook

# Update files:
# - components/NFTMintForm.tsx
# - components/MarketplaceListing.tsx
# - components/AuctionComponent.tsx
# - hooks/useNFTContract.ts
# - hooks/useMarketplace.ts
```

### Phase 3: Integration & Testing

#### Step 3.1: Environment Configuration
```bash
# Add Soroban environment variables
echo "NEXT_PUBLIC_STELLAR_NETWORK=testnet" >> .env.local
echo "NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443" >> .env.local
echo "NEXT_PUBLIC_NFT_CONTRACT_ID_SOROBAN=<deployed_contract_id>" >> .env.local
echo "NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID_SOROBAN=<deployed_contract_id>" >> .env.local
```

#### Step 3.2: Comprehensive Testing
```bash
# Test Ethereum provider (existing functionality)
pnpm test:ethereum-provider

# Test Soroban provider (new functionality)
pnpm test:soroban-provider

# Test provider switching
pnpm test:provider-switching

# Test cross-chain metadata compatibility
pnpm test:metadata-compatibility
```

#### Step 3.3: User Acceptance Testing
- Test wallet connections for both chains
- Test NFT minting on both chains
- Test marketplace operations on both chains
- Test chain switching functionality
- Verify IPFS metadata works on both chains

### Phase 4: Production Deployment

#### Step 4.1: Mainnet Deployment
```bash
# Deploy to Stellar mainnet
soroban network add mainnet \
  --rpc-url https://soroban-mainnet.stellar.org:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015"

# Deploy production contracts
soroban contract deploy --network mainnet --source deployer
```

#### Step 4.2: Frontend Updates
```bash
# Update production environment variables
# Deploy frontend with dual-chain support
pnpm vercel:deploy
```

## 🔄 Migration Benefits

### Technical Benefits
- **Multi-chain Support**: Users can choose their preferred blockchain
- **Lower Transaction Costs**: Stellar typically has lower fees than Ethereum
- **Faster Finality**: Stellar has 3-5 second finality vs Ethereum's minutes
- **Built-in DEX**: Stellar has native asset exchange capabilities

### Business Benefits
- **Expanded User Base**: Access to Stellar ecosystem users
- **Cost Efficiency**: Lower operational costs for users
- **Innovation**: Access to Soroban's unique features
- **Risk Mitigation**: Multi-chain reduces single-chain dependency

### User Benefits
- **Choice**: Users can pick their preferred blockchain
- **Lower Fees**: Significantly reduced transaction costs on Stellar
- **Speed**: Faster transaction confirmations
- **Simplified UX**: Same frontend interface for both chains

## 🎯 Success Metrics

### Phase 1 Success Criteria
- [ ] NFT contract deployed and functional on Soroban testnet
- [ ] Marketplace contract deployed and functional on Soroban testnet
- [ ] All existing functionality replicated in Soroban
- [ ] Comprehensive test suite passing

### Phase 2 Success Criteria
- [ ] Provider abstraction layer implemented
- [ ] Ethereum provider working (no regression)
- [ ] Soroban provider implemented and working
- [ ] Chain switching UI functional
- [ ] All components updated to use abstraction

### Phase 3 Success Criteria
- [ ] Both chains working in production
- [ ] Users can seamlessly switch between chains
- [ ] No functionality loss during migration
- [ ] Performance metrics maintained or improved

## 📚 Resources & Documentation

### Soroban Development
- [Soroban Documentation](https://soroban.stellar.org/docs)
- [Soroban CLI Reference](https://soroban.stellar.org/docs/reference/soroban-cli)
- [Rust Smart Contracts](https://soroban.stellar.org/docs/fundamentals-and-concepts/built-in-types)

### Stellar Integration
- [Stellar SDK](https://stellar.github.io/js-stellar-sdk/)
- [Freighter Wallet API](https://docs.freighter.app/)
- [Stellar Network Overview](https://developers.stellar.org/docs/fundamentals-and-concepts/stellar-stack)

### Migration Timeline
- **Phase 1**: 3-4 weeks (Soroban contract development)
- **Phase 2**: 2-3 weeks (Frontend abstraction)
- **Phase 3**: 2 weeks (Integration & testing)  
- **Phase 4**: 1 week (Production deployment)

**Total Estimated Timeline**: 8-10 weeks for complete migration

This migration plan provides a comprehensive path to multi-chain support while maintaining existing Ethereum functionality and providing users with blockchain choice.