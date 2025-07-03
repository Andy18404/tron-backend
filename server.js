const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const TronWeb = require("tronweb");

const app = express();
const port = process.env.PORT || 3000;

const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io",
});

let approvals = {};

app.use(cors());
app.use(bodyParser.json());

app.post("/login", async (req, res) => {
  const { wallet, msg, sig } = req.body;
  try {
    const verified = await tronWeb.trx.verifyMessage(msg, sig, wallet);
    if (verified) {
      approvals[wallet.toLowerCase()] = true;
      return res.status(200).json({ success: true });
    }
    return res.status(401).json({ error: "Signature verification failed" });
  } catch (e) {
    return res.status(500).json({ error: "Verification error", details: e.message });
  }
});

app.post("/transfer", async (req, res) => {
  const { wallet } = req.body;
  if (!approvals[wallet.toLowerCase()]) {
    return res.status(403).json({ error: "Wallet not approved" });
  }

  try {
    const tx = await tronWeb.transactionBuilder.sendTrx(
      "TLgLkhHvaiwnLxNr5AoCFN8oF61XxF8uy8", // Receiver
      1000000, // 1 TRX in sun
      wallet // From address
    );
    res.json({ tx });
  } catch (e) {
    res.status(500).json({ error: "Transaction error", details: e.message });
  }
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});