# Simple Multi Sig #


- Owners may deposit money with `submitDeposit()` and have their own personal balances tracked.  ***(you may also send money directly to contract)***
- They may also call a `addSharedFunds()` function to deposit money from their balance into a pool of money shared amongst the owners. 
- From there any owner may propose a transaction using the `proposeTransaction()` function. 
- If enough owners use `confirmTransaction()` on the proposed transaction then any owner may call `executeTransaction()` to execute the transaction with the proposed parameters.


---


### Steps in creating ###  
1. Create multi sig contract with [] of owners 
2. Create transaction proposals for sending transactions (ETH or bytes data)
3. Create method of adding and removing owners