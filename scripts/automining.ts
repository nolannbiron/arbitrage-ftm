import hre from 'hardhat';
import { ethers } from 'hardhat';
import { Bot } from '../typechain/Bot';
import { IERC20 } from '../typechain/IERC20';
import deployer from '../.secret';
import { IWETH, IWETHInterface } from '../typechain/IWETH';

async function main(){

    await hre.ethers.provider.send("evm_setAutomine", [true]);
    await hre.ethers.provider.send("evm_setIntervalMining", [2000]);


    // const [signer] = await ethers.getSigners();
    // const flashBot: FlashBot = (await ethers.getContractAt(
    //   'FlashBot',
    //   deployer.contract, // your contract address
    //   signer
    // )) as FlashBot;

    // const tx = await signer.sendTransaction({
    //   to: flashBot.address,
    //   value: ethers.utils.parseEther("3.0")
    // }).then((tx) => {
    //   return tx;
    // })
    // .catch((err) => {
    //   console.error(err);
    //   process.exit(1);
    // })
    // console.log(tx);

    // let balance = await ethers.provider.getBalance(flashBot.address);
    // // balance = ethers.utils.formatEther(balance) as any;
    // console.log(balance);
    
}

main()
.then(() => process.exit(0))
.catch((err) => {
  console.error(err);
  process.exit(1)
});