import { ethers } from "hardhat";


async function main(){

    const tx = await ethers.provider.getTransactionReceipt('0x77e603c15bde39424de215aa5619782c1dcb598d8905ad9ab6227d991acf548d');
    console.log(tx);

}

main()
.then(() => process.exit(0))
.catch((err) => {
    console.error(err);
    process.exit(1);
});