const { expect } = require("chai");
const { utils } = require("ethers");

const { fixtures, addresses } = require("../../fixtures");
const { assets } = addresses.avalanche;

const newTrustedTokens = [
  "0xbA7dEebBFC5fA1100Fb055a87773e1E99Cd3507a",
  "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
  "0x60781C2586D68229fde47564546784ab3fACA982",
  "0xde3A24028580884448a5397872046a019649b084",
  "0xf20d962a6c8f70c731bd838a3a388D7d48fA6e15",
  "0x1C20E891Bab6b1727d14Da358FAe2984Ed9B59EB",
];

const KECCAK256_MAINTAINER_ROLE = utils.keccak256(utils.toUtf8Bytes("MAINTAINER_ROLE"));
const KECCAK256_DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

describe("Yak Router - maintainable", () => {
  let fix;
  before(async () => {
    fix = await fixtures.general();
    const fixRouter = await fixtures.router();
    YakRouterFactory = fixRouter.YakRouterFactory;
    YakRouter = fixRouter.YakRouter;
    owner = fix.deployer;
  });

  beforeEach(async () => {
    // Start each test with a fresh account
    trader = fix.genNewAccount();
  });

  describe("onlyMaintainer", async () => {
    it("Allows the owner to set trusted tokens", async () => {
      const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
      await _YakRouter.connect(owner).setTrustedTokens(newTrustedTokens);
      let newTokenCount = await _YakRouter.trustedTokensCount().then((r) => r.toNumber());
      expect(newTokenCount).to.equal(newTrustedTokens.length);
    });

    it("Does not allow a non-maintainer to set trusted tokens", async () => {
      const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
      await expect(_YakRouter.connect(trader).setTrustedTokens(newTrustedTokens)).to.be.revertedWith(
        "Maintainable: Caller is not a maintainer"
      );
    });

    it("Allows the owner to grant access to a new maintainer who can set trusted tokens", async () => {
      const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
      await _YakRouter.connect(owner).addMaintainer(trader.address);
      await _YakRouter.connect(trader).setTrustedTokens(newTrustedTokens);
      let newTokenCount = await _YakRouter.trustedTokensCount().then((r) => r.toNumber());
      expect(newTokenCount).to.equal(newTrustedTokens.length);
    });

    it("Does not allow a maintainer to set trusted tokens after the owner has revoked their role", async () => {
      const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
      await _YakRouter.connect(owner).addMaintainer(trader.address);
      await _YakRouter.connect(owner).removeMaintainer(trader.address);
      await expect(_YakRouter.connect(trader).setTrustedTokens(newTrustedTokens)).to.be.revertedWith(
        "Maintainable: Caller is not a maintainer"
      );
    });
  });

  describe("AccessControl", () => {
    describe("Adding a maintainer", () => {
      it("Allows the owner to add a new maintainer", async () => {
        const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
        await expect(_YakRouter.connect(owner).addMaintainer(trader.address)).to.not.reverted;
      });

      it("Does not allow a maintainer to add a new maintainer", async () => {
        const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
        await _YakRouter.connect(owner).addMaintainer(trader.address);
        const newAccount = fix.genNewAccount();
        await expect(_YakRouter.connect(trader).addMaintainer(newAccount.address)).to.be.revertedWith("AccessControl");
      });

      it("Does not allow a random user to add a new maintainer", async () => {
        const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
        const newAccount = fix.genNewAccount();
        await expect(_YakRouter.connect(trader).addMaintainer(newAccount.address)).to.be.revertedWith("AccessControl");
      });
    });

    describe("Removing a maintainer", () => {
      it("Allows the owner to remove a maintainer", async () => {
        const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
        await _YakRouter.connect(owner).addMaintainer(trader.address);
        await expect(_YakRouter.connect(owner).removeMaintainer(trader.address)).to.not.reverted;
      });

      it("Does not allow a maintainer to remove a maintainer", async () => {
        const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
        await _YakRouter.connect(owner).addMaintainer(trader.address);
        const newAccount = fix.genNewAccount();
        await _YakRouter.connect(owner).addMaintainer(trader.address);
        await expect(_YakRouter.connect(trader).removeMaintainer(newAccount.address)).to.be.revertedWith(
          "AccessControl"
        );
      });

      it("Does not allow a random user to remove a maintainer", async () => {
        const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
        await _YakRouter.connect(owner).addMaintainer(trader.address);
        const newAccount = fix.genNewAccount();
        await expect(_YakRouter.connect(newAccount).removeMaintainer(trader.address)).to.be.revertedWith(
          "AccessControl"
        );
      });
    });
  });

  describe("Transfering ownership", () => {
    it("Allows the owner to transfer ownership", async () => {
      const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
      await expect(_YakRouter.connect(owner).transferOwnership(trader.address)).to.not.reverted;
    });

    it("Does not allow the owner to add a maintainer after transfering ownership", async () => {
      const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
      await _YakRouter.connect(owner).transferOwnership(trader.address);
      const newAccount = fix.genNewAccount();
      await expect(_YakRouter.connect(owner).addMaintainer(newAccount.address)).to.be.revertedWith("AccessControl");
    });

    it("Does not allow a maintainer to transfer ownership", async () => {
      const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
      _YakRouter.connect(owner).addMaintainer(trader.address);
      await expect(_YakRouter.connect(trader).transferOwnership(trader.address)).to.be.revertedWith("AccessControl");
    });

    it("Does not allow a random user to transfer ownership", async () => {
      const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
      await expect(_YakRouter.connect(trader).transferOwnership(trader.address)).to.be.revertedWith("AccessControl");
    });
  });

  describe("Events", () => {
    it("Emits the expected event when the owner adds a maintainer", async () => {
      const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
      await expect(_YakRouter.connect(owner).addMaintainer(trader.address))
        .to.emit(_YakRouter, "RoleGranted")
        .withArgs(KECCAK256_MAINTAINER_ROLE, trader.address, owner.address);
    });

    it("Emits the expected event when the owner removes a maintainer", async () => {
      const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
      await _YakRouter.connect(owner).addMaintainer(trader.address);
      await expect(_YakRouter.connect(owner).removeMaintainer(trader.address))
        .to.emit(_YakRouter, "RoleRevoked")
        .withArgs(KECCAK256_MAINTAINER_ROLE, trader.address, owner.address);
    });

    it("Emits the role granted event when the owner transfers ownership", async () => {
      const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
      await expect(_YakRouter.connect(owner).transferOwnership(trader.address))
        .to.emit(_YakRouter, "RoleGranted")
        .withArgs(KECCAK256_DEFAULT_ADMIN_ROLE, trader.address, owner.address);
    });

    it("Emits the role revoked event when the owner transfers ownership", async () => {
      const _YakRouter = await YakRouterFactory.connect(owner).deploy([], [], owner.address, assets.WAVAX);
      await expect(_YakRouter.connect(owner).transferOwnership(trader.address))
        .to.emit(_YakRouter, "RoleRevoked")
        .withArgs(KECCAK256_DEFAULT_ADMIN_ROLE, owner.address, owner.address);
    });
  });
});
