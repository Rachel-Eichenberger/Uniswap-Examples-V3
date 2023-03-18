const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));  // local provider for mainnet fork
//const web3 = new Web3(new Web3.providers.HttpProvider('https://eth-mainnet.alchemyapi.io/v2/E4U5MgSUsq86s3nxU9v6y9Y-hhsLxGCw'));
//const web3 = new Web3(new Web3.providers.HttpProvider('https://polygon-mainnet.g.alchemy.com/v2/Y_K_ex9iX8xmy7tfboaDQqXTmzE1n2gU'));
const fs = require('fs');
const univ3prices = require('@thanpolas/univ3prices');


const private_key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; //PK or setup ETH accounts next 3 lines
//const private_key = '02fd7b492de41fbbba9c0830262ce49f88e72d9c2d6016e51655725bdcc46d0d'; //PK or setup ETH accounts next 3 lines
const address = web3.eth.accounts.privateKeyToAccount(private_key);
web3.eth.defaultAccount = address['address'];
var FROM = address['address'];


let ID;


// Load json abi 
let V3quoterAbi = fs.readFileSync('C:/Users/Crypto_Rachel/node/SOLS/V3quoter.json');
let UniV3RouterAbi = fs.readFileSync('C:/Users/Crypto_Rachel/node/SOLS/NewUniRouter.json');
let UniV3NFTAbi = fs.readFileSync('C:/Users/Crypto_Rachel/node/SOLS/UniV3NFT.json');
let ERC20Abi = fs.readFileSync('C:/Users/Crypto_Rachel/node/SOLS/ERC20.json');
let WETHAbij = fs.readFileSync('C:/Users/Crypto_Rachel/node/SOLS/WETHAbi.json');
let V3poolabi = fs.readFileSync('C:/Users/Crypto_Rachel/node/SOLS/V3PairAbi.json');

const V3Router = JSON.parse(UniV3RouterAbi);
const V3quote = JSON.parse(V3quoterAbi);
const V3NFTm = JSON.parse(UniV3NFTAbi);
const ERC20 = JSON.parse(ERC20Abi);
const WETHAbi = JSON.parse(WETHAbij);
const V3pool = JSON.parse(V3poolabi);

// addresses
const V3quoter = '0x61fFE014bA17989E743c5F6cB21bF9697530B21e';
const V3Swapper = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
const V3NFT = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
const WETH = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1' //'0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' //'0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
//const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

const LvU3000 = "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8";


function log(inp) {
	console.log(inp);
}


// Get User token balance of token
async function TokBal(tokens){
	var ERC20contract = new web3.eth.Contract(ERC20, tokens);
	var myERC20bal = await ERC20contract.methods.balanceOf(FROM).call({});
	return myERC20bal;
}

// Deposit WETH(amountString)
async function depositWeth(amount){
	const WETHcontract = new web3.eth.Contract(WETHAbi, WETH);
	var myData = WETHcontract.methods.deposit().encodeABI();
	var gas = await WETHcontract.methods.deposit().estimateGas({from:FROM,value:web3.utils.toBN(amount),data:myData,to:WETH}).catch(function(error){console.log(error);});

	var nonce = await web3.eth.getTransactionCount(FROM);
	
	var txObject = {
		nonce:    nonce,
		value:	  web3.utils.toBN(amount),
		to:       WETH,
		from:     FROM,
		gas:      web3.utils.toHex(gas+20000),
		data: 	  myData
	}
	
	const tHash = await web3.eth.sendTransaction(txObject)
	.on('error', console.error);
	
	var Wbal = await WETHcontract.methods.balanceOf(FROM).call({});
	log(Wbal);
	
}

// Approve Token 0 before swapping
async function Approve(token,who){
	//Approval  only needs to be done once per token***//
	var amt0 = web3.utils.toBN('115792089237316195423570985008687907853269984665640564039457584007913129639935'); //Max approval
	const ERC20contract = new web3.eth.Contract(ERC20, token);
	var myData = ERC20contract.methods.approve(who,amt0).encodeABI();
	var gas = await ERC20contract.methods.approve(who,amt0).estimateGas({from:FROM,data:myData,to:token}).catch(function(error){log(error);});

	var nonce2 = await web3.eth.getTransactionCount(FROM);
	//console.log(nonce2);
	var txObject = {
		nonce:    nonce2,
		to:       token,
		from:     FROM,
		value:    web3.utils.toHex(0),
		gas:      web3.utils.toHex(gas+20000),
		data: 	  myData
	}
	
	const tHash = await web3.eth.sendTransaction(txObject)
	.on('error', console.error);
	//end approval ***//
}

async function ExactInETH(TokenSelling,TokenBuying,Fee,AmountSending,SlipP){
	// get deadline
	var Deadline = Math.floor(Date.now()/1000 +1800);
	var slip = (100 - parseFloat(slipP))*10;
	
	// get quote output for slippage
	var QuoterEnc = {'tokenIn':TokenSelling,'tokenOut':TokenBuying,'fee':Fee.toString(),'amountIn':AmountSending.toString(),'sqrtPriceLimitX96':'0'};
	
	const quoter = new web3.eth.Contract(V3quote,V3quoter);
	var quoted = await quoter.methods.quoteExactInputSingle(QuoterEnc).call();
	console.log(quoted[0]);
	//log amount out
	
	// get slippage
	var BNquote = web3.utils.toBN(quoted[0]);
	var Slippage = BNquote.sub((((BNquote.mul(web3.utils.toBN("1000"))).mul(web3.utils.toBN(slip))).div(web3.utils.toBN("1000"))).div(web3.utils.toBN("1000")));
	console.log(Slippage.toString())
	// log slippage
	
	//encode swap
	var encoded = {'tokenIn':TokenSelling,'tokenOut':TokenBuying,'fee':Fee.toString(),'recipient':FROM,'deadline':Deadline.toString(),'amountIn':AmountSending.toString(),'amountOutMinimum':Slippage.toString(),'sqrtPriceLimitX96':'0'};

	const MySwap = new web3.eth.Contract(V3Router,V3Swapper); // V3 router contract not new one
	
	var calls = [];
	var multi1 = MySwap.methods.exactInputSingle(encoded).encodeABI();
	var multi2 = MySwap.methods.refundETH().encodeABI();
	
	calls.push(multi1);
    calls.push(multi2);
	
	var multi0 = MySwap.methods.multicall(calls).encodeABI();
	//console.log(multi0)
	
	var gas = await MySwap.methods.multicall(calls).estimateGas({from:FROM,value:AmountSending,data:multi0,to:V3Swapper}).catch(function(error){concole.log(error);});

	var nonce3 = await web3.eth.getTransactionCount(FROM);
	
	var txObject = {
		nonce:    nonce3,
		to:       V3Swapper,
		from:     FROM,
		value:    AmountSending,
		gas:      web3.utils.toHex(gas+20000), //I always add 20k gas for miscalculations
		data: 	  multi0
	}
		
	const tHash = await web3.eth.sendTransaction(txObject)
	.on('error', console.error);
	
	var Tbal = await TokBal(TokenBuying);
	console.log(Tbal); // Log Token bought Balance
}

/* struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }
	
struct IncreaseLiquidityParams {
        uint256 tokenId;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    } */
	
async function mintTokens(token0,token1,fee,tickLower,tickUpper,amount0Desired,amount1Desired,slippage){
	var deadline = Math.floor(Date.now()/1000 +1800);
	var slip = (100 - parseFloat(slippage))*10;
	log(slip);
	
	//(((100*1000)-((100-slip)*100)/1000)/1000
	//100-(((100*1000)*990)/1000)/1000
	var amount0DesiredBN = web3.utils.toBN(amount0Desired);
	var amount0Min = amount0DesiredBN.sub((((amount0DesiredBN.mul(web3.utils.toBN("1000"))).mul(web3.utils.toBN(slip))).div(web3.utils.toBN("1000"))).div(web3.utils.toBN("1000")));
	log(amount0Min.toString())
	
	var amount1DesiredBN = web3.utils.toBN(amount1Desired);
	var amount1Min = amount1DesiredBN.sub((((amount1DesiredBN.mul(web3.utils.toBN("1000"))).mul(web3.utils.toBN(slip))).div(web3.utils.toBN("1000"))).div(web3.utils.toBN("1000")));
	log(amount1Min.toString())
	
	var mintParam = {'token0':token0,'token1':token1,'fee':fee,'tickLower':tickLower,'tickUpper':tickUpper,'amount0Desired':amount0Desired,'amount1Desired':amount1Desired,'amount0Min':amount0Min.toString(),'amount1Min':amount1Min.toString(),'recipient':FROM,'deadline':deadline}
	
	const V3nftO = new web3.eth.Contract(V3NFTm, V3NFT);
	var myData = V3nftO.methods.mint(mintParam).encodeABI();
	var gas = await V3nftO.methods.mint(mintParam).estimateGas({from:FROM,data:myData,to:V3NFT}).catch(function(error){log(error);});

	var nonce2 = await web3.eth.getTransactionCount(FROM);
	
	var txObject = {
		nonce:    nonce2,
		to:       V3NFT,
		from:     FROM,
		value:    web3.utils.toHex(0),
		gas:      web3.utils.toHex(gas+20000),
		data: 	  myData
	}
	
	const tHash = await web3.eth.sendTransaction(txObject)
	.on('error', console.error)
	.on('confirmation', function(confirmationNumber, receipt){ 
		var dat = receipt["logs"][receipt["logs"].length-1];
		var dat0 = receipt["logs"][receipt["logs"].length-1].topics[1];
		var dec = web3.eth.abi.decodeParameters(["uint128","uint256","uint256"],dat.data)
		var decID = web3.eth.abi.decodeParameters(["uint256"],dat0)
		log("Liquidity "+dec[0]);
		log("amount0 "+dec[1]);
		log("amount1 "+dec[2]);
		log("ID "+decID[0]);
		ID = decID[0]
		})
	
	return [decID[0],dec];
}


/* struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    } */
	
async function Collector(Pid){
	const V3nftO = new web3.eth.Contract(V3NFTm, V3NFT);   //V3 NFT manager contract
	var MAX = "340282366920938463463374607431768211455";   // MAX_VALUE UINT128   Collect All value
	var encoded = {"tokenId":Pid,"recipient":FROM,"amount0Max":MAX,"amount1Max":MAX};
	var myData3 = await V3nftO.methods.collect(encoded).call().catch(function (err){log(err)});
	log(myData3.amount0);
	log(myData3.amount1);
}

/* struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    } */

async function GetLQbalance(position,LQ){
	const V3nftO = new web3.eth.Contract(V3NFTm, V3NFT); 
	var encoded = {"tokenId":position, "liquidity":LQ, "amount0Min":"0", "amount1Min":"0", "deadline":"2297143552"};
	var myDataLQ = await V3nftO.methods.collect(encoded).call().catch(function (err){log(err)});
	log(myDataLQ);
}

function tickToPrice(decimals,tickP){
	const absTick = Math.abs(tickP);
	const denominator = 10**(Math.abs(decimals[0] - decimals[1]));
	const numerator = 1.0001 ** absTick;
	//const fraction = numerator/denominator;
	const fraction = denominator/numerator;

	return fraction;
}

async function getAmountToken0(amt1, tokenDecimals, tickC, tickL, tickH){
	var DecWei = 10**tokenDecimals[0];
	let mapping = web3.utils.unitMap; 
	let MapKey = '';
	for (const key in mapping) {
	   if (mapping[key] === DecWei.toString()) {
	      MapKey = key;
	   }	   
	}
	var x = parseFloat(web3.utils.fromWei(amt1))
	log(x)
	var price = parseFloat(await tickToPrice(tokenDecimals,tickC))
	log(price)
	var price_high = parseFloat(await tickToPrice(tokenDecimals,tickH))
	log(price_high)
	var price_low = parseFloat(await tickToPrice(tokenDecimals,tickL))
	log(price_low)
	var L = x * Math.sqrt(price) * Math.sqrt(price_high) / (Math.sqrt(price_high) - Math.sqrt(price))
	var y = L * (Math.sqrt(price) - Math.sqrt(price_low))
	log(y)
	return web3.utils.toWei(y.toFixed(tokenDecimals[0]),MapKey);
}


async function RM(){
	log(await TokBal(USDC))
	log(await web3.eth.balanceOf(FROM))
	await ExactInETH(WETH,USDC,"3000","11000000000000000000","1");
	await depositWeth("10000000000000000000"); //deposit ETH
	await Approve(WETH,V3NFT);
	await Approve(USDC,V3NFT);
	var amount1 = "10000000000000000000";
	var slip = "1"; //"0.5"; //0.5%
	const ERC20weth  = new web3.eth.Contract(ERC20,WETH);
	const ERC20usdc  = new web3.eth.Contract(ERC20,USDC);
	const tokenDecimals = [
		await ERC20usdc.methods.decimals().call().catch(function (err){log(err)}), // decimals of DAI
		await ERC20weth.methods.decimals().call().catch(function (err){log(err)}), // decimals of WETH
	];
	const V3poolC = new web3.eth.Contract(V3poolabi, V3pool);
	const V3NFTC = new web3.eth.Contract(V3NFTm, V3NFT);
	var S0 = await V3poolC.methods.slot0().call().catch(function (err){log(err)});
	var CT = parseInt(S0.tick);
	var Cpos = await V3NFTC.methods.positions().call().catch(function (err){log(err)});
	var Tsp = parseInt(V3poolC.methods.tickSpacing().call().catch(function (err){log(err)}));
	var NHT = (math.flat(CT/Tsp))*Tsp;
	log(NHT);
	var NLT = ((math.flat(CT/Tsp))*Tsp)+Tsp;
	log(NLT);
	var TickL = NLT.toString();  //Nearest usable lower tick   //"-887220";  //// Min Tick full range below current tick
	var TickU = NHT.toString();  //Nearest usable upper tick    //"887220";  //// Max Tick full range above current tick
	var amount0 = getAmountToken0(amount1,tokenDecimals,CT,NLT,NHT)
	log(amnt0);
	var mintV = await mintTokens(USDC,WETH,"3000",TickL,TickU,amount0,amount1,slip);
	log(await TokBal(USDC))
	log(await web3.eth.balanceOf(FROM))
}

RM()

//collector("212761");
const tokenDecimals = [
		6,
		18
	];

const tokenDecimals2 = [
		18,
		18
	];


async function ST(){
	
	var amount1 = "1000000000000000000";
	var cTick = 195256;
	var lTick = 195360;
	var hTick = 195120;
	log(await getAmountToken0(amount1, tokenDecimals,cTick,lTick,hTick));
}

//ST()
//log(univ3prices.sqrtPrice([6, 18],'1387833545453950849137742628669811').toFixed())


async function GetLQ(){
	const V3poolC = new web3.eth.Contract(V3pool, "0x4D05f2A005e6F36633778416764E82d1D12E7fbb");
	const V3NFTC = new web3.eth.Contract(V3NFTm, V3NFT);
	var S0 = await V3poolC.methods.slot0().call("27529898").catch(function (err){log(err)});
	var Secs = await V3poolC.methods.snapshotCumulativesInside(web3.utils.toBN("-7020"),web3.utils.toBN("-4260")).call().catch(function (err){log(err)});
	log(Secs)
	log(parseInt(Secs.secondsInside)/1000)
	//var CT = parseInt(S0.tick);
	var Cpos = await V3NFTC.methods.positions("100132").call("27529898").catch(function (err){log(err)});
	log(Cpos)
	var Tsp = parseInt(await V3poolC.methods.tickSpacing().call("27529898").catch(function (err){log(err)}));
	var LQtokens = await univ3prices.getAmountsForCurrentLiquidity(tokenDecimals2,web3.utils.toBN(Cpos.liquidity),S0.sqrtPriceX96,Tsp)
	log(LQtokens);
}

//GetLQ()

async function start(){
	await GetLQbalance("290187","25694006795626731").catch(function (err){log(err)});;
}

//start()