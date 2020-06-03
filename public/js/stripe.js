import axios from "axios"
import { showAlert } from "./alert";

const stripe = Stripe('pk_test_YMU1TqH2tyLt499ke8K1O3SL00IsYK7GAo');


export const bookTour = async tourId =>{

    try {
        //get session from our API
        const session = await axios(`http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`);
        console.log(session);


    // Create CheckOut form + chanre credit card
    await stripe.redirectToCheckout({
        sessionId : session.data.session.id
    })
    } catch (error) {
        showAlert('error' , error)
    }
}
