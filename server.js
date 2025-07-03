const express = require('express');
const TronWeb = require('tronweb');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io',
});

const approvals = {}; // In-memory wallet approval

app.post('/login', async (req, res) => {
  const { wallet, msg, sig } = req.body;

  try {
    // Recover the address from the signed message
    const recoveredAddress = await tronWeb.trx.verifyMessage(msg, sig);

    if (recoveredAddress === wallet) {
      approvals[wallet.toLowerCase()] = true;
      return res.json({ status: 'ok' });
    } else {
      return res.status(403).json({ error: 'Signature verification failed' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Internal error: ' + err.message });
  }
});

app.post('/transfer', async (req, res) => {
  const { wallet } = req.body;
  const approved = approvals[wallet.toLowerCase()];
  if (!approved) {
    return res.status(403).json({ error: 'Wallet not approved' });
  }

  try {
    const tx = await tronWeb.transactionBuilder.sendTrx(
      'TLgLkhHvaiwnLxNr5AoCFN8oF61XxF8uy8', // your wallet address
      1_000_000, // amount in SUN (1 TRX = 1_000_000 SUN)
      wallet
    );
    res.json({ tx });
  } catch (err) {
    res.status(500).json({ error: 'Transfer error: ' + err.message });
  }
});

app.listen(10000, () => {
  console.log('Backend running on port 10000');
});
