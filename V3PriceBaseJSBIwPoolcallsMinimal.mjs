import { JSBI } from "@uniswap/sdk";
import { ethers } from 'ethers';
import * as fs from 'fs';

	// ERC20 abi
let ERC20Abi = fs.readFileSync('<path>/ERC20.json');
const ERC20 = JSON.parse(ERC20Abi);
	// V3 pair abi
let pool = fs.readFileSync('<path>/V3PairAbi.json');
const IUniswapV3PoolABI = JSON.parse(pool);
	// V3 factory abi
let facto = fs.readFileSync('<path>/V3factory.json');
const IUniswapV3FactoryABI = JSON.parse(facto);


const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/<API_Key>")


const factory = "0x1F98431c8aD98523631AE4a59f267346ea31F984";


async function getPoolData(token0, token1, fee){
	const t0 = token0.toLowerCase() < token1.toLowerCase() ? token0 : token1;
	const t1 = token0.toLowerCase() < token1.toLowerCase() ? token1 : token0;
	const token0contract =  new ethers.Contract(t0, ERC20, provider);
	const token1contract =  new ethers.Contract(t1, ERC20, provider);
	const Decimal0 = await token0contract.decimals();
	const Decimal1 = await token1contract.decimals();
	const token0sym = await token0contract.symbol();
	const token1sym = await token1contract.symbol();
	const FactoryContract =  new ethers.Contract(factory, IUniswapV3FactoryABI, provider);
	const V3pool = await FactoryContract.getPool(token0, token1, fee);
	const poolContract =  new ethers.Contract(V3pool, IUniswapV3PoolABI, provider);
	const slot0 = await poolContract.slot0();
	const pairName = token0sym +"/"+ token1sym;
	return {"SqrtX96" : slot0.sqrtPriceX96.toString(), "Pair": pairName, "Decimal0": Decimal0, "Decimal1": Decimal1}
}


function GetPrice(PoolInfo){
	let sqrtPriceX96 = PoolInfo.SqrtX96;
	let Decimal0 = PoolInfo.Decimal0;
	let Decimal1 = PoolInfo.Decimal1;
	
	const buyOneOfToken0 = (sqrtPriceX96 * sqrtPriceX96 * (10**Decimal0) / (10**Decimal1) / JSBI.BigInt(2) ** (JSBI.BigInt(192))).toFixed(Decimal1);
	const buyOneOfToken1 = (1 / buyOneOfToken0).toFixed(Decimal0);
	console.log("price of token0 in value of token1 : " + buyOneOfToken0.toString());
	console.log("price of token1 in value of token0 : " + buyOneOfToken1.toString());
	//console.log("");
	
		// Convert to wei
	const buyOneOfToken0Wei = (Math.floor(buyOneOfToken0 * (10**Decimal1))).toLocaleString('fullwide', {useGrouping:false});
	const buyOneOfToken1Wei = (Math.floor(buyOneOfToken1 * (10**Decimal0))).toLocaleString('fullwide', {useGrouping:false});
	console.log("price of token0 in value of token1 in lowest decimal : " + buyOneOfToken0Wei);
	console.log("price of token1 in value of token1 in lowest decimal : " + buyOneOfToken1Wei);
	console.log("");
}




async function st(){
	const data = await getPoolData("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xdAC17F958D2ee523a2206206994597C13D831ec7", 500);
	console.log(data)
	GetPrice(data)
}


st()

//const testa = {"SqrtX96" : "1795414558883038839252603454575377", "Pair":"USDC/WETH", "Decimal0":6, "Decimal1":18}
//const testb = {"SqrtX96" : "177403796449349488305650", "Pair":"USDT/UNI", "Decimal0":18, "Decimal1":6}
//const testc = {"SqrtX96" : "2155762217846613132494468993", "Pair":"Dai/WETH", "Decimal0":18, "Decimal1":18}
//const testd = {"SqrtX96" : "79230069777981184539141962837", "Pair":"USDC/USDT", "Decimal0":6, "Decimal1":6}
//const teste = {"SqrtX96" : "215524551323017484063050", "Pair":"LINK/USDC", "Decimal0":18, "Decimal1":6}
//GetPrice(testa);
//GetPrice(testb);
//GetPrice(testc);
//GetPrice(testd);
//GetPrice(teste);