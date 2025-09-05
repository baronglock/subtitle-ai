// Configuração PIX Simples - Direto para conta pessoal
export const PIX_CONFIG = {
  // Chave PIX (pode ser CPF, CNPJ, email, telefone ou chave aleatória)
  chavePix: process.env.PIX_KEY || "", // Ex: "11999999999" ou "email@example.com"
  
  // Nome do recebedor (aparece no app do banco)
  nomeRecebedor: process.env.PIX_RECEIVER_NAME || "SubtleAI",
  
  // Cidade do recebedor
  cidade: process.env.PIX_CITY || "São Paulo",
  
  // Identificador da transação (para controle interno)
  txid: "SUBTLEAI",
  
  // Mensagem adicional (opcional)
  infoAdicional: "Pagamento SubtleAI",
};

// Função para gerar o código PIX Copia e Cola
export function generatePixCode(amount: number, orderId: string): string {
  const { chavePix, nomeRecebedor, cidade, txid } = PIX_CONFIG;
  
  // Formato do PIX Copia e Cola simplificado
  // Este é um formato básico - em produção use a biblioteca pix-utils
  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${chavePix}520400005303986540${amount.toFixed(2)}5802BR5925${nomeRecebedor}6009${cidade}62140510${orderId}6304`;
  
  // Adicionar CRC16 (checksum) - simplificado
  return pixCode + calculateCRC16(pixCode);
}

// Função simplificada para CRC16 (em produção use uma biblioteca apropriada)
function calculateCRC16(str: string): string {
  // Implementação simplificada do CRC16 para PIX
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return ((crc ^ 0) & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}