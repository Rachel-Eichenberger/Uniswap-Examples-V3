let Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('<RPC_Key>'));
const fs = require('fs');
const BigNumber = require('bignumber.js');

// uniswap V2 pair abi
let PrD = fs.readFileSync('/Pair.json');

// ERC20 pair abi
let ERC20D = fs.readFileSync('/ERC20.json');

const PairAbi = JSON.parse(PrD);
const ERC20 = JSON.parse(ERC20D);

let BN = web3.utils.BN;
BigNumber.config({ DECIMAL_PLACES: 18 })

//   WETH FOX Uniswap V2 contract address
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
var PairAddress;
var PairContract;

const ethDec = new BigNumber(1000000000000000000)
var T0dec;
var T1dec;

// next two functions set global values
async function setDecs(t0dec, t1dec){
	T0dec = new BigNumber(10**t0dec);
	T1dec = new BigNumber(10**t1dec);
}

async function setPoolAddress(LpToken){
	PairAddress = LpToken;
	PairContract = new web3.eth.Contract(PairAbi, PairAddress)
}	

//  Get ETH price from the USDC/WETH V2 pool
async function getETHPrice(){
	let USDCweth = "0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc"
	let usdcWETHcontract = new web3.eth.Contract(PairAbi, USDCweth)
	let poolR = await usdcWETHcontract.methods.getReserves().call({});
	let t0res = poolR[0];
	let t1res = poolR[1];
	let tres0 = new BigNumber(t0res.toString());
	let tres1 = new BigNumber(t1res.toString());
	var T0price = tres0.div(tres1).multipliedBy(new BigNumber(10).pow(new BigNumber(Math.abs(6-18))));
	return T0price;
}

// Price Amount of Token 0 to buy 1 of Token 1
async function getToken0Price(t0res, t1res, t0dec, t1dec){
	let tres0 = new BigNumber(t0res.toString());
	let tres1 = new BigNumber(t1res.toString());
	var T0price;
	if(t0dec == t1dec){
		T0price = tres0.div(tres1)
	}else{
		T0price = tres0.div(tres1).multipliedBy(new BigNumber(10).pow(new BigNumber(Math.abs(t0dec-t1dec))));
	}
	return T0price;
}

// Price Amount of Token 1 to buy 1 of Token 0
async function getToken1Price(t0res, t1res, t0dec, t1dec){
	let tres0 = new BigNumber(t0res.toString());
	let tres1 = new BigNumber(t1res.toString());
	var T1price;
	if(t0dec == t1dec){
		T1price = tres1.div(tres0)
	}else{
		T1price = tres1.div(tres0).div(new BigNumber(10).pow(new BigNumber(Math.abs(t0dec-t1dec))));
	}
	return T1price;
}

// get the reserves of the pool
async function reserves(){
	let poolR = await PairContract.methods.getReserves().call({});
	return [new BigNumber(poolR[0]),new BigNumber(poolR[1])];
}

// gets user balance of LP tokens
async function BalOf(owner){
	let myERC20bal = await PairContract.methods.balanceOf(owner).call({});
	return new BigNumber(myERC20bal);
}

// call total supply of LP tokens
async function supply(){
	let TotalERC20bal = await PairContract.methods.totalSupply().call({});
	return new BigNumber(TotalERC20bal);
}

// calling decimals from contract
async function getDecimals(address){
	let ERC20contract = new web3.eth.Contract(ERC20, address);
	let decs = await ERC20contract.methods.decimals().call({});
	return decs;
}


async function percentageOf(UserLPqty, TotalSupply, reserve0, reserve1, t0dec, t1dec, PairWithWeth){
	// users liquidity percentage
	let Percent = UserLPqty.div(TotalSupply);
	//          Users LP total multiplied by the token 0 reserve, and divided by the Total token supply will give user token 0 quantity
	let token0 = UserLPqty.multipliedBy(reserve0).div(TotalSupply);
	//          Users LP total multiplied by the token 1 reserve, and divided by the Total token supply will give user token 1 quantity
	let token1 = UserLPqty.multipliedBy(reserve1).div(TotalSupply);
	//   get token prices
	let t0price = await getToken0Price(reserve0, reserve1, t0dec, t1dec);
	let t1price = await getToken1Price(reserve0, reserve1, t0dec, t1dec);
	let ETHprice = await getETHPrice();
	
	console.log("current ETH Price = "+ETHprice+" and WETH is "+PairWithWeth);
	console.log("");
	
	// convert token amounts to USD value
	var T0usdPrice;
	var T1usdPrice;
	if(PairWithWeth == "token0"){
		T0usdPrice = ETHprice.multipliedBy(token0).div(ethDec);
		let T1usdPrices = t1price.div(new BigNumber(token1.toString()));
		T1usdPrice = ETHprice.div(T1usdPrices).div(T0dec);
	}
	if(PairWithWeth == "token1"){
		T0usdPrice = token0.multipliedBy(ETHprice).multipliedBy(new BigNumber(t1price)).div(T0dec);
		T1usdPrice = ETHprice.multipliedBy(token1).div(T1dec);
	}
	if(PairWithWeth == "Not ETH Pair"){
		T0usdPrice = "Not an ETH pair, calculations get more complex as you need to get a pair that has WETH for this example based on WETH usd price";
		T1usdPrice = "Not an ETH pair, calculations get more complex as you need to get a pair that has WETH for this example based on WETH usd price";
	}
	
	console.log("Amount Token 0 to buy 1 of Token 1")
	console.log(t0price.toString());
	console.log("");
	console.log("Amount Token 1 to buy 1 of Token 0")
	console.log(t1price.toString());
	console.log("");
	console.log("Amount Token 0 user holds")
	console.log((token0.div(T0dec)).toString());
	console.log("");
	console.log("Amount Token 1 user holds")
	console.log((token1.div(T1dec)).toString());
	console.log("");
	console.log("Users Token 0 USD value")
	console.log(T0usdPrice.toString());
	console.log("");
	console.log("Users Token 1 USD value")
	console.log(T1usdPrice.toString());
	console.log("");
	console.log("combined USD value")
	console.log(T0usdPrice.plus(T1usdPrice).toString());
	
}










async function Ready(userAddress,LpTokenAddress){
	// set global values
	await setPoolAddress(LpTokenAddress);
	// get Balance of Users LP tokens
	let bal = await BalOf(userAddress);
	// get Total supply of LP tokens
	let sup = await supply();
	// get Pool reserves
	let reservePool = await reserves();
	// get Pool token addresses token 0 and token 1
	let token0address = await PairContract.methods.token0().call({});
	let token1address = await PairContract.methods.token1().call({});
	// used to determine pair token prices
	let PairWithWeth = token0address == WETH ? "token0" : token1address == WETH ? "token1" : "Not ETH Pair";
	// get token decimals for each token
	let tok0decs = await getDecimals(token0address);
	let tok1decs = await getDecimals(token1address);
	// set global values
	await setDecs(tok0decs, tok1decs);
	// function that runs the pricing and total tokens
	await percentageOf(bal,sup,reservePool[0],reservePool[1],tok0decs,tok1decs,PairWithWeth);
}

//         Users Address                              Users LP token contract address
Ready("0x64763373e21bcc7ca7ac03e74c6dc56bea78a6f1","0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc")
//Ready("0xea745c344e8198b602df3af937bcbf3a1d917817","0xBb2b8038a1640196FbE3e38816F3e67Cba72D940")