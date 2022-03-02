import fs from 'fs';
import path from 'path';
import 'lodash.combinations';
import lodash from 'lodash';
import { Contract } from '@ethersproject/contracts';
import { ethers } from 'hardhat';

import log from './log';

export enum Network {
  FTM = 'ftm',
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const ftmBaseTokens: Tokens = {
  wftm: { symbol: 'WFTM', address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', aggr: '0xf4766552D15AE4d256Ad41B6cf2933482B0680dc'},
  usdc: { symbol: 'USDC', address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', aggr: '0x2553f4eeb82d5A26427b8d1106C51499CBa5D99c'},
  crv: { symbol: 'CRV', address: '0x1E4F97b9f9F913c46F1632781732927B9019C68b', aggr: '0xa141D7E3B44594cc65142AE5F2C7844Abea66D2B'},
  weth: { symbol: 'WETH', address: '0x74b23882a30290451A17c44f4F05243b6b58C76d', aggr: '0x11DdD3d147E5b83D01cee7070027092397d63658' },
  dai: {symbol: 'DAI', address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', aggr: '0x91d5DEFAFfE2854C7D02F50c80FA1fdc8A721e52'},
  cream: {symbol: 'CREAM', address: '0x657A1861c15A3deD9AF0B6799a195a249ebdCbc6', aggr: '0xD2fFcCfA0934caFdA647c5Ff8e7918A10103c01c'},
  bnb: {symbol: 'BNB', address: '0xD67de0e0a0Fd7b15dC8348Bb9BE742F3c5850454', aggr: '0x6dE70f4791C4151E00aD02e969bD900DC961f92a'},
  link: {symbol: 'LINK', address: '0xb3654dc3D10Ea7645f8319668E8F54d2574FBdC8', aggr: '0x221C773d8647BC3034e91a0c47062e26D20d97B4'},
  aave: {symbol: "AAVE", address: '0x6a07A792ab2965C72a5B8088d3a069A7aC3a993B', aggr: "0xE6ecF7d2361B6459cBb3b4fb065E0eF4B175Fe74"},
  bifi: {symbol: "BIFI", address: '0xd6070ae98b8069de6B494332d1A1a81B6179D960', aggr: "0x4F5Cc6a2291c964dEc4C7d6a50c0D89492d4D91B"},
  busd: {symbol: "BUSD", address: "0xC931f61B1534EB21D8c11B24f3f5Ab2471d4aB50", aggr: "0xf8f57321c2e3E202394b0c0401FD6392C3e7f465"},
  frax: {symbol: "FRAX", address: "0x8f8b9f8b8d6d7f0a7d9b9c9b8f8b8d6d7f0a7d9b", aggr: "0xBaC409D670d996Ef852056f6d45eCA41A8D57FbD"},
  mim: {symbol: "MIM", address: '0x82f0b8b456c1a451378467398982d4834b6829c1', aggr: '0x28de48D3291F31F839274B8d82691c77DF1c5ceD'},
  snx: {symbol: "SNX", address: "0x56ee926bD8c72B2d5fa1aF4d9E4Cbb515a1E3Adc", aggr: "0x2Eb00cC9dB7A7E0a013A49b3F6Ac66008d1456F7"},
  spell: {symbol: "SPELL", address: "0x468003b688943977e6130f4f68f23aad939a1040", aggr: "0x02E48946849e0BFDD7bEa5daa80AF77195C7E24c"},
  sushi: {symbol: "SUSHI", address: "0xae75A438b2E0cB8Bb01Ec1E1e376De11D44477CC", aggr: "0xCcc059a1a17577676c8673952Dc02070D29e5a66"},
  gfusdt: {symbol: "gfUSDT", address: "0x940F41F0ec9ba1A34CF001cc03347ac092F5F6B5", aggr: "0xF64b636c5dFe1d3555A847341cDC449f612307d0"},
  yfi: {symbol: "YFI", address: "0x29b0Da86e484E1C0029B56e817912d778aC0EC69", aggr: "0x9B25eC3d6acfF665DfbbFD68B3C1D896E067F0ae"}
};

const ftmQuoteTokens: Tokens = {  
  wftm: { symbol: 'WFTM', address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83'},
  spirit: {symbol: 'SPIRIT', address: '0x5Cc61A78F164885776AA610fb0FE1257df78E59B'},
  brush: {symbol: 'BRUSH', address: '0x85dec8c4B2680793661bCA91a8F129607571863d'},
  magik: {symbol: 'MAGIK', address: '0x87a5c9b60a3aaf1064006fe64285018e50e0d020'},
  tshare: {symbol: 'TSHARE', address: '0x4cdf39285d7ca8eb3f090fda0c069ba5f4145b37'},
  mim: {symbol: 'MIM', address: '0x82f0b8b456c1a451378467398982d4834b6829c1'},
  tomb: {symbol: 'TOMB', address: '0x6c021Ae822BEa943b2E66552bDe1D2696a53fbB7'},
  comb: {symbol: 'COMB', address: '0xae45a827625116d6c0c40b5d7359ecf68f8e9afd'},
  spell: {symbol: 'SPELL', address: '0x468003b688943977e6130f4f68f23aad939a1040'},
  scream: {symbol: 'SCREAM', address: '0xe0654c8e6fd4d733349ac7e09f6f23da256bf475'},
  oxd: {symbol: 'OXD', address: '0xc165d941481e68696f43ee6e99bfb2b23e0e3114'},
  fhm: {symbol: 'FHM', address: '0xfa1fbb8ef55a4855e5688c0ee13ac3f202486286'},
  hec: {symbol: 'HEC', address: '0x5c4fdfc5233f935f20d2adba572f770c2e377ab0'},
  shec: {symbol: 'SHEC', address:'0x75bdef24285013387a47775828bec90b91ca9a5f'},
  tarot: {symbol: 'TAROT', address: '0xc5e2b037d30a390e62180970b3aa4e91868764cd'},
  ice: {symbol: 'ICE', address: '0xf16e81dce15b08f326220742020379b855b87df9'},
  charm: {symbol: 'CHARM', address: '0x248CB87DDA803028dfeaD98101C9465A2fbdA0d4'},
  tbond: {symbol: 'TBOND', address: '0x24248cd1747348bdc971a5395f4b3cd7fee94ea0'},
  frax: {symbol: 'FRAX', address: '0x8f8b9f8b8d6d7f0a7d9b9c9b8f8b8d6d7f0a7d9b'},
  sftm: {symbol: 'SFTM', address: '0x69c744d3444202d35a2783929a0f930f2fbb05ad'},
  wmemo: {symbol: 'WMEMO', address: '0xddc0385169797937066bbd8ef409b5b3c0dfeb52'},
  snx: {symbol: 'SNX', address: '0x56ee926bD8c72B2d5fa1aF4d9E4Cbb515a1E3Adc'},
  cougar: {symbol: 'CGSV', address: '0xf4661166bcbac9d5c45d50584d6805019091f5c0'},
  lqdr: {symbol: 'LQDR', address: '0x10b620b2dbac4faa7d7ffd71da486f5d44cd86f9'},
  boo: {symbol: 'BOO', address: '0x841fad6eae12c286d1fd18d1d525dffa75c7effe'},
  lux: {symbol: 'LUX', address: '0x6671e20b83ba463f270c8c75dae57e3cc246cb2b'},
  dfy: {symbol: 'DFY', address: '0x84b0b7718f8480a9eda3133fd385d7edf2b1d1c4'},
  usdc: { symbol: 'USDC', address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75'},
  crv: { symbol: 'CRV', address: '0x1E4F97b9f9F913c46F1632781732927B9019C68b'},
  weth: { symbol: 'WETH', address: '0x74b23882a30290451A17c44f4F05243b6b58C76d'},
  dai: {symbol: 'DAI', address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E'},
  cream: {symbol: 'CREAM', address: '0x657A1861c15A3deD9AF0B6799a195a249ebdCbc6'},
  bnb: {symbol: 'BNB', address: '0xD67de0e0a0Fd7b15dC8348Bb9BE742F3c5850454'},
  link: {symbol: 'LINK', address: '0xb3654dc3D10Ea7645f8319668E8F54d2574FBdC8'},
  aave: {symbol: "AAVE", address: '0x6a07A792ab2965C72a5B8088d3a069A7aC3a993B'},
  bifi: {symbol: "BIFI", address: '0xd6070ae98b8069de6B494332d1A1a81B6179D960'},
  busd: {symbol: "BUSD", address: "0xC931f61B1534EB21D8c11B24f3f5Ab2471d4aB50"},
  sushi: {symbol: "SUSHI", address: "0xae75A438b2E0cB8Bb01Ec1E1e376De11D44477CC"},
  gfusdt: {symbol: "gfUSDT", address: "0x940F41F0ec9ba1A34CF001cc03347ac092F5F6B5"},
  yfi: {symbol: "YFI", address: "0x29b0Da86e484E1C0029B56e817912d778aC0EC69"},
  syn: {symbol: "SYN", address: "0xE55e19Fb4F2D85af758950957714292DAC1e25B2"},
  vox: {symbol: 'VOX', address: "0x74b4db963738A2A95bFCb1833B123495Ccc220e2"},
  kp3r: {symbol: "KP3R", address: "0x2A5062D22adCFaAfbd5C541d4dA82E4B450d4212"},
  band: {symbol: "BAND", address: "0x46E7628E8b4350b2716ab470eE0bA1fa9e76c6C5"},
  fband: {symbol: "fBAND", address: "0x078EEF5A2fb533e1a4d487ef64b27DF113d12C32"},
  rai: {symbol: 'RAI', address: "0xa71353Bb71DdA105D383B02fc2dD172C4D39eF8B"},
  alpaca: {symbol: "ALPACA", address: "0xaD996A45fd2373ed0B10Efa4A8eCB9de445A4302"},
  hoge: {symbol: "HOGE", address: "0xF31778D591c558140398F46feCA42A6a2dbFFe90"},
  sfi: {symbol: "SFI", address: "0x924828a9Fb17d47D0eb64b57271D10706699Ff11"},
  cerby: {symbol: "CERBY", address: "0xdef1fac7Bf08f173D286BbBDcBeeADe695129840"},
  gton: {symbol: "GTON", address: "0xC1Be9a4D5D45BeeACAE296a7BD5fADBfc14602C4"},
  soul: {symbol: "SOUL", address: "0xe2fb177009FF39F52C0134E8007FA0e4BaAcBd07"},
  cover: {symbol: 'COVER', address: "0xB01E8419d842beebf1b70A7b5f7142abbaf7159D"},
  mars: {symbol: "MARS", address: "0xBE41772587872A92184873d55B09C6bB6F59f895"},
  wnow: {symbol: "WNOW", address: "0xA9CAd0165C155f3998b0001b3eF30bCa0aa6B591"},
  fwings: {symbol: "fWINGS", address: "0x3D8f1ACCEe8e263F837138829B6C4517473d0688"},
  rm: {symbol: "RM", address: "0xA9CAd0165C155f3998b0001b3eF30bCa0aa6B591"},
  omb: {symbol: "2OMB", address: "0x7a6e4E3CC2ac9924605DCa4bA31d1831c84b44aE"},
  wbond: {symbol: "WBOND", address: "0x59c6606ED2AF925F270733e378D6aF7829B5b3cf"},
  sspell: {symbol: "sSPELL", address: "0xbB29D2A58d880Af8AA5859e30470134dEAf84F2B"},
  est: {symbol: "EST", address: "0x181F3F22C9a751E2ce673498A03E1FDFC0ebBFB6"},
  frank: {symbol: "FRANK", address: "0xeb86B05cFEE3e48DB9a44275701Ed099462c8ba0"},
  undead: {symbol: "UNDEAD", address: "0x551C61DB482289994e7d426Fc4DB6493918bB81D"},
  aqu: {symbol: "AQU", address: "0x0f7ADb77B6334B9B5A3c4f78aAa073eA1D915bF6"},
};

const ftmDexes: AmmFactories = {
  spooky: '0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3',
  spirit: '0xef45d134b73241eda7703fa787148d9c9f4950b0',
  hyperjump: '0x991152411A7B5A14A8CF0cDDE8439435328070dF',   
  paint: '0x733A9D1585f2d14c77b49d39BC7d7dd14CdA4aa5',
  sushi: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
};

function getFactories(network: Network): AmmFactories {
  switch (network) {
    case Network.FTM:
      return ftmDexes;
    default:
      throw new Error(`Unsupported network:${network}`);
  }
}

export function getTokens(network: Network): [Tokens, Tokens] {
  switch (network) {
    case Network.FTM:
      return [ftmBaseTokens, ftmQuoteTokens];
    default:
      throw new Error(`Unsupported network:${network}`);
  }
}

async function updatePairs(network: Network): Promise<ArbitragePair[]> {
  log.info('Updating arbitrage token pairs');
  const [baseTokens, quoteTokens] = getTokens(network);
  const factoryAddrs = getFactories(network);

  const factoryAbi = ['function getPair(address, address) view returns (address pair)'];
  let factories: Contract[] = [];

  log.info(`Fetch from dexes: ${Object.keys(factoryAddrs)}`);
  for (const key in factoryAddrs) {
    const addr = factoryAddrs[key];
    const factory = new ethers.Contract(addr, factoryAbi, ethers.provider);
    factories.push(factory);
  }

  let tokenPairs: TokenPair[] = [];
  for (const key in baseTokens) {
    const baseToken = baseTokens[key];
    for (const quoteKey in quoteTokens) {
      const quoteToken = quoteTokens[quoteKey];
      let tokenPair: TokenPair = { symbols: `${quoteToken.symbol}-${baseToken.symbol}`, pairs: [], factory: '' };
      for (const factory of factories) {
        const pair = await factory.getPair(baseToken.address, quoteToken.address);
        // console.log(`${baseToken.symbol}-${quoteToken.symbol} ${pair} ${factory.address}`);
        if (pair != ZERO_ADDRESS) {
          tokenPair.pairs.push(pair);
          tokenPair.factory = factory.address
        }
      }
      if (tokenPair.pairs.length >= 2) {
        tokenPairs.push(tokenPair);
      }
    }
  }

  let allPairs: ArbitragePair[] = [];
  for (const tokenPair of tokenPairs) {
    if (tokenPair.pairs.length < 2) {
      continue;
    } else if (tokenPair.pairs.length == 2) {
      allPairs.push(tokenPair as ArbitragePair);
    } else {
      // @ts-ignore
      const combinations = lodash.combinations(tokenPair.pairs, 2);
      for (const pair of combinations) {
        const arbitragePair: ArbitragePair = {
          symbols: tokenPair.symbols,
          pairs: pair,
          factory: tokenPair.factory
        };
        allPairs.push(arbitragePair);
      }
    }
  }
  return allPairs;
}

function getPairsFile(network: Network) {
  return path.join(__dirname, `../pairs-${network}.json`);
}

export async function tryLoadPairs(network: Network): Promise<ArbitragePair[]> {
  let pairs: ArbitragePair[] | null;
  const pairsFile = getPairsFile(network);
  try {
    pairs = JSON.parse(fs.readFileSync(pairsFile, 'utf-8'));
    log.info('Load pairs from json');
  } catch (err) {
    pairs = null;
  }

  if (pairs) {
    return pairs;
  }
  pairs = await updatePairs(network);

  fs.writeFileSync(pairsFile, JSON.stringify(pairs, null, 2));
  return pairs;
}
