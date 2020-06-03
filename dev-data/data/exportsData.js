const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewsModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,

}).then(result => {
    // console.log(result.connections);
    console.log('DB coonection succesfully');
})

//READ FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

//Import data into Db

const importData = async() => {
    try {
        await Tour.create(tours);
        await User.create(users, {validateBeforeSave : false});
        await Review.create(reviews);
    console.log('data in db successfully')
        process.exit(); 
    } catch (error) {
    console.log(error)
        
    }
}

// DELETE DATA

const deleteData = async() => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('data delete successfully')
        process.exit();
    } catch (error) {
        console.log(error)

    }
}

if(process.argv[2] === '--import'){
    importData();
}else if(process.argv[2] === '--delete'){
    deleteData();
}

