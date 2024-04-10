const Safe = require("@safe-global/protocol-kit").default;
const EthersAdapter = require("@safe-global/protocol-kit").EthersAdapter;
const SafeApiKit = require("@safe-global/api-kit").default;

class SafeManager {
  ethAdapter;
  safeService;
  safe;
  signer;
  safeAvailable;

  constructor(signer, ethers) {
    this.signer = signer;
    this.ethAdapter = new EthersAdapter({
      ethers: ethers,
      signerOrProvider: signer,
    });
    this.safeAvailable = false;
  }

  async initializeSafe(networkName) {
    if (!this.ethAdapter) {
      throw new Error("EthersAdapter is not initialized");
    }

    const safeAddress = process.env[`${networkName.toUpperCase()}_SAFE_ADDRESS`];
    if (!safeAddress) return;

    this.safe = await Safe.create({
      ethAdapter: this.ethAdapter,
      safeAddress,
    });

    this.safeService = new SafeApiKit({
      chainId: await this.ethAdapter.getChainId(),
    });
    this.safeAvailable = true;
  }

  async createSafeTransaction(safeTransactionData) {
    if (!this.safe) {
      throw new Error("Safe is not initialized");
    }
    return await this.safe.createTransaction({ transactions: safeTransactionData });
  }

  async signTransaction(safeTransaction) {
    if (!this.safe) {
      throw new Error("Safe is not initialized");
    }
    const safeTxHash = await this.safe.getTransactionHash(safeTransaction);
    const safeSignature = await this.safe.signTransactionHash(safeTxHash);

    console.log({
      safeTxHash,
      safeSignature,
      data: safeTransaction.data,
    });

    return {
      safeTxHash,
      safeSignature: safeSignature,
    };
  }

  async proposeTransaction(safeTx, safeSignature) {
    if (!this.safe) {
      throw new Error("Safe or SafeService is not initialized");
    }

    if (!this.safeService) {
      console.warn("Cannot propose tx since there is no Gnosis Safe transaction service for this chain");
      return;
    }

    const safeTxHash = await this.safe.getTransactionHash(safeTx);
    const senderAddress = await this.signer.getAddress();

    await this.safeService.proposeTransaction({
      safeAddress: await this.safe.getAddress(),
      safeTransactionData: safeTx.data,
      safeTxHash,
      senderAddress,
      senderSignature: safeSignature.data,
    });
  }
}

module.exports = { SafeManager };
