import type { VirtualWallet, WalletTransfer } from './interfaces';
import { BaseService } from './service';

class WalletsService extends BaseService<VirtualWallet> {
  constructor() {
    super('WalletsService', 'virtualWallets', 'virtualWallet');
  }
  get $wallets() {
    return this.$items;
  }
}
class WalletTransfersService extends BaseService<WalletTransfer> {
  constructor() {
    super('WalletTransfersService', 'walletTransfers', 'walletTransfer');
  }
  get $transfers() {
    return this.$items;
  }
}
export const walletsService = new WalletsService();
export const walletsStore = walletsService.$wallets;
export const walletTransfersService = new WalletTransfersService();
export const walletTransfersStore = walletTransfersService.$transfers;
