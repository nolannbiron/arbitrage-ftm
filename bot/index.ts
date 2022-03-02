import { ethers } from 'hardhat';
import { BigNumber, providers, utils } from 'ethers';
import pool from '@ricokahler/pool';
import AsyncLock from 'async-lock';
import deployer from '../.secret';
import { Bot } from '../typechain/Bot';
import { Network, tryLoadPairs, getTokens } from './tokens';
import { getFtmPrice, getPrice } from './basetoken-price';
import log from './log';
import config from './config';
import Web3 from 'web3';

const web3 = new Web3('wss://localhost:8545');

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function calcNetProfit(profitWei: BigNumber, address: string, baseTokens: Tokens, flashBot: Bot, pair0: string, pair1: string): Promise<number> {
  
  let token = Object.values(baseTokens).filter((token) => token.address.toLowerCase() === address.toLowerCase())[0];
  let price = await getPrice(token.aggr as string);
  
  let priceGas = await getPrice('0xf4766552D15AE4d256Ad41B6cf2933482B0680dc'); // price FTM
  let decimals = await flashBot.getTokenDecimals_external(address);

  let profit = parseFloat(ethers.utils.formatUnits(profitWei, decimals));
  let newProfit = Number((profit) * price);
  if(isNaN(newProfit)) console.log(profit);
  let finalProfit: number;
  const gasCost = priceGas * (parseFloat(ethers.utils.formatEther(config.gasPrice)) * (config.gasLimit as number));
  try{
    let gas: BigNumber = await flashBot.estimateGas.getDaLamb0(pair0, pair1, {
      gasPrice: config.gasPrice,
      gasLimit: config.gasLimit,
    })
    let gasCost = Number(priceGas * (parseFloat(ethers.utils.formatEther(config.gasPrice)) * (gas.toNumber())));
    finalProfit = Number(newProfit - gasCost);
    if(isNaN(finalProfit)){
      console.log(profit, gasCost, finalProfit, price)
    }
  }
  catch(err){
    finalProfit = Number(newProfit - gasCost);
  }

  if(isNaN(finalProfit)){
    console.log(profit, gasCost, finalProfit, price)
  }

  return finalProfit;

}

function arbitrageFunc(flashBot: Bot, baseTokens: Tokens) {
  const lock = new AsyncLock({ timeout: 2000, maxPending: 1000 });
  return async function arbitrage(pair: ArbitragePair) {
    const [pair0, pair1] = pair.pairs;

    // let res: [BigNumber, string] & {
    //   profit: BigNumber;
    //   baseToken: string;
    // };
    let res: any;
    try {
      res = await flashBot.getProfit(pair0, pair1)
      // console.log(res.borrowAmount.toNumber());
      // log.debug(`Profit on ${pair.symbols}: ${ethers.utils.formatEther(res.profit)}`);
    } catch (err) {
      // console.log(err);
      return;
    }

    if (res.profit.gt(BigNumber.from('0'))){
      let netProfit = await calcNetProfit(res.profit, res.baseToken, baseTokens, flashBot, pair0, pair1);
      log.debug(`NetProfit on ${pair.symbols}: ${netProfit}`);
      if(isNaN(netProfit)){
        log.debug(`NaN ${pair.symbols} : ${netProfit}`);
      }
      if (netProfit < config.minimumProfit || isNaN(netProfit)) {
        return;
      }

      log.info(`Calling flash arbitrage, net profit: ${netProfit}`);
      try {
        // lock to prevent tx nonce overlap
        await lock.acquire('flash-bot', async () => {
          const response: any = await flashBot.getDaLamb0(pair0, pair1, {
            gasPrice: config.gasPrice,
            gasLimit: config.gasLimit,
          })
          // console.log(response);
          const receipt = await response.wait(1);
          log.info(`Tx: ${receipt.transactionHash}`);
        });
      } catch (err: any) {
        if (err.message === 'Too much pending tasks' || err.message === 'async-lock timed out') {
          return;
        }
        log.error(err);
      }
    }
  };
}

async function main() {
  const pairs = await tryLoadPairs(Network.FTM);
  const flashBot = (await ethers.getContractAt('Bot', config.contractAddr)) as Bot;
  const [baseTokens] = getTokens(Network.FTM);
  log.info('Starting arbitrage');

  web3.eth.subscribe('newBlockHeaders', async(block) => {
    console.log(block);
    await pool({
      collection: pairs,
      task: arbitrageFunc(flashBot, baseTokens),
      // maxConcurrency: config.concurrency,
    });
    sleep(1000);
  })

  // while(true) {
  //   await pool({
  //     collection: pairs,
  //     task: arbitrageFunc(flashBot, baseTokens),
  //     // maxConcurrency: config.concurrency,
  //   });
  //   await sleep(1000);
  // }
}

async function launch(){
  try{
    main()
  }catch(err){
    main();
  }
}

launch();