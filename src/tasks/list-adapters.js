const { task } = require("hardhat/config");

task("list-adapters", "Lists all adapters for the current YakRouter", async (_, hre) => {
  const YakRouter = await hre.ethers.getContract("YakRouter")
  const adapterLen = await YakRouter.adaptersCount()
  const adapterIndices = Array.from(Array(adapterLen.toNumber()).keys())
  const liveAdapters = await Promise.all(adapterIndices.map(async (i) => {
      const adapter = await YakRouter.ADAPTERS(i)
      const name = await hre.ethers.getContractAt("YakAdapter", adapter)
        .then(a => a.name())
      return { adapter, name }
  }))
  console.table(liveAdapters)
})