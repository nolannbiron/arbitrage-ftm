import { ethers, run } from 'hardhat';
import { FlashBot } from '../typechain/FlashBot';
import deployer from '../.secret';
import { Bot } from '../typechain/Bot';

async function main() {
  await run('compile');
  const flashBot: Bot = (await ethers.getContractAt(
    'Bot',
    deployer.contract, // contract address
  )) as Bot;

  const owner = await flashBot.owner();
  console.log(`Owner: ${owner}`);

  const tokens = await flashBot.getBaseTokens();
  console.log('Base tokens: ', tokens);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
});
