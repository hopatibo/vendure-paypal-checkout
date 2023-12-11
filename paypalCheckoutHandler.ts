import {
    CancelPaymentResult,
    CancelPaymentErrorResult,
    PaymentMethodHandler,
    VendureConfig,
    CreatePaymentResult,
    SettlePaymentResult,
    SettlePaymentErrorResult
} from '@vendure/core';

import { LanguageCode } from '@vendure/core';

let api_url : string = "https://api-m.sandbox.paypal.com";  //sandbox

async function do_get_token(digest:string) {
    const token_api : string = api_url + "/v1/oauth2/token"; 
    const content: string = "grant_type=client_credentials"; //json 
    const response = await fetch(token_api, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Language' : 'en-US',
            'Authorization' : 'Basic ' + digest,
        },
        body: content,
        })
        const data = await response.json();
        //console.log(JSON.stringify(data));
        //console.log("Token: " + access_token);
        return data.access_token;   
};


async function capture(access_token : string, orderid: string) {
    const capture_api : string = api_url + "/v2/checkout/orders/" + orderid + "/capture";
    //console.log("capture_api: " + capture_api);
    
    const response = await fetch(capture_api, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Language' : 'en-US',
            'Authorization' : 'Bearer ' + access_token,
            'PayPal-Partner-Attribution-Id' : 'IBOInternet_Cart_ShopPilot_PPCP',
            'PayPal-Request-Id' : '7b92603e-77fa-4896-8e78-5dea2050476a',
        },
        body: '',
        })
        const data = await response.json();
        console.log(JSON.stringify(data));
        if(data.status == 'COMPLETED') {
                return 1;
        } else {
                return 0;
        }
};



export const myPaypalCheckoutHandler = new PaymentMethodHandler({
    code: 'paypal-checkout',
    description: [{
        languageCode: LanguageCode.en,
        value: 'PayPal Checkout',
    }],
    args: {
        client_id: {type : 'string'},
        client_secret: {type : 'string'},
        run_in_sandbox: {type: 'boolean'},
    },

    /** This is called when the `addPaymentToOrder` mutation is executed */        
    createPayment: async (ctx, order, amount, args, metadata): Promise<CreatePaymentResult> => {
        //console.log('++++ createPayment already executed in frontend metadata:' + JSON.stringify(metadata) +"order: " + JSON.stringify(order) + "amount: " + JSON.stringify(amount)); 
        if (!args.run_in_sandbox) { //global api_url
            api_url = api_url.replace('.sandbox','');
        }
        const digest : string =  btoa(args.client_id + ":" +  args.client_secret); //base64
        (async () => {
            const access_token: string = await do_get_token(digest);
            capture(access_token,metadata.orderid);
        })();
        
        try {

            return {
                amount: order.totalWithTax,
                state: 'Settled' as const,
                transactionId: metadata.orderid, 
                metadata: {
                    cardInfo: "ADASSDASDD", //result.cardInfo,
                    // Any metadata in the `public` field
                    // will be available in the Shop API,
                    // All other metadata is private and
                    // only available in the Admin API.
                    public: {
                        referenceCode: "zrtzrz", //result.publicId,
                    }
                },
            };
        } catch (err) {
            return {
                amount: order.totalWithTax,
                state: 'Declined' as const,
                transactionId: metadata.orderid, 
                metadata: {
                    errorMessage: "unknown error",
                },
            };
        }
    },    
    settlePayment: async (ctx, order, payment, args): Promise<SettlePaymentResult> => {
        console.log('++++ settlePayment has to be done');   
        return {success: true};
    },    



    /** This is called when a payment is cancelled. */
    cancelPayment: async (ctx, order, payment, args): Promise<CancelPaymentResult | CancelPaymentErrorResult> => {
        try {
//            const result = await sdk.charges.cancel({
//                apiKey: args.apiKey,
//                id: payment.transactionId,
//            });
            return {success: true};
        } catch (err) {
            return {
                success: false,
                errorMessage: "errror", // err.message,
            }
        }
    },
});