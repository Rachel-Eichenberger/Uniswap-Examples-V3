import { JSBI } from "@uniswap/sdk";


const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));
const sqrtPriceX96 = JSBI.BigInt(2282590880306961749720524494606827)
let tick = Math.floor(Math.log((sqrtPriceX96/Q96)**2)/Math.log(1.0001));

console.log(tick)