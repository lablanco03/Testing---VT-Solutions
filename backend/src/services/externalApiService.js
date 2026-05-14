const getExchangeRates = async () => {
  const response = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!response.ok) throw new Error('Error al consultar tasas de cambio');
  const data = await response.json();
  return {
    base: data.base_code,
    lastUpdate: data.time_last_update_utc,
    rates: {
      CRC: data.rates.CRC,
      EUR: data.rates.EUR,
      MXN: data.rates.MXN,
      CAD: data.rates.CAD
    }
  };
};

module.exports = { getExchangeRates };
