interface CryptoPrice {
  usdt: number;
  vnd: number;
}

class CryptoService {
  private static instance: CryptoService;
  private cache: { [key: string]: { price: CryptoPrice; timestamp: number } } = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  async getUSDTPrice(): Promise<CryptoPrice> {
    const cacheKey = 'usdt_price';
    const now = Date.now();
    
    // Check cache first
    if (this.cache[cacheKey] && (now - this.cache[cacheKey].timestamp) < this.CACHE_DURATION) {
      console.log('Using cached price:', this.cache[cacheKey].price);
      return this.cache[cacheKey].price;
    }

    try {
      // Try CoinGecko API first (free and reliable)
      console.log('Fetching price from CoinGecko...');
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd,vnd');
      
      if (response.ok) {
        const data = await response.json();
        const usdtPrice = data.tether.usd;
        const vndPrice = data.tether.vnd;
        
        const priceData: CryptoPrice = {
          usdt: usdtPrice,
          vnd: vndPrice
        };
        
        // Cache the result
        this.cache[cacheKey] = {
          price: priceData,
          timestamp: now
        };
        
        console.log('CoinGecko price fetched:', priceData);
        return priceData;
      }
    } catch (error) {
      console.warn('CoinGecko API failed, trying fallback:', error);
    }

    try {
      // Fallback to Binance API
      console.log('Fetching price from Binance...');
      const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTUSDT');
      
      if (response.ok) {
        const data = await response.json();
        const usdtPrice = parseFloat(data.price);
        const vndPrice = usdtPrice * 24000; // Approximate VND rate
        
        const priceData: CryptoPrice = {
          usdt: usdtPrice,
          vnd: vndPrice
        };
        
        // Cache the result
        this.cache[cacheKey] = {
          price: priceData,
          timestamp: now
        };
        
        console.log('Binance price fetched:', priceData);
        return priceData;
      }
    } catch (error) {
      console.warn('Binance API failed:', error);
    }

    // Return cached value if available, even if expired
    if (this.cache[cacheKey]) {
      console.log('Using expired cached price:', this.cache[cacheKey].price);
      return this.cache[cacheKey].price;
    }

    // Return fallback values only if no cache exists
    const fallbackPrice = 1.0; // USDT is usually close to $1
    const fallbackVND = fallbackPrice * 24000;
    
    const fallbackData: CryptoPrice = {
      usdt: fallbackPrice,
      vnd: fallbackVND
    };
    
    console.log('Using fallback price:', fallbackData);
    return fallbackData;
  }

  // Get cached price without API call
  getCachedPrice(): CryptoPrice | null {
    const cacheKey = 'usdt_price';
    const now = Date.now();
    
    if (this.cache[cacheKey] && (now - this.cache[cacheKey].timestamp) < this.CACHE_DURATION) {
      return this.cache[cacheKey].price;
    }
    
    return null;
  }

  // Convert SMP (VND) to USDT
  convertSMPToUSDT(smpAmount: number, usdtPrice: number): number {
    // Since VND = SMP, we need to convert VND to USD first, then to USDT
    const vndToUsd = smpAmount / 24000; // Approximate VND to USD rate
    return vndToUsd / usdtPrice;
  }

  // Convert USDT to SMP (VND)
  convertUSDTToSMP(usdtAmount: number, usdtPrice: number): number {
    // Convert USDT to USD, then to VND
    const usdAmount = usdtAmount * usdtPrice;
    return usdAmount * 24000; // Approximate USD to VND rate
  }

  // Format currency
  formatCurrency(amount: number, currency: 'USD' | 'VND' | 'SMP'): string {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    } else if (currency === 'VND') {
      return `${amount.toLocaleString('vi-VN')} VND`;
    } else {
      return `${amount.toLocaleString('vi-VN')} SMP`;
    }
  }
}

export default CryptoService.getInstance(); 