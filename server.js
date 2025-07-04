const express = require('express');
const TronWeb = require('tronweb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 10000;

// Init TronWeb for Mainnet
const tronWeb = new TronWeb({
  fullHost: 'https://api.trongrid.io',
});

// Store approved wallets in memory (for demo)
const approvals = {};

app.post('/login', async (req, res) => {
  const { wallet, msg, sig } = req.body;

  try {
    // ✅ Recover the wallet address from the signature
    const recovered = await tronWeb.trx.verifyMessage(msg, sig);

    // ✅ Compare recovered address to submitted wallet
    if (recovered === wallet) {
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

  // ✅ Check if this wallet was approved
  const approved = approvals[wallet.toLowerCase()];
  if (!approved) {
    return res.status(403).json({ error: 'Wallet not approved' });
  }

  try {
    // ✅ Prepare transaction: send 1 TRX (1,000,000 SUN) to your address
    const tx = await tronWeb.transactionBuilder.sendTrx(
      'TLgLkhHvaiwnLxNr5AoCFN8oF61XxF8uy8', // YOUR WALLET
      1_000_000, // 1 TRX in SUN
      wallet // sender
    );

    return res.json({ tx });
  } catch (err) {
    return res.status(500).json({ error: 'Transfer error: ' + err.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Backend running on port ${port}`);
});
