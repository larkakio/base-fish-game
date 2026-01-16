/**
 * Deploy Script for CharacterStore Contract to Base Mainnet
 * 
 * Usage:
 * 1. Set up your .env file with PRIVATE_KEY and BASE_RPC_URL
 * 2. Run: npx hardhat run scripts/deploy.js --network base
 */

const hre = require('hardhat');

async function main() {
  console.log('🐠 Deploying Fishdom CharacterStore to Base...\n');

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'ETH\n');

  // Deploy CharacterStore contract
  const baseUri = 'https://fishdom.base.app/metadata/';
  
  console.log('Deploying CharacterStore...');
  const CharacterStore = await hre.ethers.getContractFactory('CharacterStore');
  const characterStore = await CharacterStore.deploy(baseUri);
  
  await characterStore.waitForDeployment();
  const contractAddress = await characterStore.getAddress();
  
  console.log('\n✅ CharacterStore deployed to:', contractAddress);
  console.log('\n📋 Contract Details:');
  console.log('- Name:', await characterStore.name());
  console.log('- Symbol:', await characterStore.symbol());
  console.log('- ETH per Dollar:', hre.ethers.formatEther(await characterStore.ethPerDollar()), 'ETH');
  
  // Log character prices
  console.log('\n💰 Character Prices (in ETH):');
  const prices = await characterStore.getAllPricesETH();
  const characters = ['Orange Fish (Free)', 'Green Fish ($1)', 'Blue Fish ($2)', 'Purple Fish ($3)', 'Gold Shark ($5)'];
  
  prices.forEach((price, index) => {
    console.log(`- ${characters[index]}: ${hre.ethers.formatEther(price)} ETH`);
  });

  // Verify contract on Basescan (optional)
  console.log('\n📝 Verifying contract on Basescan...');
  try {
    await hre.run('verify:verify', {
      address: contractAddress,
      constructorArguments: [baseUri],
    });
    console.log('✅ Contract verified on Basescan!');
  } catch (error) {
    if (error.message.includes('Already Verified')) {
      console.log('Contract already verified!');
    } else {
      console.log('Verification failed:', error.message);
      console.log('You can verify manually at: https://basescan.org/address/' + contractAddress);
    }
  }

  // Output deployment info for frontend
  console.log('\n🔧 Update your frontend with:');
  console.log('```');
  console.log(`export const CHARACTER_STORE_ADDRESS = '${contractAddress}' as \`0x\${string}\`;`);
  console.log('```');

  console.log('\n🎉 Deployment complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
