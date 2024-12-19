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
```

If internet drops, computer reboots, etc, just broadcast them again.
sendTx script will compare nonces (network vs transaction) and will broadcast only what was unsent.