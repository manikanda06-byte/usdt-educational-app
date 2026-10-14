# Educational USDT BEP-20 Sender + TESTUSD Testnet + Local Simulator

This educational starter separates three functions. The mainnet contract deliberately uses the name and symbol `USDT`, but it is an unrelated custom token and must not be represented as Tether USDT:

1. **Educational USDT on BNB Smart Chain Mainnet**: deploy the included `contracts/EducationalUSDT.sol` contract on BSC Mainnet, then paste its address into the app and send this custom token. It is named `USDT` with symbol `USDT` and is **not genuine USDT**, does not represent a claim on US dollars, and has no promised monetary value. Deploying and transferring on mainnet costs real BNB gas.
2. **TESTUSD on BNB Smart Chain Testnet**: sends a clearly labelled test token with no monetary value.
3. **Local-only simulator**: records fictional `sUSDT` transfers in browser localStorage; no blockchain transaction is created.

## Requirements
- Node.js 18+
- Compatible injected EVM wallet browser or wallet DApp browser
- Internet connection
- Real BNB for mainnet deployment and transaction gas; testnet BNB for testnet gas

## Run the app
```bash
npm start
```
Open `http://127.0.0.1:3000`.

## Deploy Educational USDT on BNB Smart Chain Mainnet
1. Understand that deployment and transactions use **real BNB** and that Educational USDT is a custom token, not genuine USDT.
2. Open the official Remix IDE: https://remix.ethereum.org/.
3. Create `EducationalUSDT.sol` and paste the source from `contracts/EducationalUSDT.sol`. Compile with Solidity 0.8.20 or compatible 0.8.x.
4. In your wallet, select **BNB Smart Chain Mainnet** (chain ID 56). In Remix, choose **Injected Provider** / your wallet and confirm the network is mainnet.
5. Deploy `EducationalUSDT` and approve the deployment in your wallet. Review the gas fee before confirming. The deploying address receives 100,000 Educational USDT.
6. Copy the deployed contract address. In the app, connect the wallet, paste the address in “Your deployed Educational USDT contract address”, and click “Load Educational USDT contract and balance”. The app checks that the token symbol is `Educational USDT`.
7. Enter the recipient's EVM address and amount, then review the wallet confirmation carefully. The recipient may need to add the custom token in Trust Wallet using the contract address and BNB Smart Chain network. Wallet display support can vary.
8. Verify the transaction at https://bscscan.com/.

## Deploy TESTUSD on BNB Smart Chain Testnet
1. Open https://remix.ethereum.org/. Create `TESTUSD.sol` and paste the source from `contracts/TESTUSD.sol`. Compile with Solidity 0.8.20 or compatible.
2. Select BNB Smart Chain Testnet (chain ID 97) in your wallet and use a testnet faucet to obtain testnet BNB if available.
3. In Remix, choose Injected Provider, verify the testnet network, deploy `TESTUSD`, and approve the transaction.
4. Copy the contract address into the app's testnet section and send tokens. Trust Wallet must support/select that testnet and may require manually adding the token.
5. Verify at https://testnet.bscscan.com/.

## Safety and limitations
- **Educational USDT is not USDT.** It is a separate custom educational token; it will not credit the recipient's genuine USDT balance and must never be represented as genuine USDT.
- Never enter a seed phrase or private key into this app or a website.
- Mainnet deployment and transfers are irreversible and spend real BNB on gas. Verify the network, contract, recipient, and amount.
- This is an unaudited educational starter. It has not been tested with a live wallet or blockchain transaction.
