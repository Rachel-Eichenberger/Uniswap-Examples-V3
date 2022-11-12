import { JSBI } from "@uniswap/sdk";
import { ethers } from 'ethers'
import * as fs from 'fs';


	// ERC20 json abi file
let ERC20Abi = fs.readFileSync('<path>/ERC20.json');
const ERC20 = JSON.parse(ERC20Abi);

	// V3 pool abi json file
let pool = fs.readFileSync('<path>/V3PairAbi.json');
const IUniswapV3PoolABI = JSON.parse(pool);

	// V3 factory abi json
let facto = fs.readFileSync('<path>/V3factory.json');
const IUniswapV3FactoryABI = JSON.parse(facto);

    // V3 NFT manager abi
let NFT = fs.readFileSync('<path>/UniV3NFT.json');
const IUniswapV3NFTmanagerABI = JSON.parse(NFT);


const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/<API_Key>")


	// V3 standard addresses (different for celo)
const factory = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const NFTmanager = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";



async function getData(ownerAddress, tokenID){
	var FactoryContract = new ethers.Contract(factory, IUniswapV3FactoryABI, provider);

	var NFTContract =  new ethers.Contract(NFTmanager, IUniswapV3NFTmanagerABI, provider);
	var position = await NFTContract.positions(tokenID);
	
	var token0contract =  new ethers.Contract(position.token0, ERC20, provider);
	var token1contract =  new ethers.Contract(position.token1, ERC20, provider);
	var token0Decimal = await token0contract.decimals();
	var token1Decimal = await token1contract.decimals();
	
	var token0sym = await token0contract.symbol();
	var token1sym = await token1contract.symbol();
	
	var V3pool = await FactoryContract.getPool(position.token0, position.token1, position.fee);
	var poolContract = new ethers.Contract(V3pool, IUniswapV3PoolABI, provider);

	var slot0 = await poolContract.slot0();
	var tickLow = await poolContract.ticks(position.tickLower.toString());
	var tickHi = await poolContract.ticks(position.tickUpper.toString());
	
	var feeGrowthGlobal0 = await poolContract.feeGrowthGlobal0X128();
	var feeGrowthGlobal1 = await poolContract.feeGrowthGlobal1X128();
	
	var pairName = token0sym +"/"+ token1sym;
	
	var dict = {
	"Pair": pairName, 
	"T0d": token0Decimal, 
	"T1d": token1Decimal, 
	"tickCurrent": slot0.tick, 
	"tickLow": position.tickLower, 
	"tickHigh": position.tickUpper, 
	"liquidity": position.liquidity.toString(), 
	"feeGrowth0Low": tickLow.feeGrowthOutside0X128.toString(),  
	"feeGrowth0Hi": tickHi.feeGrowthOutside0X128.toString(), 
	"feeGrowth1Low": tickLow.feeGrowthOutside1X128.toString(),  
	"feeGrowth1Hi": tickHi.feeGrowthOutside1X128.toString(),
	"feeGrowthInside0LastX128": position.feeGrowthInside0LastX128.toString(),
	"feeGrowthInside1LastX128": position.feeGrowthInside1LastX128.toString(),
	"feeGrowthGlobal0X128": feeGrowthGlobal0.toString(), 
	"feeGrowthGlobal1X128": feeGrowthGlobal1.toString()}
	
	return dict
}


const ZERO = JSBI.BigInt(0);
const Q128 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128));
const Q256 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(256));


async function toBigNumber(numstr){
  let bi = numstr;
  if (typeof sqrtRatio !== 'bigint') {
    bi = JSBI.BigInt(numstr);
  }
  return bi;
};


export function subIn256(x, y){
  const difference = JSBI.subtract(x, y)

  if (JSBI.lessThan(difference, ZERO)) {
    return JSBI.add(Q256, difference)
  } else {
    return difference
  }
}


async function getFees(feeGrowthGlobal0, feeGrowthGlobal1, feeGrowth0Low, feeGrowth0Hi, feeGrowthInside0, feeGrowth1Low, feeGrowth1Hi, feeGrowthInside1, liquidity, decimals0, decimals1, tickLower, tickUpper, tickCurrent){
	// Check out the relevant formulas below which are from Uniswap Whitepaper Section 6.3 and 6.4
	// 𝑓𝑟 =𝑓𝑔−𝑓𝑏(𝑖𝑙)−𝑓𝑎(𝑖𝑢)
	// 𝑓𝑢 =𝑙·(𝑓𝑟(𝑡1)−𝑓𝑟(𝑡0))
	// Global fee growth per liquidity '𝑓𝑔' for both token 0 and token 1
	let feeGrowthGlobal_0 = await toBigNumber(feeGrowthGlobal0);
	let feeGrowthGlobal_1 = await toBigNumber(feeGrowthGlobal1);

	// Fee growth outside '𝑓𝑜' of our lower tick for both token 0 and token 1
	let tickLowerFeeGrowthOutside_0 = await toBigNumber(feeGrowth0Low);
	let tickLowerFeeGrowthOutside_1 = await toBigNumber(feeGrowth1Low);

	// Fee growth outside '𝑓𝑜' of our upper tick for both token 0 and token 1
	let tickUpperFeeGrowthOutside_0 = await toBigNumber(feeGrowth0Hi);
	let tickUpperFeeGrowthOutside_1 = await toBigNumber(feeGrowth1Hi);

	// These are '𝑓𝑏(𝑖𝑙)' and '𝑓𝑎(𝑖𝑢)' from the formula
	// for both token 0 and token 1
	let tickLowerFeeGrowthBelow_0 = ZERO;
	let tickLowerFeeGrowthBelow_1 = ZERO;
	let tickUpperFeeGrowthAbove_0 = ZERO;
	let tickUpperFeeGrowthAbove_1 = ZERO;

	// These are the calculations for '𝑓𝑎(𝑖)' from the formula
	// for both token 0 and token 1
	if (tickCurrent >= tickUpper){
		tickUpperFeeGrowthAbove_0 = await subIn256(feeGrowthGlobal_0, tickUpperFeeGrowthOutside_0);
		tickUpperFeeGrowthAbove_1 = await subIn256(feeGrowthGlobal_1, tickUpperFeeGrowthOutside_1);
	}else{
		tickUpperFeeGrowthAbove_0 = tickUpperFeeGrowthOutside_0
		tickUpperFeeGrowthAbove_1 = tickUpperFeeGrowthOutside_1
	}

	// These are the calculations for '𝑓b(𝑖)' from the formula
	// for both token 0 and token 1
	if (tickCurrent >= tickLower){
		tickLowerFeeGrowthBelow_0 = tickLowerFeeGrowthOutside_0
		tickLowerFeeGrowthBelow_1 = tickLowerFeeGrowthOutside_1
	}else{
		tickLowerFeeGrowthBelow_0 = await subIn256(feeGrowthGlobal_0, tickLowerFeeGrowthOutside_0);
		tickLowerFeeGrowthBelow_1 = await subIn256(feeGrowthGlobal_1, tickLowerFeeGrowthOutside_1);
	}

	
	// Calculations for '𝑓𝑟(𝑡1)' part of the '𝑓𝑢 =𝑙·(𝑓𝑟(𝑡1)−𝑓𝑟(𝑡0))' formula
	// for both token 0 and token 1
	let fr_t1_0 = await subIn256(await subIn256(feeGrowthGlobal_0, tickLowerFeeGrowthBelow_0), tickUpperFeeGrowthAbove_0);
	let fr_t1_1 = await subIn256(await subIn256(feeGrowthGlobal_1, tickLowerFeeGrowthBelow_1), tickUpperFeeGrowthAbove_1);

	// '𝑓𝑟(𝑡0)' part of the '𝑓𝑢 =𝑙·(𝑓𝑟(𝑡1)−𝑓𝑟(𝑡0))' formula
	// for both token 0 and token 1
	let feeGrowthInsideLast_0 = await toBigNumber(feeGrowthInside0);
	let feeGrowthInsideLast_1 = await toBigNumber(feeGrowthInside1);

	// The final calculations for the '𝑓𝑢 =𝑙·(𝑓𝑟(𝑡1)−𝑓𝑟(𝑡0))' uncollected fees formula
	// for both token 0 and token 1 since we now know everything that is needed to compute it
	let uncollectedFees_0 = (liquidity * await subIn256(fr_t1_0, feeGrowthInsideLast_0)) / Q128;
	let uncollectedFees_1 = (liquidity * await subIn256(fr_t1_1, feeGrowthInsideLast_1)) / Q128;
	console.log("Amount fees token 0 wei: "+Math.floor(uncollectedFees_0));
	console.log("Amount fees token 1 wei: "+Math.floor(uncollectedFees_1));
	
	// Decimal adjustment to get final results
	let uncollectedFeesAdjusted_0 = (uncollectedFees_0 / await toBigNumber(10**decimals0)).toFixed(decimals0);
	let uncollectedFeesAdjusted_1 = (uncollectedFees_1 / await toBigNumber(10**decimals1)).toFixed(decimals1);
	console.log("Amount fees token 0 Human format: "+uncollectedFeesAdjusted_0);
	console.log("Amount fees token 1 Human format: "+uncollectedFeesAdjusted_1);
}


async function Start(){
	var data = await getData("0x11E4857Bb9993a50c685A79AFad4E6F65D518DDa", 5);

	
	var Fees = await getFees(data.feeGrowthGlobal0X128, data.feeGrowthGlobal1X128, data.feeGrowth0Low, data.feeGrowth0Hi, data.feeGrowthInside0LastX128, data.feeGrowth1Low, data.feeGrowth1Hi, data.feeGrowthInside1LastX128, data.liquidity, data.T0d, data.T1d, data.tickLow, data.tickHigh, data.tickCurrent);

}


Start();