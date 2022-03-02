import { ethers, run } from 'hardhat';

// import deployer from '../.secret';

// WBNB address on BSC, WETH address on ETH
const WethAddr = '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83';

async function main() {
  await run('compile');
  const Bot = await ethers.getContractFactory('Bot');
  const bot = await Bot.deploy(WethAddr);

  console.log(`FlashBot deployed to ${bot.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
