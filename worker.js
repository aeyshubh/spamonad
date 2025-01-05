
const {Web3} = require("web3");
const abi = require("./abi.json");
const { notEqual } = require("assert");
const figlet = require('figlet');
const gradient = require('gradient-string');

const web3 = new Web3("https://devnet1.monad.xyz/rpc/8XQAiNSsPCrIdVttyeFLC6StgvRNTdf");

text = figlet.textSync("SPAM-MONAD ", {
  font: "ANSI Shadow",
  horizontalLayout: "full",
});
console.log(gradient.pastel.multiline(text));

const contractAddress = "0x1C45c4C63086866780761ABD511470027F203F3b";
const senderPrivateKeys = [
  "pk1",
  "pk2",
  "pk3",
]; // Add more private keys as needed
const contractAbi = abi;
const contract = new web3.eth.Contract(contractAbi, contractAddress);
let countTx=1;
async function sendNativeTransaction(privateKey, nonce) {
  try {
    console.log("Total number of Tx sent: ",countTx++);
    // Extract the sender address from the private key
    const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    const senderAddress = web3.eth.accounts.privateKeyToAccount(formattedPrivateKey).address;
    const text ='Shubh';
    const tx = {
      to: contractAddress,
      data: contract.methods.writeName(text).encodeABI(),
      gas: 240000,
      gasPrice:  await web3.eth.getGasPrice(),
      nonce: nonce,
      chainId: 41454,
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, formattedPrivateKey);
    await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log(`Worker [${senderAddress}]'s Transaction minted successfully!`);
  } catch (err) {
    console.error(`Worker [PrivateKey: ${privateKey}] failed: ${err.message}`);
    throw err; // Re-throw error for retry handling
  }
}

async function worker(privateKey) {
  try {
const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    const senderAddress = web3.eth.accounts.privateKeyToAccount(formattedPrivateKey).address;

    let nonce = await web3.eth.getTransactionCount(senderAddress, "pending");

    while (true) {
      try {
        console.log(`Worker [${senderAddress}] sending transaction...`);
        await sendNativeTransaction(privateKey, nonce++);
      } catch (err) {
        console.error(`Worker [${senderAddress}] failed: ${err.message}. Retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Retry after delay
      }
    }
  } catch (err) {
    console.error(`Critical error for Worker [PrivateKey: ${privateKey}]: ${err.message}. Restarting...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    worker(privateKey); // Restart worker
  }
}

async function main() {
  try {
    console.log("Starting workers...");
    const workerPromises = senderPrivateKeys.map((privateKey) => worker(privateKey));
    await Promise.all(workerPromises); // Wait for all workers to complete
  } catch (err) {
    console.error(`Main process error: ${err.message}`);
  }
main().catch(console.error);

}
main();