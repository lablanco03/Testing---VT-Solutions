const { getExchangeRates } = require('../services/externalApiService');

// GET /api/external/rates
const getRates = async (req, res) => {
  try {
    const data = await getExchangeRates();
    res.json(data);
  } catch (error) {
    res.status(502).json({ message: 'Error consultando API externa', error: error.message });
  }
};

// GET /api/external/convert?amount=100&from=USD&to=CRC
const convertPrice = async (req, res) => {
  try {
    const { amount, to = 'CRC' } = req.query;
    if (!amount) return res.status(400).json({ message: 'El parámetro amount es requerido' });

    const data = await getExchangeRates();
    const rate = data.rates[to];

    if (!rate) return res.status(400).json({ message: `Moneda ${to} no disponible` });

    res.json({
      from: 'USD',
      to,
      amount: parseFloat(amount),
      converted: parseFloat((amount * rate).toFixed(2)),
      rate
    });
  } catch (error) {
    res.status(502).json({ message: 'Error en conversión', error: error.message });
  }
};

module.exports = { getRates, convertPrice };
