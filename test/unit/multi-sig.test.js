const { assert, expect } = require("chai")
const { ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat.config.js")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Multi sig unit tests", function () {
          let sigFactory, multiSig, deployer, owner2, owner3, _owners, user, testHelper
          beforeEach(async function () {

              ;[deployer, owner2, owner3, user] = await ethers.getSigners()
              const helperFactory = await ethers.getContractFactory(
                  "TestHelper",
                  deployer
              )
              testHelper = await helperFactory.deploy()
              _owners = [deployer.address, owner2.address, owner3.address, testHelper.address]
              //console.log(`_owners array: ${_owners}`)
              sigFactory = await ethers.getContractFactory("MultiSig", deployer)

              //console.log(`deployer address: ${deployer.address}`)
              //console.log(`multiSig address: ${multiSig.address}`)
              
          })
          describe("constructor", function () {
              it("reverts if null address is passed as input", async function () {
                  const zeroAddress =
                      "0x0000000000000000000000000000000000000000"
                  await expect(
                      sigFactory.deploy([deployer.address, zeroAddress], 2)
                  ).to.be.revertedWith("MultiSig__InvalidAddress")
              })
              it("reverts if an address is inputted more than once", async function () {
                  await expect(
                      sigFactory.deploy([deployer.address, deployer.address], 2)
                  ).to.be.revertedWith("MultiSig__DuplicateAddress")
              })
              it("pushes owner addresses into array correctly", async function () {
                  multiSig = await sigFactory.deploy(_owners, 2)
                  const expectedValue = await multiSig.owners(1)
                  assert.equal(expectedValue, owner2.address)
              })
              it("should set isOwner mapping to true for owners", async function () {
                  multiSig = await sigFactory.deploy(_owners, 2)
                  assert.equal(await multiSig.isOwner(owner2.address), true)
              })
              //   it("emits OwnerAdded correctly", async function() {
              //       const tx = await sigFactory.deploy(_owners, 2)
              //       const txReceipt = await tx.wait(1)
              //       const owner1 = txReceipt.events[0].args.owner
              //       console.log(`Event args: ${owner1}`)
              //   })
              it("sets confirmations required correctly", async function () {
                  multiSig = await sigFactory.deploy(_owners, 2)
                  assert.equal(
                      (await multiSig.s_confirmationsRequired()).toString(),
                      "2"
                  )
              })
          })
          describe("receive", function () {
              beforeEach(async function () {
                  multiSig = await sigFactory.deploy(_owners, 2)
              })
              it("reverts if sent with no value", async function () {
                  await expect(
                      deployer.sendTransaction({
                          to: multiSig.address,
                          value: 0,
                      })
                  ).to.be.revertedWith("MultiSig__InsufficientAmount()")
              })
              it("pushes Deposit struct into the array", async function () {
                  await deployer.sendTransaction({
                      to: multiSig.address,
                      value: 777,
                  })
                  const deposit = await multiSig.depositArray(0)
                  // Deposit struct: depositor, depositId, amount
                  assert.equal(
                      deposit.toString(),
                      [deployer.address, 0, 777].toString()
                  )
                  //console.log(`deployer address: ${deployer.address}`)
              })
              it("keeps track of owner balances correctly", async function () {
                  const initialBal = await multiSig.balances(deployer.address)
                  await deployer.sendTransaction({
                      to: multiSig.address,
                      value: 777,
                  })
                  const finalBal = await multiSig.balances(deployer.address)
                  // console.log(`initialBalance: ${initialBal}`)
                  // console.log(`finalBalance: ${finalBal}`)
                  assert.equal(initialBal.add(777).toString(), finalBal)
              })
              it("increments the s_sharedFunds balance correctly", async function () {
                  const initialBal = await multiSig.s_sharedFunds()
                  await user.sendTransaction({
                      to: multiSig.address,
                      value: 777,
                  })
                  const finalBal = await multiSig.s_sharedFunds()
                  // console.log(`initialBalance: ${initialBal}`)
                  // console.log(`finalBalance: ${finalBal}`)
                  assert.equal(
                      initialBal.add(777).toString(),
                      finalBal.toString()
                  )
              })
              it("increments s_depositCounter", async function () {
                  const initialCount = await multiSig.s_depositCounter()
                  await user.sendTransaction({
                      to: multiSig.address,
                      value: 777,
                  })
                  const finalCount = await multiSig.s_depositCounter()
                  assert.equal(
                      initialCount.add(1).toString(),
                      finalCount.toString()
                  )
              })
          })
          describe("submitDeposit", function () {
              beforeEach(async function () {
                  multiSig = await sigFactory.deploy(_owners, 2)
              })
              it("reverts if called with 0 value", async function () {
                  await expect(multiSig.submitDeposit()).to.be.revertedWith(
                      "MultiSig__InsufficientAmount"
                  )
              })
              it("pushes Deposit struct into deposit array", async function () {
                  await multiSig.submitDeposit({ value: "7" })
                  const deposit = await multiSig.depositArray(0)
                  //console.log(`deposit: ${deposit}`)
                  assert.equal(deposit.toString(), [deployer.address, "0", "7"])
              })
              it("pushes Deposit into addressToDepositArray correctly", async function () {
                  await multiSig.submitDeposit({ value: "7" })
                  const deposit = await multiSig.addressToDepositArray(
                      deployer.address,
                      0
                  )
                  assert.equal(deposit.toString(), [deployer.address, "0", "7"])
              })
              it("pushes Deposit into nonOwnerDepositArray correctly", async function () {
                  await multiSig.connect(user).submitDeposit({ value: "420" })
                  const deposit = await multiSig.nonOwnerDepositArray(0)
                  assert.equal(deposit.toString(), [user.address, "0", "420"])
              })
              it("updates owner balance if owner is depositor", async function () {
                  const initialBal = await multiSig.balances(deployer.address)
                  await multiSig.submitDeposit({ value: 77 })
                  const finalBal = await multiSig.balances(deployer.address)
                  assert.equal(
                      initialBal.add(77).toString(),
                      finalBal.toString()
                  )
              })
              it("increments s_sharedFunds if msg.sender != owner", async function () {
                  const initialBal = await multiSig.s_sharedFunds()
                  await multiSig.connect(user).submitDeposit({ value: 420 })
                  const finalBal = await multiSig.s_sharedFunds()
                  assert.equal(
                      initialBal.add(420).toString(),
                      finalBal.toString()
                  )
              })
              it("emits DepositSubmitted event correctly", async function () {
                  await expect(multiSig.submitDeposit({ value: "7" }))
                      .to.emit(multiSig, "DepositSubmitted")
                      .withArgs(deployer.address, 0, "7")
              })
              it("increments s_depositCounter", async function () {
                  const initialCount = await multiSig.s_depositCounter()
                  await multiSig.submitDeposit({ value: 77 })
                  const finalCount = await multiSig.s_depositCounter()
                  assert.equal(
                      initialCount.add(1).toString(),
                      finalCount.toString()
                  )
              })
          })
          describe("addSharedFunds", function() {
            beforeEach(async function() {
                multiSig = await sigFactory.deploy(_owners, 2)
            })
            it("reverts if msg.sender isnt an owner", async function() {
                await expect(multiSig.addSharedFunds("7")).to.be.revertedWith(
                    "MultiSig__InsufficientBalance(0, 7)"
                )
            })
            it("reverts if msg.sender's balance is less than value", async function () {
                await expect(
                    multiSig.addSharedFunds("1000000")
                ).to.be.revertedWith(
                    "MultiSig__InsufficientBalance(0, 1000000)"
                )
            })
            it("decrements msg.sender's balance correctly", async function () {
                await multiSig.submitDeposit({value: "7"})
                const initialBal = await multiSig.balances(deployer.address)
                await multiSig.addSharedFunds("7")
                const finalBal = await multiSig.balances(deployer.address)
                assert.equal(initialBal.sub(7).toString(), finalBal.toString())
            })
            it("increments s_sharedFunds balance correctly", async function () {
                await multiSig.submitDeposit({ value: "7" })
                const initialBal = await multiSig.s_sharedFunds()
                await multiSig.addSharedFunds("7")
                const finalBal = await multiSig.s_sharedFunds()
                assert.equal(initialBal.add(7).toString(), finalBal.toString())
            })
            it("emits SharedFundsAddded event correctly", async function() {
                await multiSig.submitDeposit({value: "7"})
                await expect(multiSig.addSharedFunds(7)).to.emit(multiSig, "SharedFundsAdded").withArgs(deployer.address, 7)

            })
          })
          describe("proposeTransaction", function () {
              beforeEach(async function () {
                  multiSig = await sigFactory.deploy(_owners, 2)
              })
              it("reverts if msg.sender isn't an owner", async function () {
                  await expect(
                      multiSig
                          .connect(user)
                          .proposeTransaction(user.address, "420", "0x")
                  ).to.be.revertedWith("MultiSig__OnlyOwner")
              })
              it("pushes Transaction into transactionArray", async function () {
                  await multiSig.proposeTransaction(user.address, "7", "0x")
                  const tx = await multiSig.transactionArray(0)
                  assert.equal(tx.toString(), [
                      deployer.address,
                      user.address,
                      false,
                      "0x",
                      0,
                      "7",
                      0,
                  ])
              })
              it("pushes Transaction into addressToTxArray", async function () {
                  await multiSig.proposeTransaction(user.address, "7", "0x")
                  const tx = await multiSig.addressToTxArray(
                      deployer.address,
                      0
                  )
                  assert.equal(tx.toString(), [
                      deployer.address,
                      user.address,
                      false,
                      "0x",
                      0,
                      "7",
                      0,
                  ])
              })
              it("emits the transactionProposed event", async function () {
                  await expect(
                      multiSig.proposeTransaction(user.address, "777", "0x")
                  )
                      .to.emit(multiSig, "TransactionProposed")
                      .withArgs(deployer.address, user.address, 0, "777")
              })
              it("increments the s_transactionCounter", async function () {
                  const initialCount = await multiSig.s_transactionCounter()
                  await multiSig.proposeTransaction(user.address, "7", "0x")
                  const finalCount = await multiSig.s_transactionCounter()
                  assert.equal(
                      initialCount.add(1).toString(),
                      finalCount.toString()
                  )
              })
          })
          describe("confirmTransaction", function () {
              beforeEach(async function () {
                  multiSig = await sigFactory.deploy(_owners, 2)
                  await multiSig.proposeTransaction(user.address, "7", "0x")
                  // proposing, confirming, and executing tx to test revert
                  // await multiSig.proposeTransaction(user.address, "777", "0x")
                  // await multiSig.confirmTransaction(1)
                  // await multiSig.connect(owner2).confirmTransaction(1)
                  // await multiSig.connect(owner3).confirmTransaction(1)
                  // await multiSig.executeTransaction(1)
              })
              it("reverts if msg.sender isnt an owner", async function () {
                  await expect(
                      multiSig.connect(user).confirmTransaction(0)
                  ).to.be.revertedWith("MultiSig__OnlyOwner")
              })
              // it("reverts if tx is already executed", async function() {
              //     await expect(multi)
              // })
              it("reverts if tx doesn't exist", async function () {
                  await expect(
                      multiSig.confirmTransaction(7)
                  ).to.be.revertedWith("MultiSig__InvalidTransactionId(7)")
              })
              it("reverts if msg.sender has already confirmed the tx", async function () {
                  await multiSig.confirmTransaction(0)
                  await expect(
                      multiSig.confirmTransaction(0)
                  ).to.be.revertedWith("MultiSig__AlreadyConfirmed")
              })
              it("keeps track of addresses that have confirmed", async function () {
                  await multiSig.confirmTransaction(0)
                  const expectedValue = await multiSig.hasConfirmed(
                      deployer.address,
                      0
                  )
                  assert.equal(expectedValue, true)
              })
              it("increments the number of Transaction confirmations", async function () {
                  const Transaction = await multiSig.transactionArray(0)
                  const initialCount = Transaction.confirmations
                  await multiSig.confirmTransaction(0)
                  //console.log(`initial Count: ${initialCount}`)
                  const Transaction2 = await multiSig.transactionArray(0)
                  const finalCount = Transaction2.confirmations
                  //console.log(`final Count: ${finalCount}`)
                  assert.equal(
                      initialCount.add(1).toString(),
                      finalCount.toString()
                  )
              })
              it("emits TransactionConfirmed event correctly", async function() {
                await expect(multiSig.confirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(deployer.address, 0, 1)
              })
          })
          describe("revokeConfirmation", function () {
              beforeEach(async function () {
                  multiSig = await sigFactory.deploy(_owners, 2)
                  await multiSig.proposeTransaction(user.address, "7", "0x")
              })
              it("reverts if msg.sender isnt an owner", async function () {
                  await expect(
                      multiSig.connect(user).revokeConfirmation(0)
                  ).to.be.revertedWith("MultiSig__OnlyOwner()")
              })
              it("reverts if txId doesnt exist", async function () {
                  await expect(
                      multiSig.revokeConfirmation(7)
                  ).to.be.revertedWith("MultiSig__InvalidTransactionId(7)")
              })
              //   it("reverts if tx is already executed", async function() {

              //   })
              it("reverts if owner hasn't confirmed", async function () {
                  await expect(
                      multiSig.revokeConfirmation(0)
                  ).to.be.revertedWith("MultiSig__TxNotConfirmed(0)")
              })
              it("keeps track of addresses that revoke confirmations", async function () {
                  await multiSig.connect(owner2).confirmTransaction(0)
                  await multiSig.connect(owner2).revokeConfirmation(0)
                  assert.equal(
                      await multiSig.hasConfirmed(owner2.address, 0),
                      false
                  )
              })
              it("decrements the number of Transaction confirmations", async function () {
                  await multiSig.confirmTransaction(0)
                  const initialCount = (await multiSig.transactionArray(0))
                      .confirmations
                  //console.log(`initialCount: ${initialCount}`)
                  await multiSig.revokeConfirmation(0)
                  const finalCount = (await multiSig.transactionArray(0))
                      .confirmations
                  //console.log(`finalCount: ${finalCount}`)
                  assert.equal(
                      initialCount.sub(1).toString(),
                      finalCount.toString()
                  )
              })
              it("emits the ConfirmationRevoked event correctly", async function() {
                await multiSig.confirmTransaction(0)
                await expect(multiSig.revokeConfirmation(0)).to.emit(multiSig, "ConfirmationRevoked").withArgs(deployer.address, 0, 0)
              })
          })
          describe("executeTransaction", function () {
              beforeEach(async function () {
                  multiSig = await sigFactory.deploy(_owners, 2)
                  await multiSig.proposeTransaction(user.address, "7", "0x")
              })
              it("reverts if msg.sender isnt an owner", async function () {
                  await expect(
                      multiSig.connect(user).executeTransaction(0)
                  ).to.be.revertedWith("MultiSig__OnlyOwner()")
              })
              it("reverts if txId doesnt exist", async function () {
                  await expect(
                      multiSig.executeTransaction(7)
                  ).to.be.revertedWith("MultiSig__InvalidTransactionId(7)")
              })
              it("reverts if tx is already executed", async function() {
                await multiSig.submitDeposit({value: "7"})
                await multiSig.addSharedFunds("7")
                await multiSig.connect(owner2).confirmTransaction(0)
                await multiSig.connect(owner3).confirmTransaction(0)
                await multiSig.executeTransaction(0)
                await expect(multiSig.executeTransaction(0)).to.be.revertedWith(
                    "MultiSig__TransactionAlreadyExecuted(0)"
                )
              })
              it("reverts if tx doesnt have enough confirmations", async function () {
                  await expect(
                      multiSig.executeTransaction(0)
                  ).to.be.revertedWith("MultiSig__NeedsMoreConfirmations(0, 2)")
              })
              it("reverts if s_sharedFunds is less than Tx value", async function() {
                await multiSig.submitDeposit({ value: "7" })
                await multiSig.addSharedFunds("3")
                await multiSig.connect(owner2).confirmTransaction(0)
                await multiSig.connect(owner3).confirmTransaction(0)
                await expect(multiSig.executeTransaction(0)).to.be.revertedWith(
                    "MultiSig__NeedMoreSharedFunds(3, 7)"
                ) 
              })
              it("reverts if transaction doesnt execute", async function() {
                await multiSig.proposeTransaction(testHelper.address, "7", "0x")
                await multiSig.submitDeposit({ value: "7" })
                await multiSig.addSharedFunds("7")
                await multiSig.connect(owner2).confirmTransaction(1)
                await multiSig.connect(owner3).confirmTransaction(1)
                await expect(multiSig.executeTransaction(1)).to.be.revertedWith("MultiSig__TransactionExecutionFailed(1)")
              })
              it("should execute transaction correctly", async function() {
                await multiSig.submitDeposit({value: "7"})
                await multiSig.addSharedFunds("7")
                await multiSig.connect(owner2).confirmTransaction(0)
                await multiSig.connect(owner3).confirmTransaction(0)
                const initialBal = await multiSig.getBalance()
                //console.log(`initialBal: ${initialBal}`)
                await multiSig.executeTransaction(0)
                const finalBal = await multiSig.getBalance()
                //console.log(`finalBal: ${finalBal}`)
              })
              it("emits TransactionExecuted event correctly", async function() {
                await multiSig.submitDeposit({ value: "7" })
                await multiSig.addSharedFunds("7")
                await multiSig.connect(owner2).confirmTransaction(0)
                await multiSig.connect(owner3).confirmTransaction(0)
                await expect(multiSig.executeTransaction(0)).to.emit(multiSig, "TransactionExecuted").withArgs(deployer.address, 0)
              })
          })
          describe("withdraw", function() {
            beforeEach(async function() {
                multiSig = await sigFactory.deploy(_owners, 2)
            })
            it("reverts if msg.sender isnt an owner", async function() {
                await expect(
                    multiSig.connect(user).withdraw("7")
                ).to.be.revertedWith("MultiSig__OnlyOwner()")
            })
            it("reverts if withdraw input exceeds balance", async function() {
                await expect(multiSig.withdraw("777")).to.be.revertedWith(
                    "MultiSig__InsufficientBalance(0, 777)"
                )
            })
            it("updates balances mapping correctly", async function() {
                await multiSig.submitDeposit({value: "77"})
                const initialBal = await multiSig.balances(deployer.address)
                await multiSig.withdraw("7")
                const finalBal = await multiSig.balances(deployer.address)
                assert.equal(initialBal.sub(7).toString(), finalBal.toString())
            })
            // it("reverts if withdraw fails", async function() { 
            //     await testHelper.withdraw("420")
            // })
            it("it emits withdraw event correctly", async function() {
                await multiSig.submitDeposit({value: 7})
                await expect(multiSig.withdraw(7)).to.emit(multiSig, "Withdraw").withArgs(deployer.address, 7)
            })
          })
      })
