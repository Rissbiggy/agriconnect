import { ethers } from 'ethers';
import { log } from './vite';
import { BlockchainTransaction, InsertBlockchainTransaction } from '@shared/schema';
import { db } from './db';
import { blockchainTransactions, products, orders } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Smart contract ABI (simplified for demonstration)
const AgriConnectABI = [
  // Events
  "event TransactionCreated(string id, address from, address to, uint256 amount, uint256 timestamp, uint256 productId, uint256 orderId)",
  "event TransactionConfirmed(string id, string txHash, uint256 blockNumber)",
  
  // Functions
  "function createTransaction(string id, address to, uint256 amount, uint256 productId, uint256 orderId) returns (bool)",
  "function confirmDelivery(string id) returns (bool)",
  "function getTransaction(string id) view returns (address from, address to, uint256 amount, uint256 timestamp, uint256 status, string txHash)"
];

// Mock contract address (replace with actual deployed contract address in production)
const CONTRACT_ADDRESS = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

class BlockchainService {
  private provider: ethers.providers.Provider | null = null;
  private contract: ethers.Contract | null = null;
  private signer: ethers.Signer | null = null;
  private networkId: string = 'testnet'; // Default to testnet
  private transactions: Map<string, BlockchainTransaction> = new Map();
  
  constructor() {
    this.initProvider();
  }
  
  // Initialize blockchain provider
  private async initProvider() {
    try {
      // Check for provider URL from environment
      const providerUrl = process.env.BLOCKCHAIN_PROVIDER_URL;
      
      if (providerUrl) {
        // For production, use real provider
        if (providerUrl.includes('infura')) {
          this.provider = new ethers.providers.InfuraProvider(
            process.env.BLOCKCHAIN_NETWORK || 'sepolia',
            process.env.INFURA_API_KEY
          );
        } else {
          this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
        }
        
        // Get network ID
        const network = await this.provider.getNetwork();
        this.networkId = network.name !== 'unknown' ? network.name : network.chainId.toString();
        
        // Initialize contract
        if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
          this.signer = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, this.provider);
          this.contract = new ethers.Contract(CONTRACT_ADDRESS, AgriConnectABI, this.signer);
        } else {
          this.contract = new ethers.Contract(CONTRACT_ADDRESS, AgriConnectABI, this.provider);
        }
        
        log(`Blockchain service initialized with provider on network: ${this.networkId}`, 'blockchain');
      } else {
        // For development/testing without a blockchain
        log('No blockchain provider URL found. Running in simulation mode.', 'blockchain');
      }
    } catch (error: any) {
      log(`Error initializing blockchain provider: ${error.message}`, 'blockchain');
    }
  }
  
  // Create a new transaction on the blockchain
  async createTransaction(
    fromAddress: string,
    toAddress: string,
    amount: number,
    productId?: number,
    orderId?: number,
    userId?: number
  ): Promise<BlockchainTransaction> {
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create transaction object for database
    const transactionData: InsertBlockchainTransaction = {
      id: txId,
      fromAddress,
      toAddress,
      amount,
      productId,
      orderId,
      userId,
      networkId: this.networkId
    };
    
    try {
      // First insert into database
      const [dbTransaction] = await db.insert(blockchainTransactions)
        .values(transactionData)
        .returning();
      
      if (this.contract && this.signer) {
        // Real blockchain interaction
        const tx = await this.contract.createTransaction(
          txId,
          toAddress,
          ethers.utils.parseEther(amount.toString()),
          productId || 0,
          orderId || 0
        );
        
        const receipt = await tx.wait();
        
        // Update transaction with blockchain details
        const [updatedTx] = await db.update(blockchainTransactions)
          .set({
            txHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            status: 'confirmed'
          })
          .where(eq(blockchainTransactions.id, txId))
          .returning();
        
        // Also update local cache
        this.transactions.set(txId, updatedTx);
        
        log(`Transaction created on blockchain: ${txId}`, 'blockchain');
        return updatedTx;
      } else {
        // Simulated transaction
        log(`Simulated transaction created: ${txId}`, 'blockchain');
        
        // Simulate confirmation after 2 seconds
        setTimeout(async () => {
          const txHash = `0x${Math.random().toString(36).substring(2, 15)}`;
          const blockNumber = Math.floor(Math.random() * 1000000);
          
          // Update in database
          const [updatedTx] = await db.update(blockchainTransactions)
            .set({
              txHash,
              blockNumber,
              status: 'confirmed'
            })
            .where(eq(blockchainTransactions.id, txId))
            .returning();
          
          // Update local cache
          this.transactions.set(txId, updatedTx);
          
          log(`Simulated transaction confirmed: ${txId}`, 'blockchain');
          
          // If this is a product purchase, mark the product as blockchain verified
          if (productId) {
            await db.update(products)
              .set({ isBlockchainVerified: true })
              .where(eq(products.id, productId));
          }
        }, 2000);
      }
      
      // Store in local cache
      this.transactions.set(txId, dbTransaction);
      return dbTransaction;
    } catch (error: any) {
      log(`Error creating blockchain transaction: ${error.message}`, 'blockchain');
      
      // Update transaction status to failed
      const [failedTx] = await db.update(blockchainTransactions)
        .set({ status: 'failed' })
        .where(eq(blockchainTransactions.id, txId))
        .returning();
      
      this.transactions.set(txId, failedTx);
      return failedTx;
    }
  }
  
  // Verify a transaction on the blockchain
  async verifyTransaction(txId: string): Promise<BlockchainTransaction | null> {
    try {
      // First check local cache
      const cachedTx = this.transactions.get(txId);
      if (cachedTx) return cachedTx;
      
      // Check database
      const [dbTx] = await db.select().from(blockchainTransactions)
        .where(eq(blockchainTransactions.id, txId));
      
      if (dbTx) {
        this.transactions.set(txId, dbTx);
        return dbTx;
      }
      
      if (this.contract) {
        // Real blockchain interaction
        const tx = await this.contract.getTransaction(txId);
        
        if (tx) {
          // Convert blockchain transaction to our format
          const transactionData = {
            id: txId,
            fromAddress: tx.from,
            toAddress: tx.to,
            amount: parseFloat(ethers.utils.formatEther(tx.amount)),
            status: tx.status === 2 ? 'confirmed' : tx.status === 1 ? 'pending' : 'failed',
            txHash: tx.txHash,
            networkId: this.networkId,
            timestamp: new Date(tx.timestamp.toNumber() * 1000)
          };
          
          // Store in database
          const [transaction] = await db.insert(blockchainTransactions)
            .values(transactionData)
            .returning();
          
          // Update local cache
          this.transactions.set(txId, transaction);
          return transaction;
        }
      }
      
      return null;
    } catch (error: any) {
      log(`Error verifying blockchain transaction: ${error.message}`, 'blockchain');
      return null;
    }
  }
  
  // Get all stored transactions
  async getAllTransactions(): Promise<BlockchainTransaction[]> {
    try {
      // Fetch all transactions from database
      const transactions = await db.select().from(blockchainTransactions);
      
      // Update local cache
      transactions.forEach(tx => {
        this.transactions.set(tx.id, tx);
      });
      
      return transactions;
    } catch (error: any) {
      log(`Error fetching blockchain transactions: ${error.message}`, 'blockchain');
      // Fallback to local cache
      return Array.from(this.transactions.values());
    }
  }
  
  // Get transaction by ID
  async getTransaction(txId: string): Promise<BlockchainTransaction | null> {
    try {
      // Check local cache first
      const cachedTx = this.transactions.get(txId);
      if (cachedTx) return cachedTx;
      
      // Try to get from database
      const [transaction] = await db.select().from(blockchainTransactions)
        .where(eq(blockchainTransactions.id, txId));
      
      if (transaction) {
        // Update local cache
        this.transactions.set(txId, transaction);
        return transaction;
      }
      
      // If not found, try to verify from blockchain
      return await this.verifyTransaction(txId);
    } catch (error: any) {
      log(`Error getting blockchain transaction: ${error.message}`, 'blockchain');
      return null;
    }
  }
  
  // Confirm product delivery on the blockchain
  async confirmDelivery(txId: string): Promise<boolean> {
    try {
      // Get the transaction
      const [transaction] = await db.select().from(blockchainTransactions)
        .where(eq(blockchainTransactions.id, txId));
      
      if (!transaction) {
        log(`Transaction not found: ${txId}`, 'blockchain');
        return false;
      }
      
      if (this.contract && this.signer) {
        // Real blockchain interaction
        const tx = await this.contract.confirmDelivery(txId);
        await tx.wait();
        
        // Update in database
        const [updatedTx] = await db.update(blockchainTransactions)
          .set({ status: 'confirmed' })
          .where(eq(blockchainTransactions.id, txId))
          .returning();
        
        // Update local cache
        this.transactions.set(txId, updatedTx);
        
        // If this has a product, mark it as verified
        if (transaction.productId) {
          await db.update(products)
            .set({ isBlockchainVerified: true })
            .where(eq(products.id, transaction.productId));
        }
        
        // If this has an order, mark it as verified
        if (transaction.orderId) {
          await db.update(orders)
            .set({ status: 'delivered' })
            .where(eq(orders.id, transaction.orderId));
        }
        
        log(`Delivery confirmed on blockchain: ${txId}`, 'blockchain');
        return true;
      } else {
        // Simulated confirmation
        // Update in database
        const [updatedTx] = await db.update(blockchainTransactions)
          .set({ status: 'confirmed' })
          .where(eq(blockchainTransactions.id, txId))
          .returning();
        
        // Update local cache
        this.transactions.set(txId, updatedTx);
        
        // If this has a product, mark it as verified
        if (transaction.productId) {
          await db.update(products)
            .set({ isBlockchainVerified: true })
            .where(eq(products.id, transaction.productId));
        }
        
        // If this has an order, mark it as verified
        if (transaction.orderId) {
          await db.update(orders)
            .set({ status: 'delivered' })
            .where(eq(orders.id, transaction.orderId));
        }
        
        log(`Simulated delivery confirmation: ${txId}`, 'blockchain');
        return true;
      }
    } catch (error: any) {
      log(`Error confirming delivery on blockchain: ${error.message}`, 'blockchain');
      return false;
    }
  }
  
  // Check if blockchain service is active
  isActive(): boolean {
    return !!this.provider;
  }
  
  // Get current network ID
  getNetworkId(): string {
    return this.networkId;
  }
}

// Singleton instance
export const blockchainService = new BlockchainService();