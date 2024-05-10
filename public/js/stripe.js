import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe("pk_test_51OmiFsBfcEidHzvrvgq1dJhIYcZDqKSQjDKqCBsSvQQuf60SsP6DS4yV4yn9SsLfP1SSrlBznzRwJgUXbdkDrn5T00Zk6x1RYT");


export const bookTour = async tourId => {

    // get session
    const session = await axios(`http://localhost:3000/api/v1/booking/checkout-session/${tourId}`);
  
    console.log(session)
  
    // create checkout form and charge user
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    })


}