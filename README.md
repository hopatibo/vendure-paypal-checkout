# vendure-paypal-checkout
A payment method for vendure using paypal checkout

Version alpha 0.01
Tested with vendure 2.1.1

Author: Hans Ophüls

Usefull links:

- [paypal checkout](https://www.paypal.com/de/business/checkout)
- [react paypal js](https://www.npmjs.com/package/@paypal/react-paypal-js)


In the vendure server directory structure paypalCheckoutHandler.ts has to be in the directory /src/plugins/payment-plugin/

Edit  /src/vendure-config.ts to add some lines:

1. In the head part add:
```
import { myPaypalCheckoutHandler } from './plugins/payment-plugin/paypalCheckoutHandler';
```

2. In the PaymentOptions part add one line: 
```
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler,
                                myPaypalCheckoutHandler,
                               ],
    },
```

that's it. This is the server part.

But we also have to do some things with the client payment page.
It is assumed that the client uses react.js or next.js.
We have to add a module provided by paypal.
```npm i @paypal/react-paypal-js```


In the payment page we add:
```import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";```

# Configuration
```
const paypalInitalOptions = {
  clientId: "public client ID --- xxxxxxxxxxxxxxxxxxxxx",
  currency: "EUR",
  intent: "capture",
};
const src_paypalsdk ='https://www.paypal.com/sdk/js?client-id=' + paypalInitialOptions.clientId + "&components=buttons&currency=EUR&locale=de_DE&enable-funding=paylater&debug=true";
```

#Display the paypal buttons
```
return (<div>

         <Script src={src_paypalsdk} />
        
        <PayPalScriptProvider options={paypalInitalOptions}>
            <PayPalButtons style={{ layout: "vertical" }} deferLoading={true}  onApprove={onApprove} createOrder={createOrder} />
        </PayPalScriptProvider>

</div>)
```
There are two callback functions called in &lt;PayPalButtons&gt; above: createOrder and onApprove.

# createOrder
This function is called if someone clicks on one of the paypal buttons to choose a payment method.
```
function createOrder(data,actions) {
  if (!aOrder) return;
  return actions.order.create({
    "purchase_units": [{
      "amount": {
        "currency_code": "EUR",
        "value": aOrder.activeOrder.totalWithTax/100,
      },
     "payer": {
        "name": {
          "given_name": aOrder.activeOrder.customer.firstName,
          "surname": aOrder.activeOrder.customer.lastName,
        },
        "email_address": aOrder.activeOrder.customer.emailAddress, 
        "phone": aOrder.activeOrder.customer.phoneNumber, 
      },
      "shipping": {
          "name": {
              "full_name":  aOrder.activeOrder.customer.firstName + ' ' + aOrder.activeOrder.customer.lastName,
          },
          "type": 'SHIPPING',
          "address" : {
                  address_line_1: aOrder.activeOrder.shippingAddress.streetLine1,
                  country_code: aOrder.activeOrder.shippingAddress.countryCode,
                  postal_code: aOrder.activeOrder.shippingAddress.postalCode,
                  admin_area_2: aOrder.activeOrder.shippingAddress.city,
                  admin_area_1: aOrder.activeOrder.shippingAddress.streetLine2,
          }
     },
     "application_context": {
        "shipping_preference": 'SET_PROVIDED_ADDRESS' // Kann nicht überschrieben werden
     }

    }]
 })
};
```

# onApprove 
This Function is called after a Order is successfully created.
The task is to change the state of the order to ´ArrangingPayment´ with TRANSITION_ORDER_STATE_MUTATION and excute the ADD_PAYMENT_TO_ORDER_MUTATION.
With excuting ADD_PAYMENT_TO_ORDER_MUTATION  the server will call the payment handler.

```
function onApprove(data,actions) {
  paypal_orderid=data.orderID;
  setArrangingPayment();
};
```
