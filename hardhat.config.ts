import { task, HardhatUserConfig } from 'hardhat/config';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';
import "@tenderly/hardhat-tenderly"

import deployer from './.secret';
import { utils } from 'ethers';

// const FTM_RPC = 'https://bsc-dataseed.binance.org/';
const FTM_RPC = 'https://rpc.ftm.tools/';
const FTM_Tetsnet_RPC = 'https://rpc.testnet.fantom.network/';

const config: HardhatUserConfig = {
  solidity: { version: '0.8.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      // loggingEnabled: true,
      forking: {
        url: 'https://rpc.ftm.tools/',
        enabled: true,
        blockNumber: 29076308,
      },
      mining: {
        auto: true,
        interval: [1000, 6000],
      },
      chainId: 250,
      accounts: {
        accountsBalance: '1000000000000000000000', // 1 mil ether
      },
    },
    ftmTestnet: {
      url: FTM_Tetsnet_RPC,
      chainId: 0xfa2,
      accounts: [deployer.private],
    },
    ftm: {
      url: FTM_RPC,
      chainId: 250,
      accounts: [deployer.private],
      blockGasLimit: 700000,
      gasPrice: 550000000000
    },
  },
  mocha: {
    timeout: 40000,
  },
};

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = config;
