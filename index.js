const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// Data untuk key dan memberId
const keyokt = 'your-api-key';
const memberid = 'your-member-id';

app.use(express.static('public'));
app.use(express.json());

// Endpoint untuk melakukan deposit
app.post('/deposit', async (req, res) => {
    const { amount } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ message: 'Masukkan jumlah deposit yang valid.' });
    }

    let requestAmount = parseInt(amount);
    let feeServer = Math.floor(Math.random() * 11);
    let nominal = requestAmount + feeServer;

    try {
        const response = await axios.get(`https://www.api.im-rerezz.xyz/api/orkut/deposit?amount=${nominal}&codeqr=${keyokt}`);
        const pay = response.data.result;
        const expirationTime = new Date(pay.expirationTime);
        const timeLeft = Math.max(0, Math.floor((expirationTime - new Date()) / 60000));
        const formattedTime = new Date(expirationTime).toLocaleTimeString();

        res.json({
            status: 'success',
            paymentInfo: {
                transactionId: pay.transactionId,
                qrisUrl: pay.qrImageUrl,
                total: nominal,
                expirationTime: formattedTime,
                timeLeft: timeLeft
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Gagal membuat atau memeriksa pembayaran. Silakan coba lagi.' });
    }
});

// Endpoint untuk cek status deposit
app.get('/deposit/status', async (req, res) => {
    const amount = 1000;  // Deposit amount tetap 1000 (dapat disesuaikan sesuai kebutuhan)
    let requestAmount = parseInt(amount);
    let feeServer = Math.floor(Math.random() * 11);
    let nominal = requestAmount + feeServer;

    try {
        const statusResponse = await axios.get(`https://www.api.im-rerezz.xyz/api/orkut/cekstatus?merchant=${memberid}&keyorkut=${keyokt}`);
        const status = statusResponse.data;

        if (status && parseInt(status.amount) === parseInt(nominal)) {
            res.json({
                status: 'success',
                amountReceived: nominal
            });
        } else {
            res.json({
                status: 'pending'
            });
        }
    } catch (error) {
        console.error('Error memeriksa status transaksi:', error);
        res.status(500).json({ message: 'Error memeriksa status transaksi' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
