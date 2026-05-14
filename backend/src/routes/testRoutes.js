const express = require('express');

const router = express.Router();

router.get('/test', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Ruta de prueba funcionando correctamente'
  });
});

module.exports = router;