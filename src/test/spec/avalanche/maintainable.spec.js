const { expect } = require("chai");
const { utils } = require("ethers");
const { makeAccountGen } = require("../../helpers");

const KECCAK256_MAINTAINER_ROLE = utils.keccak256(utils.toUtf8Bytes("MAINTAINER_ROLE"));
const KECCAK256_DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

async function getDummyMaintainable() {
  const [deployer] = await ethers.getSigners();
  const DummyMaintainable = await ethers
    .getContractFactory("DummyMaintainable")
    .then((f) => f.connect(deployer).deploy());
  return {
    DummyMaintainable,
    deployer,
  };
};

describe("Maintainable", () => {

  let genNewAccount;
  let owner;
  let nonOwner;
  let DummyMaintainable;

  before(async () => {
    genNewAccount = await makeAccountGen();
    owner = genNewAccount();
  });

  beforeEach(async () => {
    // Start each test with a fresh account
    nonOwner = genNewAccount();
    const dummyMaintainable = await getDummyMaintainable();
    DummyMaintainable = dummyMaintainable.DummyMaintainable;
  });

  describe("onlyMaintainer", async () => {
    it("Allows the owner to call an onlyMaintainer function", async () => {
      await expect(DummyMaintainable.connect(owner).onlyMaintainerFunction()).to.not.reverted;
    });

    it("Does not allow a non-maintainer to call an onlyMaintainer function", async () => {
      await expect(DummyMaintainable.connect(nonOwner).onlyMaintainerFunction()).to.be.revertedWith(
        "Maintainable: Caller is not a maintainer"
      );
    });

    it("Allows the owner to grant access to a new maintainer who can call an onlyMaintainer function", async () => {
      await DummyMaintainable.connect(owner).addMaintainer(nonOwner.address);
      await expect(DummyMaintainable.connect(nonOwner).onlyMaintainerFunction()).to.not.reverted;
    });

    it("Does not allow a maintainer to call an onlyMaintainer function after the owner has revoked their role", async () => {
      await DummyMaintainable.connect(owner).addMaintainer(nonOwner.address);
      await DummyMaintainable.connect(owner).removeMaintainer(nonOwner.address);
      await expect(DummyMaintainable.connect(nonOwner).onlyMaintainerFunction()).to.be.revertedWith(
        "Maintainable: Caller is not a maintainer"
      );
    });
  });

  describe("AccessControl", () => {
    describe("Adding a maintainer", () => {
      it("Allows the owner to add a new maintainer", async () => {
        await expect(DummyMaintainable.connect(owner).addMaintainer(nonOwner.address)).to.not.reverted;
      });

      it("Does not allow a maintainer to add a new maintainer", async () => {
        await DummyMaintainable.connect(owner).addMaintainer(nonOwner.address);
        const newAccount = genNewAccount();
        await expect(DummyMaintainable.connect(nonOwner).addMaintainer(newAccount.address)).to.be.revertedWith(
          "AccessControl"
        );
      });

      it("Does not allow a random user to add a new maintainer", async () => {
        const newAccount = genNewAccount();
        await expect(DummyMaintainable.connect(nonOwner).addMaintainer(newAccount.address)).to.be.revertedWith(
          "AccessControl"
        );
      });
    });

    describe("Removing a maintainer", () => {
      it("Allows the owner to remove a maintainer", async () => {
        await DummyMaintainable.connect(owner).addMaintainer(nonOwner.address);
        await expect(DummyMaintainable.connect(owner).removeMaintainer(nonOwner.address)).to.not.reverted;
      });

      it("Does not allow a maintainer to remove a maintainer", async () => {
        await DummyMaintainable.connect(owner).addMaintainer(nonOwner.address);
        const newAccount = genNewAccount();
        await DummyMaintainable.connect(owner).addMaintainer(nonOwner.address);
        await expect(DummyMaintainable.connect(nonOwner).removeMaintainer(newAccount.address)).to.be.revertedWith(
          "AccessControl"
        );
      });

      it("Does not allow a random user to remove a maintainer", async () => {
        await DummyMaintainable.connect(owner).addMaintainer(nonOwner.address);
        const newAccount = genNewAccount();
        await expect(DummyMaintainable.connect(newAccount).removeMaintainer(nonOwner.address)).to.be.revertedWith(
          "AccessControl"
        );
      });
    });
  });

  describe("Transfering ownership", () => {
    it("Allows the owner to transfer ownership", async () => {
      await expect(DummyMaintainable.connect(owner).transferOwnership(nonOwner.address)).to.not.reverted;
    });

    it("Does not allow the owner to add a maintainer after transfering ownership", async () => {
      await DummyMaintainable.connect(owner).transferOwnership(nonOwner.address);
      const newAccount = genNewAccount();
      await expect(DummyMaintainable.connect(owner).addMaintainer(newAccount.address)).to.be.revertedWith(
        "AccessControl"
      );
    });

    it("Does not allow a maintainer to transfer ownership", async () => {
      DummyMaintainable.connect(owner).addMaintainer(nonOwner.address);
      await expect(DummyMaintainable.connect(nonOwner).transferOwnership(nonOwner.address)).to.be.revertedWith(
        "AccessControl"
      );
    });

    it("Does not allow a random user to transfer ownership", async () => {
      await expect(DummyMaintainable.connect(nonOwner).transferOwnership(nonOwner.address)).to.be.revertedWith(
        "AccessControl"
      );
    });
  });

  describe("Events", () => {
    it("Emits the expected event when the owner adds a maintainer", async () => {
      await expect(DummyMaintainable.connect(owner).addMaintainer(nonOwner.address))
        .to.emit(DummyMaintainable, "RoleGranted")
        .withArgs(KECCAK256_MAINTAINER_ROLE, nonOwner.address, owner.address);
    });

    it("Emits the expected event when the owner removes a maintainer", async () => {
      await DummyMaintainable.connect(owner).addMaintainer(nonOwner.address);
      await expect(DummyMaintainable.connect(owner).removeMaintainer(nonOwner.address))
        .to.emit(DummyMaintainable, "RoleRevoked")
        .withArgs(KECCAK256_MAINTAINER_ROLE, nonOwner.address, owner.address);
    });

    it("Emits the role granted event when the owner transfers ownership", async () => {
      await expect(DummyMaintainable.connect(owner).transferOwnership(nonOwner.address))
        .to.emit(DummyMaintainable, "RoleGranted")
        .withArgs(KECCAK256_DEFAULT_ADMIN_ROLE, nonOwner.address, owner.address);
    });

    it("Emits the role revoked event when the owner transfers ownership", async () => {
      await expect(DummyMaintainable.connect(owner).transferOwnership(nonOwner.address))
        .to.emit(DummyMaintainable, "RoleRevoked")
        .withArgs(KECCAK256_DEFAULT_ADMIN_ROLE, owner.address, owner.address);
    });
  });
});
