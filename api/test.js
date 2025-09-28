// Função de teste simples para verificar se o Vercel está funcionando
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  res.status(200).json({
    message: 'API funcionando!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
};