# Uniswap-Examples-V3
Uniswap V3 examples of, sqrtPriceX96 to price, Get Liquidity amounts, Get Fees accrued 


**To use these files you will need nodeJS and:**
**1.** to change the (< PATH >) to the local drive path
**2.** to change the (<RPC_Key>) by adding your RPC_Key from a service like Alchemy, Infura or Quicknode
**3.** npm install @uniswap/sdk
**4.** npm install ethers
**5.** npm install -D ts-node
**6.** npm install -g typescript




**V3PriceBaseJSBIwPoolcallsMinimal**

For getting a price from the sqrtPriceX96
This package includes all the call needed to get information needed

you would only need to replace the two token addresses, the pool fee in the st() starter funciton

Pool fees in code version are
1% == 10000, 0.3% == 3000, 0.05% == 500, 0.01 == 100



**V3getLQtokenAmountsMinimal**

For getting Liquidity amounts Code based on position
For getting a price from the sqrtPriceX96
This package includes all the call needed to get information needed

for this outside of steps 1-6, you will only need to change the position ID at the bottom
this is currently setup to show position 5 so change *start(5)* with your position ID



**V3getPositionFees**

For getting the fees accrued in your position
For getting a price from the sqrtPriceX96
This package includes all the call needed to get information needed

for this outside of steps 1-6, you will only need to change the position ID at the bottom
this is currently setup to show position 5 so change *start(5)* with your position ID
