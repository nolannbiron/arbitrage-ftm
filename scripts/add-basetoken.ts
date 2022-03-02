import { ethers } from 'hardhat';
import { Bot } from '../typechain/Bot';
import deployer from '../.secret';
import { utils } from 'ethers';

const ftmBaseTokens = [
  //  '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
    '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
    '0x1E4F97b9f9F913c46F1632781732927B9019C68b',
    '0x74b23882a30290451A17c44f4F05243b6b58C76d',
  '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E',
  '0x657A1861c15A3deD9AF0B6799a195a249ebdCbc6',
  '0xD67de0e0a0Fd7b15dC8348Bb9BE742F3c5850454',
  '0xb3654dc3D10Ea7645f8319668E8F54d2574FBdC8',
  '0x6a07A792ab2965C72a5B8088d3a069A7aC3a993B',
  '0xd6070ae98b8069de6B494332d1A1a81B6179D960',
  "0xC931f61B1534EB21D8c11B24f3f5Ab2471d4aB50",
  "0x8f8b9f8b8d6d7f0a7d9b9c9b8f8b8d6d7f0a7d9b",
  '0x82f0b8b456c1a451378467398982d4834b6829c1',
  "0x56ee926bD8c72B2d5fa1aF4d9E4Cbb515a1E3Adc",
  "0x468003b688943977e6130f4f68f23aad939a1040",
  "0xae75A438b2E0cB8Bb01Ec1E1e376De11D44477CC",
  "0x940F41F0ec9ba1A34CF001cc03347ac092F5F6B5",
  "0x29b0Da86e484E1C0029B56e817912d778aC0EC69",
];
async function main() {
  const [signer] = await ethers.getSigners();
  const flashBot: Bot = (await ethers.getContractAt(
    'Bot',
    deployer.contract, // your contract address
    signer
  )) as Bot;

  const tx: any = await flashBot.addBaseTokens(ftmBaseTokens).then((tx: any) => {
    console.log(`Added base tokens`, tx);
    return tx;
  })
  .catch(err => {
    console.log(`Error adding base tokens`, err);
  })
  // tx.wait(1);
  
}


// const args = process.argv.slice(2);

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
});
