const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 3000;

// Data untuk key dan memberId
const keyokt = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214509288104204890303UMI51440014ID.CO.QRIS.WWW0215ID20253689552610303UMI5204541153033605802ID5925REREZZ OFFICIAL OK21602806008SUKABUMI61054311162070703A016304595A';
const memberid = 'OK2160280';

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));  // Mengirimkan index.html
});

app.get('/deposit', async (req, res) => {
    const amount = 1000; // Misalkan kita tetapkan jumlah deposit ke 1000

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ message: 'Jumlah deposit tidak valid.' });
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

        // Kirimkan informasi pembayaran
        res.json({
            status: 'success',
            paymentInfo: {
                transactionId: pay.transactionId,
                qrisUrl: pay.qrImageUrl,
                amount: requestAmount,
                fee: feeServer,
                total: nominal,
                expirationTime: formattedTime,
                timeLeft: timeLeft
            }
        });

        // Cek status transaksi
        let isTransactionComplete = false;

        const interval = setInterval(async () => {
            if (isTransactionComplete) {
                clearInterval(interval);
                return;
            }

            try {
                const statusResponse = await axios.get(`https://www.api.im-rerezz.xyz/api/orkut/cekstatus?merchant=${memberid}&keyorkut=${keyokt}`);
                const status = statusResponse.data;

                // Jika transaksi sudah selesai
                if (status && parseInt(status.amount) === parseInt(nominal)) {
                    isTransactionComplete = true;
                    console.log(`Transaksi berhasil! Total Rp${nominal} telah diterima.`);

                    // Anda dapat melakukan tindakan lebih lanjut seperti memperbarui saldo atau notifikasi lainnya.
                }
            } catch (error) {
                console.error('Error memeriksa status transaksi:', error);
            }
        }, 5000); // Pengecekan status setiap 5 detik
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Gagal membuat atau memeriksa pembayaran. Silakan coba lagi.' });
    }
});
// Start the server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
