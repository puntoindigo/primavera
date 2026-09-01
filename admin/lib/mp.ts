import MercadoPago from "mercadopago";

let _client: MercadoPago | null = null;

export function getMpClient(): MercadoPago {
  if (!_client) {
    _client = new MercadoPago({ accessToken: process.env.MP_ACCESS_TOKEN! });
  }
  return _client;
}
