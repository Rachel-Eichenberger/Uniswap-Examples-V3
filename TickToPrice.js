const fs = require('fs');
const { ethers } =require("ethers")


	// ERC20 json abi file
let ERC20Abi = fs.readFileSync('/SOLS/ERC20.json');
const ERC20 = JSON.parse(ERC20Abi);

	// V3 pool abi json file
let pool = fs.readFileSync('/SOLS/V3PairAbi.json');
const IUniswapV3PoolABI = JSON.parse(pool);

	// V3 factory abi json
let facto = fs.readFileSync('/SOLS/V3factory.json');
const IUniswapV3FactoryABI = JSON.parse(facto);


let NFT = fs.readFileSync('/SOLS/UniV3NFT.json');
const IUniswapV3NFTmanagerABI = JSON.parse(NFT);

const provider = new ethers.providers.JsonRpcProvider("<RPC KEY>")

	// V3 standard addresses (different for celo)
const factory = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

const UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const TETHER = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"


function sleep(ms) {
  return new Promise((resolve) => {
	setTimeout(resolve, ms);
  });
}



async function getData(token0,token1,fee){
	
	
	const t0 = token0.toLowerCase() < token1.toLowerCase() ? token0 : token1;
	const t1 = token0.toLowerCase() < token1.toLowerCase() ? token1 : token0;
	
	let FactoryContract = new ethers.Contract(factory, IUniswapV3FactoryABI, provider);
	
	let token0contract =  new ethers.Contract(t0, ERC20, provider);
	let token1contract =  new ethers.Contract(t1, ERC20, provider);
	let token0Decimal = await token0contract.decimals();
	let token1Decimal = await token1contract.decimals();
	
	let token0sym = await token0contract.symbol();
	let token1sym = await token1contract.symbol();
	
	let V3pool = await FactoryContract.getPool(token0, token1, fee);
	if(V3pool == "0x0000000000000000000000000000000000000000"){
		return false
	}
	let poolContract = new ethers.Contract(V3pool, IUniswapV3PoolABI, provider);

	let slot0 = await poolContract.slot0();
	let TickSpace = parseInt(await poolContract.tickSpacing());
	
	let Tick = parseInt(slot0.tick);
	
	let T0name = token0sym;
	let T1name = token1sym;
	
	let dict = {"tick" : slot0.tick.toString(), "T0n": T0name, "T1n": T1name, "T0d": token0Decimal, "T1d": token1Decimal};
	console.log(dict);
	return dict
}




function TickToPrice(tick, token0Decimals, token1Decimals){
	let price0 = (1.0001**tick)/(10**(token1Decimals-token0Decimals));
	let price1 = 1 / price0;
	return [price0.toFixed(token1Decimals), price1.toFixed(token0Decimals)]
}




async function tester(token0, token1, fee){
	let data = await getData(token0, token1, fee);
	if(data == false){
		console.log("No pool for: "+token0+" "+token1+" "+fee);
		return
	}
	let price = await TickToPrice(data.tick, data.T0d, data.T1d);
	console.log(data.T1n+" per "+data.T0n+": "+price[0]);
	console.log(data.T0n+" per "+data.T1n+": "+price[1]);
	console.log("")
}


async function strt(){
	await tester(WETH,USDC,3000);
	await sleep(250);
	
	await tester(TETHER,USDC,3000);
	await sleep(250);
	
	await tester(UNI,USDC,3000);
	await sleep(250);
	
	await tester(TETHER,UNI,3000);
	await sleep(250);
	
	await tester(WBTC,UNI,3000);
	await sleep(250);
	
	await tester(WBTC,WETH,3000);
	await sleep(250);
	
	await tester(WBTC,USDC,3000);
	await sleep(250);
}


strt()