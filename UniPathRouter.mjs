import { AlphaRouter } from '@uniswap/smart-order-router'
import { Token, CurrencyAmount } from '@uniswap/sdk-core'
import { JSBI, Percent } from "@uniswap/sdk";
import { ethers, BigNumber } from "ethers";


const V3_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";

const TokenInput = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const TokenOutput = "0x48C3399719B582dD63eB5AADf12A40B4C3f52FA2";


const web3 = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");

const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const wallet = new ethers.Wallet(privateKey,web3);
const address = wallet.address;

import * as fs from 'fs';

let UniV3RouterAbi = fs.readFileSync('/NewUniRouter.json');
const V3routerAbi = JSON.parse(UniV3RouterAbi);

let ERC20Abi = fs.readFileSync('/ERC20.json');
const ERC20 = JSON.parse(ERC20Abi);

let WETHAbij = fs.readFileSync('/WETHAbi.json');
const WETHAbi = JSON.parse(WETHAbij);

async function log(inpt){
	console.log(inpt);
	console.log("");
}

async function TokBal(tokens){
	var ERC20contract =  new ethers.Contract(tokens, ERC20, web3);
	var myERC20bal = await ERC20contract.balanceOf(wallet.address);
	return myERC20bal;
}

async function Deposit(amt){
	var WethC =  new ethers.Contract(TokenInput, WETHAbi, web3);
	var datac = await WethC.populateTransaction["deposit"]();
	var ncn = await wallet.getTransactionCount();

	const transaction = {
	  data: datac.data,
	  nonce: ncn,
	  to: TokenInput,
	  value: BigNumber.from(amt),
	  from: wallet.address,
	  gasPrice: '0x174876e800',
	  gasLimit: '0x493e0',
	};

	const signedTx = await wallet.signTransaction(transaction);
	const txHash =  await web3.sendTransaction(signedTx);
	log(txHash.hash);
}

async function Approve(Toked, amt){
	var WethC =  new ethers.Contract(Toked, ERC20, web3);
	var datac = await WethC.populateTransaction["approve"](V3_SWAP_ROUTER_ADDRESS, amt);
	var ncn = await wallet.getTransactionCount();

	const transaction = {
	  data: datac.data,
	  nonce: ncn,
	  to: Toked,
	  value: BigNumber.from("0"),
	  from: wallet.address,
	  gasPrice: '0x174876e800',
	  gasLimit: '0x493e0',
	};

	const signedTx = await wallet.signTransaction(transaction);
	const txHash =  await web3.sendTransaction(signedTx);
	log(txHash.hash);
	var appFor = await WethC.callStatic.allowance(wallet.address, V3_SWAP_ROUTER_ADDRESS);
	log("Approved : "+appFor.toString());
}


//const router = new AlphaRouter({ chainId: 1, provider: web3Provider });
const router = new AlphaRouter({ chainId: 42161, provider: web3Provider });

const WETH = new Token(
  router.chainId,
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  18,
  'WETH',
  'Wrapped Ether'
);

const USDC = new Token(
  router.chainId,
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  6,
  'USDC',
  'USD//C'
);



const typedValueParsed = '100000000000000000000000';
const wethAmount = CurrencyAmount.fromRawAmount(spa, JSBI.BigInt(typedValueParsed));

const IO = "Exact_Input"
const TradeType = IO == "Exact_Input" ? 0 : 1;


const route = await router.route(
  wethAmount,
  USDC,
  TradeType,
  {
    recipient: wallet.address,
    slippageTolerance: new Percent(5, 100),
    deadline: Math.floor(Date.now()/1000 +1800)
  }
);

var Ebal = await web3.getBalance(wallet.address);
log("Wallet Balance : "+Ebal.toString());

var tbal = await TokBal(TokenOutput);
log("Token Out Balance : "+tbal.toString());

await Deposit("1000000000000000000");
await Approve(TokenInput,"1000000000000000000");
var tbalW = await TokBal(TokenInput);
log("Token In Balance : "+tbalW.toString());

log(`Quote Exact In: ${route.quote.toFixed(USDCarb.decimals)}`);
log(`Gas Adjusted Quote In: ${route.quoteGasAdjusted.toFixed(USDCarb.decimals)}`);
log(route.methodParameters.calldata)

var nc = await wallet.getTransactionCount();


const transaction = {
  data: route.methodParameters.calldata,
  nonce: nc,
  to: V3_SWAP_ROUTER_ADDRESS,
  value: BigNumber.from(0),
  from: wallet.address,
  gasPrice: BigNumber.from(route.gasPriceWei),
  gasLimit: BigNumber.from(route.estimatedGasUsed).add(BigNumber.from("50000")),
};


const signedTx = await wallet.signTransaction(transaction);


const PretxHash = ethers.utils.keccak256(signedTx);


const txHash =  await web3.sendTransaction(signedTx)
log(txHash.hash);

var Ebal = await web3.getBalance(wallet.address);
log("Wallet Balance : "+Ebal.toString());

var tbal = await TokBal(TokenOutput);
log("Token Out Balance : "+tbal.toString());

var tbalW = await TokBal(TokenInput);
log("Token In Balance : "+tbalW.toString());