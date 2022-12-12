import { BigNumber } from 'ethers';
import bn from 'bignumber.js'



bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 })
function encodePriceSqrt(reserve0, reserve1){
  return BigNumber.from(
    new bn(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new bn(2).pow(96))
      .integerValue(3)
      .toString()
  )
}




console.log(encodePriceSqrt(15392964530, 10000000000000000000).toString());
