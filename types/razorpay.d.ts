declare module 'razorpay' {
  export interface RazorpayOptions {
    key_id: string;
    key_secret: string;
    headers?: Record<string, string>;
  }

  export interface Orders {
    create(params: any): Promise<any>;
    fetch(orderId: string): Promise<any>;
  }

  export interface Payments {
    fetch(paymentId: string): Promise<any>;
    capture(paymentId: string, amount: number, currency: string): Promise<any>;
    refund(paymentId: string, params?: any): Promise<any>;
  }

  export interface Refunds {
    create(params: any): Promise<any>;
  }

  export default class Razorpay {
    constructor(options: RazorpayOptions);
    orders: Orders;
    payments: Payments;
    refunds: Refunds;

    static validateWebhookSignature(
      body: string,
      signature: string,
      secret: string,
    ): boolean;
  }
}
