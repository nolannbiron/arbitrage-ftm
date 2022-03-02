import { ethers } from "hardhat";
import { Bot } from "../typechain/Bot";
import deployer from "../.secret";

async function main(){
    const [signer] = await ethers.getSigners();
    const flashBot: Bot = (await ethers.getContractAt(
        'Bot',
        deployer.contract,
        signer
    )) as Bot;


    const withdraw = await flashBot.withdraw();
    console.log(withdraw);
}

main()
.then(() => process.exit(0))
.catch((err) => {
    console.error(err);
    process.exit(1);
});
