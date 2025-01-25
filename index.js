const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 3000;

// Data untuk key dan memberId
const keyokt = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214509288104204890303UMI51440014ID.CO.QRIS.WWW0215ID20253689552610303UMI5204541153033605802ID5925REREZZ OFFICIAL OK21602806008SUKABUMI61054311162070703A016304595A'; // Gantilah dengan API Key yang sesuai
const memberid = 'OK2160280'; // Gantilah dengan Member ID yang sesuai

app.use(express.static('public'));
app.use(express.json());

// Endpoint untuk mengirimkan file index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));  // Mengirimkan index.html dari folder public
});

// Endpoint untuk melakukan deposit
app.post('/deposit', async (req, res) => {
    const { amount } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ message: 'Masukkan jumlah deposit yang valid.' });
    }

    let requestAmount = parseInt(amount);
    let feeServer = Math.floor(Math.random() * 11); // Fee acak untuk server
    let nominal = requestAmount + feeServer;

    try {
        // Melakukan request ke API untuk mendapatkan informasi deposit dan QRIS
        const response = await axios.get(`https://www.api.im-rerezz.xyz/api/orkut/deposit?amount=${nominal}&codeqr=${keyokt}`);
        const pay = response.data.result;
        const expirationTime = new Date(pay.expirationTime);
        const timeLeft = Math.max(0, Math.floor((expirationTime - new Date()) / 60000)); // Menghitung waktu tersisa dalam menit
        const formattedTime = new Date(expirationTime).toLocaleTimeString(); // Format waktu kedaluwarsa

        res.json({
            status: 'success',
            paymentInfo: {
                transactionId: pay.transactionId,
                qrisUrl: pay.qrImageUrl, // URL gambar QRIS
                total: nominal, // Total deposit termasuk fee
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
        // Melakukan request untuk cek status transaksi
        const statusResponse = await axios.get(`https://www.api.im-rerezz.xyz/api/orkut/cekstatus?merchant=${memberid}&keyorkut=${keyokt}`);
        const status = statusResponse.data;

        if (status && parseInt(status.amount) === parseInt(nominal)) {
            res.json({
                status: 'success',
                amountReceived: nominal
            });
        } else {
            res.json({
                status: 'pending'  // Menunggu status konfirmasi dari transaksi
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
