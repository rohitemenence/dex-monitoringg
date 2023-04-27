const TokenMarketStats = require('../models/TokenMarketStats');
const ethers = require("ethers");
const TokenSpecs = require("../models/Token");
const erc20Abi = require("../abis/erc20.json");

async function DexMonitor(pairAddress, pairContractAbi, provider,) {

    try {
        let tokenMarketData = new Object();
        // pair contract instances
        const pairContract = new ethers.Contract(pairAddress, pairContractAbi, provider);

        // USDC token address
        const usdcTokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
        // usdc contract instance
        const usdcContract = new ethers.Contract(usdcTokenAddress, erc20Abi, provider);

        // Token Addresses
        const token0 = await pairContract.token0();
        const token1 = await pairContract.token1();

        const usdcSymbol = 'USDC';
        const usdcDecimal = 6;
        let tokenDecimals;
        let tokenSymbol;
        let totalSupply;

        if (token0.toLowerCase().includes("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48") || token1.toLowerCase().includes("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48")) {

            if (token0.toLowerCase() !== '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48') {
                const tokenContract = new ethers.Contract(token0.toLowerCase(), erc20Abi, provider);
                totalSupply = await tokenContract.totalSupply();
                tokenDecimals = await TokenSpecs.findOne({ address: token0.toLowerCase() }, { decimals: 1 });
                tokenSymbol = await TokenSpecs.findOne({ address: token0.toLowerCase() }, { symbol: 1 });
                tokenMarketData.token = token0;
                tokenMarketData.totalSupply = parseInt(totalSupply);
            } else {
                const tokenContract = new ethers.Contract(token1.toLowerCase(), erc20Abi, provider);
                totalSupply = await tokenContract.totalSupply();
                tokenDecimals = await TokenSpecs.findOne({ address: token1.toLowerCase() }, { decimals: 1 });
                tokenSymbol = await TokenSpecs.findOne({ address: token1.toLowerCase() }, { symbol: 1 });
                tokenMarketData.token = token1;
                tokenMarketData.totalSupply = parseInt(totalSupply);
            }

            const currentBlock = await provider.getBlockNumber();
            const syncEvents = await pairContract.queryFilter(pairContract.filters.Sync(), currentBlock - 10, 'latest');

            // usdc transfer from pair 
            const usdcTransferFromPair = await usdcContract.queryFilter(usdcContract.filters.Transfer(pairAddress, null), currentBlock - 100, 'latest');
            // usdc transfer to pair
            const usdcTransferToPair = await usdcContract.queryFilter(usdcContract.filters.Transfer(null, pairAddress), currentBlock - 100, 'latest');

            async function processEvents(syncEvent) {
                const obj = new Object();

                // Block Data
                const syncBlockData = await syncEvent.getBlock(syncEvent.blockNumber);

                // Timestamp for sync 
                const syncDate = new Date(syncBlockData.timestamp * 1000);
                const syncHours = syncDate.getHours();
                const syncMinutes = syncDate.getSeconds();
                const syncSeconds = syncDate.getSeconds();
                const syncTimestamp = `${syncDate} ${syncHours}:${syncMinutes}:${syncSeconds}`

                // Reserves
                if (token0.toLowerCase() !== '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48') {
                    const reserveToken0 = parseInt(syncEvent.args[0] / (10 ** tokenDecimals.decimals));
                    const reserveToken1 = parseInt(syncEvent.args[1] / (10 ** usdcDecimal));

                    console.log(`reserveToken0- ${reserveToken0} || reserveToken1- ${reserveToken1}`);
                    obj[tokenSymbol.symbol] = `${reserveToken1 / reserveToken0} ${usdcSymbol}`;
                    obj[usdcSymbol] = `${reserveToken0 / reserveToken1} ${tokenSymbol.symbol}`;
                } else {
                    const reserveToken0 = parseInt(syncEvent.args[0] / (10 ** usdcDecimal));
                    const reserveToken1 = parseInt(syncEvent.args[1] / (10 ** tokenDecimals.decimals));

                    console.log(`reserveToken0- ${reserveToken0} || reserveToken1- ${reserveToken1}`);
                    obj[tokenSymbol.symbol] = `${reserveToken0 / reserveToken1} ${usdcSymbol}`;
                    obj[usdcSymbol] = `${reserveToken1 / reserveToken0} ${tokenSymbol.symbol}`;
                }

                obj.blockNumber = syncEvent.blockNumber;
                obj.time = syncTimestamp;
                obj.pairAddress = pairAddress;

                console.log(obj, "objecttttt")
                return obj;
            }
            
            let prices = [];
            for (let i = 0; i < syncEvents.length; i++) {
                prices.push(await processEvents(syncEvents[i]));
            }
            
            tokenMarketData.prices = prices;

            /***** Calculate Volume *****/ 
            let volumes = [];
            for (let i = 0; i < usdcTransferFromPair.length; i++) {
                const obj = new Object();
                const blockDetails = await provider.getBlock(usdcTransferFromPair[i].blockNumber);
                // Timestamp
                const date = new Date(blockDetails.timestamp * 1000);
                const Hours = date.getHours();
                const Minutes = date.getMinutes();
                const Seconds = date.getSeconds();
                const Timestamp = `${date} ${Hours}:${Minutes}:${Seconds}`
                const usdcSwaped = parseInt(usdcTransferFromPair[i].args[2]) / 10 ** 6;
                obj.timestamp = Timestamp;
                obj.volume = usdcSwaped;
                volumes.push(obj);
            }

            for (let i = 0; i < usdcTransferToPair.length; i++) {
                const obj = new Object();
                const blockDetails = await provider.getBlock(usdcTransferToPair[i].blockNumber);
                // Timestamp
                const date = new Date(blockDetails.timestamp * 1000);
                const Hours = date.getHours();
                const Minutes = date.getMinutes();
                const Seconds = date.getSeconds();
                const Timestamp = `${date} ${Hours}:${Minutes}:${Seconds}`
                const usdcSwaped = parseInt(usdcTransferToPair[i].args[2]) / 10 ** 6;
                obj.timestamp = Timestamp;
                obj.volume = usdcSwaped;
                volumes.push(obj);
            }
            tokenMarketData.volumes = volumes;
            console.log('tokenMarketData', tokenMarketData)
            return tokenMarketData;
        }
    } catch (error) {
        console.log('error', error);
    }

}

// token
// totalSupply
// circulatingSupply
// price
// volume
// timestamp

module.exports = {
    DexMonitor
}