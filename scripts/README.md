The following flow is used for the payments


First, export all required envs
```bash
export BATCH_CONTRACT_ADDRESS='0x9497d1d64F2aFeBcd4f9916Eef3d9094E5Df962f'
export NETWORK_RPC_URL='xxx'
export PRIVATE_KEY=0x123
```

then fetch rewards from backend

```
root@Alex-desktop-ryzen:/repos/ocean/incentives# node scripts/fetchRewards.js --timestamp=1734539129000


CSV file saved to /repos/ocean/incentives/data/2024-week-51/rewards-epoch-1734539129.csv
Batch 1 saved to /repos/ocean/incentives/data/2024-week-51/rewards-epoch-1734539129-batch-1.csv
Batch 2 saved to /repos/ocean/incentives/data/2024-week-51/rewards-epoch-1734539129-batch-2.csv
Batch 3 saved to /repos/ocean/incentives/data/2024-week-51/rewards-epoch-1734539129-batch-3.csv
Batch 4 saved to /repos/ocean/incentives/data/2024-week-51/rewards-epoch-1734539129-batch-4.csv
......
```

then generate all signed tx

```
root@Alex-desktop-ryzen:/repos/ocean/incentives# node scripts/generateTx.js data/2024-week-51/rewards-epoch-1734539129.csv data/txs/2024-week-51/txs


Account nonce: 409
tokenAddress:0x0000000000000000000000000000000000000000
Creating batch of 250 payments
Creating batch of 250 payments
Creating batch of 250 payments
Creating batch of 250 payments
Creating batch of 250 payments
Creating batch of 250 payments
Creating batch of 250 payments
Creating batch of 250 payments
Creating batch of 250 payments
.....
```

Now, in `data/txs/2024-week-51/txs` you have all transactions, signed.  We need to broadcast them

```
root@Alex-desktop-ryzen:/repos/ocean/incentives# node scripts/sendTx.js data/txs/2024-week-51/txs


root@Alex-desktop-ryzen:/repos/ocean/incentives# node scripts/sendTx.js data/txs/2024-week-51/txs
Account nonce: 410
1 - Skiping line , our nonce: 410, tx nonce: 409
2 - Sending tx with nonce 410.. 0x2be7cf98238445fd5c17d91e2626833acf3ddc9d0fe6a7fd0084667835dd6da5 ..  confirmed
3 - Sending tx with nonce 411.. 0x3ac992cb8eecb7dfd67898e7c78a6ea70161c7914deb7e3ed1495c78693c382a ..  confirmed
4 - Sending tx with nonce 412.. 0x219cb14a46bccca89e4064f55e1fa40bc1eabf48cdc0cfdd564fb60481af964c ..  confirmed
5 - Sending tx with nonce 413.. 0x24d5edff42241c24d4443933e4bd43dca2437224d87e82d18fb2f71ffbaed1a7 ..  confirmed
6 - Sending tx with nonce 414.. 0x822ca31d88d8424c613b6f421900b7473942c3dcf409ae153f25737785e09749 ..  confirmed
7 - Sending tx with nonce 415.. 0xaa75a4aed0469b0fa2339aa5c1d197a14edcb583a652a797da6e97e8292619c3 ..  confirmed
8 - Sending tx with nonce 416.. 0xc67dbd1573c4d40609dce8b078d2cdd0344c23316ca7e269a7aff019914265af ..  confirmed
9 - Sending tx with nonce 417.. 0x73aade6491774271387dad8e6bc1888ef4780caf2c37f2bc49efbd02acd8c987 ..  confirmed
10 - Sending tx with nonce 418.. 0xbcd1eff5a68c528ec6dcf5d8b0b6649ba9dd2904676674512023682b74abc62a ..  confirmed
11 - Sending tx with nonce 419.. 0xe4f91a15330c50ad9b1ee18ef0ac06b0ce3f95bd0153de79177d060327957073 ..  confirmed
12 - Sending tx with nonce 420.. 0x768e0f18d416b452186cba85e24b4caacda33868074a17507c1a9b2402040500 ..  confirmed
13 - Sending tx with nonce 421.. 0xf0a528bdd50227f6d0c3daabf71b20b19d2b32eb9aa7b3f2d2e6f97289280d8e ..  confirmed
14 - Sending tx with nonce 422.. 0xdec632a7a455cbaecfa72dab198535716024db380764eb770428ea8d87ed20a9 ..  confirmed

```

If internet drops, computer reboots, etc, just broadcast them again.
sendTx script will compare nonces (network vs transaction) and will broadcast only what was unsent.