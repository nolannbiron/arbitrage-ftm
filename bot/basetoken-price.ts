import axios from 'axios';
import AsyncLock from 'async-lock';
import { ethers } from 'hardhat';
import config from './config';
import log from './log';
import { utils } from 'ethers';

const lock = new AsyncLock();
const aggregatorV3InterfaceABI = [{ "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "description", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint80", "name": "_roundId", "type": "uint80" }], "name": "getRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "latestRoundData", "outputs": [{ "internalType": "uint80", "name": "roundId", "type": "uint80" }, { "internalType": "int256", "name": "answer", "type": "int256" }, { "internalType": "uint256", "name": "startedAt", "type": "uint256" }, { "internalType": "uint256", "name": "updatedAt", "type": "uint256" }, { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "version", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }]
let ftmPrice = 0;

// clear bnb price every hour
setInterval(() => {
  lock
    .acquire('ftm-price', () => {
      ftmPrice = 0;
      return;
    })
    .then(() => {});
}, 3600000);

export async function getFtmPrice(): Promise<number> {
  return await lock.acquire('ftm-price', async () => {
    if (ftmPrice !== 0) {
      return ftmPrice;
    }
    const res = await axios.get(config.ftmScanUrl);
    ftmPrice = parseFloat(res.data.result.ethusd);
    log.info(`FTM price: $${ftmPrice}`);
    return ftmPrice;
  });
}

export async function getPrice(addr: string): Promise<number> {
  const [signer] = await ethers.getSigners();
  const aggregator = new ethers.Contract(addr, aggregatorV3InterfaceABI).connect(signer);
  let decimals = await aggregator.decimals();
  return aggregator.latestRoundData()
  .then((roundData: any) => {
      let price = parseFloat(ethers.utils.formatUnits(roundData.answer, decimals));
      return price
  })
  .catch((err: any) => {
    console.log(err);
  });
}
