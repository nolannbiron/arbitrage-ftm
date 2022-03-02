import { BigNumber, BigNumberish, utils } from 'ethers';
import deployer from '../.secret';

interface Config {
  contractAddr: string;
  logLevel: string;
  minimumProfit: number;
  gasPrice: BigNumberish;
  gasLimit: BigNumberish;
  ftmScanUrl: string;
  concurrency: number;
}

const gasPrice = utils.parseUnits('550', 'gwei');
const gasLimit = 700000;

const ftmScanApiKey = 'Y7GDJYAX3UKUEV618RKE15R25ECW7GAFNZ'; // bscscan API key
const ftmScanUrl = `https://api.ftmscan.com/api?module=stats&action=ftmprice&apikey=${ftmScanApiKey}`;

const config: Config = {
  contractAddr: deployer.contract, // flash bot contract address
  logLevel: 'debug',
  concurrency: 100,
  minimumProfit: 0.2,
  gasPrice: gasPrice,
  gasLimit: gasLimit,
  ftmScanUrl: ftmScanUrl,
};

export default config;
