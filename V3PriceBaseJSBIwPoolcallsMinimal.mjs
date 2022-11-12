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

function toPlainString(num) {
  return (''+ +num).replace(/(-?)(\d*)\.?(\d*)e([+-]\d+)/,
    function(a,b,c,d,e) {
      return e < 0
        ? b + '0.' + Array(1-e-c.length).join(0) + c + d
        : b + c + d + Array(e-d.length+1).join(0);
    });
}


async function getPoolData(token0, token1, fee){
	var token0contract =  new ethers.Contract(token0, ERC20, provider);
	var token1contract =  new ethers.Contract(token1, ERC20, provider);
	var token0Decimal = await token0contract.decimals();
	var token1Decimal = await token1contract.decimals();
	var token0sym = await token0contract.symbol();
	var token1sym = await token1contract.symbol();
	var FactoryContract =  new ethers.Contract(factory, IUniswapV3FactoryABI, provider);
	var V3pool = await FactoryContract.getPool(token0, token1, fee);
	var poolContract =  new ethers.Contract(V3pool, IUniswapV3PoolABI, provider);
	var slot0 = await poolContract.slot0();
	var pairName = token0sym +"/"+ token1sym;
	return {"SqrtX96" : slot0.sqrtPriceX96.toString(), "Pair": pairName, "T0d": token0Decimal, "T1d": token1Decimal}
}


function GetPrice(testz){
	let sqrtPriceX96 = testz.SqrtX96;
	let token0Decimals = testz.T0d;
	let token1Decimals = testz.T1d;
	
	var buyOneOfToken0 = (sqrtPriceX96 * sqrtPriceX96 * (10**token0Decimals) / (10**token1Decimals) / JSBI.BigInt(2) ** (JSBI.BigInt(192))).toFixed(token1Decimals);
	var buyOneOfToken1 = (1 / buyOneOfToken0).toFixed(token0Decimals);
	console.log("price of token0 in value of token1 : " + buyOneOfToken0.toString());
	console.log("price of token1 in value of token0 : " + buyOneOfToken1.toString());
	//console.log("");
	
		// Convert to wei
	var buyOneOfToken0Wei = toPlainString(Math.floor(buyOneOfToken0 * (10**token1Decimals)));
	var buyOneOfToken1Wei = toPlainString(Math.floor(buyOneOfToken1 * (10**token0Decimals)));
	console.log("price of token0 in value of token1 in lowest decimal : " + buyOneOfToken0Wei);
	console.log("price of token1 in value of token1 in lowest decimal : " + buyOneOfToken1Wei);
	console.log("");
}




async function st(){
	var data = await getPoolData("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0xdAC17F958D2ee523a2206206994597C13D831ec7", 500);
	console.log(data)
	GetPrice(data)
}


st()

//const testa = {"SqrtX96" : "1795414558883038839252603454575377", "Pair":"USDC/WETH", "T0d":6, "T1d":18}
//const testb = {"SqrtX96" : "177403796449349488305650", "Pair":"USDT/UNI", "T0d":18, "T1d":6}
//const testc = {"SqrtX96" : "2155762217846613132494468993", "Pair":"Dai/WETH", "T0d":18, "T1d":18}
//const testd = {"SqrtX96" : "79230069777981184539141962837", "Pair":"USDC/USDT", "T0d":6, "T1d":6}
//const teste = {"SqrtX96" : "215524551323017484063050", "Pair":"LINK/USDC", "T0d":18, "T1d":6}
//GetPrice(testa);
//GetPrice(testb);
//GetPrice(testc);
//GetPrice(testd);
//GetPrice(teste);