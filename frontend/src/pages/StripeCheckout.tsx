import {CheckoutProvider, PaymentElement} from '@stripe/react-stripe-js/checkout';
import {loadStripe} from '@stripe/stripe-js';


// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

const Checkout = ({clientSecret}) => (
  <CheckoutProvider
    stripe={stripePromise}
    options={{clientSecret}}
  >
    <form>
      <PaymentElement />
      <button type="submit">Pay now</button>
    </form>
  </CheckoutProvider>
);

export default Checkout;