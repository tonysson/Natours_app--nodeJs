import '@babel/polyfill';

import {login, logout} from './login';
import { displayMap } from './mapbox';
import { signup } from './signup';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';







//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signupForm = document.querySelector('.form--signup');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data')
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour')



//DELEGATIONS

if(mapBox){
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

if (signupForm) {
  signupForm.addEventListener('submit', e => {
    e.preventDefault();

    const name = document.getElementById('name').value
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const passwordConfirm = document.getElementById('passwordConfirm').value
    
    signup( name, email, password, passwordConfirm);
  })
};

if(loginForm){
  loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('email').value
      const password = document.getElementById('password').value
      login(email, password);
  });
};

if (userPasswordForm){
  userPasswordForm.addEventListener('submit', async e =>{
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = "LOADING..."
    const passwordCurrent = document.getElementById('password-current').value
    const password = document.getElementById('password').value
    const passwordConfirm = document.getElementById('password-confirm').value

    await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');
   
    document.querySelector('.btn--save-password').textContent = "Save password"
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '' ;
    document.getElementById('password-confirm').value = '' ;
  });
};


if (userDataForm) {
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();

    // pour avoir differents form de data y compris les photo
    const form = new FormData()
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value)
    form.append('photo', document.getElementById('photo').files[0])
  
    updateSettings(form, 'data');
  })
}

if(logoutBtn) logoutBtn.addEventListener('click', logout);

if(bookBtn){
  bookBtn.addEventListener('click', e => {

    e.target.textContent = 'Processing...'
    const {tourId} = e.target.dataset;
    bookTour(tourId)
  })
}