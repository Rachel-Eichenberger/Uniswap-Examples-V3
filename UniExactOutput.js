const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));  // local provider for mainnet fork
const fs = require('fs');

const private_key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; //PK or setup ETH accounts next 3 lines
const address = web3.eth.accounts.privateKeyToAccount(private_key);
web3.eth.defaultAccount = address['address'];
var FROM = address['address'];


// Load json abi 
let V3quoterAbi = fs.readFileSync('/V3quoter.json');
let UniV3RouterAbi = fs.readFileSync('/NewUniRouter.json');
let ERC20Abi = fs.readFileSync('/ERC20.json');
let WETHAbij = fs.readFileSync('/WETHAbi.json');

const V3quote = JSON.parse(V3quoterAbi);
const V3Router = JSON.parse(UniV3RouterAbi);
const ERC20 = JSON.parse(ERC20Abi);
const WETHAbi = JSON.parse(WETHAbij);

// addresses
const V3Swapper = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
const V3quoter = '0x61fFE014bA17989E743c5F6cB21bF9697530B21e';
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';



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
	console.log(Wbal);
	
}

// Approve Token 0 before swapping
async function Approve(token){
	//Approval  only needs to be done once per token***//
	var amt0 = web3.utils.toBN('115792089237316195423570985008687907853269984665640564039457584007913129639935'); //Max approval
	const ERC20contract = new web3.eth.Contract(ERC20, token);
	var myData = ERC20contract.methods.approve(V3Swapper,amt0).encodeABI();
	var gas = await ERC20contract.methods.approve(V3Swapper,amt0).estimateGas({from:FROM,data:myData,to:token}).catch(function(error){console.log(error);});

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



/* struct ExactOutputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountOut;
        uint256 amountInMaximum;
        uint160 sqrtPriceLimitX96;
    }

struct QuoteExactOutputSingleParams {
        address tokenIn;
        address tokenOut;
        uint256 amount;
        uint24 fee;
        uint160 sqrtPriceLimitX96;
    } */




// make swap via V3 router, gets quote from quoter...  To use ETH TokenSelling would be WETH still, but add value to tx like WETH Deposit
async function ExactOut(TokenSelling,TokenBuying,Fee,AmountReceiving,SlipP){
	// get deadline
	var DeadlineMill = web3.utils.toBN(Date.now()).add(web3.utils.toBN('3600000'));
	var Deadline = web3.utils.toBN(DeadlineMill).div(web3.utils.toBN('1000'));
	
	// get quote output for slippage
	var QuoterEnc = {'tokenIn':TokenSelling,'tokenOut':TokenBuying,'fee':Fee.toString(),'amount':AmountReceiving.toString(),'sqrtPriceLimitX96':'0'};
	
	const quoter = new web3.eth.Contract(V3quote,V3quoter);
	var quoted = await quoter.methods.quoteExactOutputSingle(QuoterEnc).call();
	console.log(quoted[0]);
	//log amount out
	
	// get slippage
	var BNquote = web3.utils.toBN(quoted[0]);
	var Slippage = BNquote.add((BNquote.mul(web3.utils.toBN("1000")).div(web3.utils.toBN(SlipP))).div(web3.utils.toBN("1000")));
	console.log(Slippage.toString())
	// log slippage
	
	//encode swap
	var encoded = {'tokenIn':TokenSelling,'tokenOut':TokenBuying,'fee':Fee.toString(),'recipient':FROM,'deadline':Deadline.toString(),'amountOut':AmountReceiving.toString(),'amountInMaximum':Slippage.toString(),'sqrtPriceLimitX96':'0'};

	const MySwap = new web3.eth.Contract(V3Router,V3Swapper); // V3 router contract not new one
	var myData2 = MySwap.methods.exactOutputSingle(encoded).encodeABI();
	
	

	var gas = await MySwap.methods.exactOutputSingle(encoded).estimateGas({from:FROM,data:myData2,to:V3Swapper}).catch(function(error){concole.log(error);});

	var nonce3 = await web3.eth.getTransactionCount(FROM);
	
	var txObject = {
		nonce:    nonce3,
		to:       V3Swapper,
		from:     FROM,
		value:    web3.utils.toHex(0),
		gas:      web3.utils.toHex(gas+20000), //I always add 20k gas for miscalculations
		data: myData2
	}
		
	const tHash = await web3.eth.sendTransaction(txObject)
	.on('error', console.error);
	
	var Tbal = await TokBal(TokenBuying);
	console.log(Tbal); // Log Token bought Balance
}


async function ExactOutETH(TokenSelling,TokenBuying,Fee,AmountReceiving,SlipP){
	// get deadline
	//var DeadlineMill = web3.utils.toBN(Date.now()).add(web3.utils.toBN('3600000'));
	var Deadline = Date.now() +1800;  //web3.utils.toBN(DeadlineMill).div(web3.utils.toBN('1000'));
	
	// get quote output for slippage
	var QuoterEnc = {'tokenIn':TokenSelling,'tokenOut':TokenBuying,'fee':Fee.toString(),'amount':AmountReceiving.toString(),'sqrtPriceLimitX96':'0'};
	
	const quoter = new web3.eth.Contract(V3quote,V3quoter);
	var quoted = await quoter.methods.quoteExactOutputSingle(QuoterEnc).call();
	console.log(quoted[0]);
	//log amount out
	
	// get slippage
	var BNquote = web3.utils.toBN(quoted[0]);
	var Slippage = BNquote.add((BNquote.mul(web3.utils.toBN("1000")).div(web3.utils.toBN(SlipP))).div(web3.utils.toBN("1000")));
	console.log(Slippage.toString())
	// log slippage
	
	//encode swap
	var encoded = {'tokenIn':TokenSelling,'tokenOut':TokenBuying,'fee':Fee.toString(),'recipient':FROM,'deadline':Deadline.toString(),'amountOut':AmountReceiving.toString(),'amountInMaximum':Slippage.toString(),'sqrtPriceLimitX96':'0'};

	const MySwap = new web3.eth.Contract(V3Router,V3Swapper); // V3 router contract not new one
	
	var calls = [];
	var multi1 = MySwap.methods.exactOutputSingle(encoded).encodeABI();
	var multi2 = MySwap.methods.refundETH().encodeABI();
	
	calls.push(multi1);
    calls.push(multi2);
	
	var multi0 = MySwap.methods.multicall(calls).encodeABI();
	//console.log(multi0)
	
	var gas = await MySwap.methods.multicall(calls).estimateGas({from:FROM,value:Slippage.toString(),data:multi0,to:V3Swapper}).catch(function(error){concole.log(error);});

	var nonce3 = await web3.eth.getTransactionCount(FROM);
	
	var txObject = {
		nonce:    nonce3,
		to:       V3Swapper,
		from:     FROM,
		value:    Slippage.toString(),
		gas:      web3.utils.toHex(gas+20000), //I always add 20k gas for miscalculations
		data: 	  multi0
	}
		
	const tHash = await web3.eth.sendTransaction(txObject)
	.on('error', console.error);
	
	var Tbal = await TokBal(TokenBuying);
	console.log(Tbal); // Log Token bought Balance
}




async function RUN(){
	//await depositWeth("1000000000000000000"); //deposit ETH
	//await Approve(WETH);  // approve token
	//await ExactOut(WETH,USDC,3000,"1000000000","50"); // weth -> usdc swap 0.3% pool 1 ETH 0.5% slippage
	await ExactOutETH(WETH,USDC,3000,"1000000000","50");
}

RUN()