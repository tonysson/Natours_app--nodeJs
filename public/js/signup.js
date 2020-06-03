import axios from 'axios';
import { showAlert } from './alert';

export const signup = async (name, email, password, passwordConfirm) => {
    try {
        const res = await axios({
            method: 'POST',
            url: 'http://localhost:3000/api/v1/users/signup',
            data: {
                name,
                email,
                password,
                passwordConfirm,
            }
        });
        console.log(res)
        if (res.data.status === 'success') {
            showAlert('success', 'Sign up  successfully')
            window.setTimeout(() => {
                location.assign('/')
            }, 0)
        }
    } catch (error) {
        showAlert('error', error.response.data.message);
    }
}