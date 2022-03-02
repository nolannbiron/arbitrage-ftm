import { ethers } from 'hardhat';
import { Bot } from '../typechain/Bot';
import deployer from '../.secret';

const ftmBaseTokens = [
  // '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
  '0x1E4F97b9f9F913c46F1632781732927B9019C68b',
  '0x74b23882a30290451A17c44f4F05243b6b58C76d',
  '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
  '0x657A1861c15A3deD9AF0B6799a195a249ebdCbc6',
  '0xd67de0e0a0fd7b15dc8348bb9be742f3c5850454',
  '0xb3654dc3d10ea7645f8319668e8f54d2574fbdc8',
];

async function main() {
  const [signer] = await ethers.getSigners();
  const bot: Bot = (await ethers.getContractAt(
    'Bot',
    deployer.contract, // your contract address
    signer
  )) as Bot;

  for(let baseToken of ftmBaseTokens){
    await bot.removeBaseToken(baseToken).then(() => {
      console.log(`Removed base token ${baseToken}`);
    });
  };
}

// const args = process.argv.slice(2);

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
});
