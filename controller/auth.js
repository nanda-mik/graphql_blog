const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator/check');
const jwt = require('jsonwebtoken');


exports.signup = async (req,res,next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;    
    }
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    try{
    let hashedPw = await bcrypt.hash(password, 12)
            const user = new User({
                email: email,
                password: hashedPw,
                name: name
            });
            let result = await user.save();
            res.status(201).json({message: 'User created', userId: result._id});
      }catch(err){
        if(!err.statusCode){
          err.statusCode = 500;
        }
        next(err);
      }
};

exports.login = async (req,res,next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    try{
      let user = await  User.findOne({email: email});
      if(!user){
        const error = new Error('A user with this email not found');
        error.statusCode = 401;
        throw error;
    }
    loadedUser = user;
    let isEqual = await bcrypt.compare(password, user.password);
    if(!isEqual){
      const error = new Error('Wrong password');
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign({
        email: loadedUser.email,
        userId: loadedUser._id.toString()
    },'secretblogsecret',
        {expiresIn: '1h'}
    );
    res.status(200).json({token: token, userId: loadedUser._id.toString()});
    }catch (err){
      if(!err.statusCode){
        err.statusCode = 500;
      }
      next(err);
    }
};

exports.getStatus = async (req,res,next)=> {
    const userId = req.userId;
    try{
      let user = await User.findById(userId);
      if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
      }
      const status = user.status;
      res.status(200).json({status: status});
    }catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };
  
  exports.editStatus = async (req,res,next) => {
    const updatedStatus = req.body.status;
    const userId = req.userId;
    try{
      let user = await  User.findById(userId);
      if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
      }
      user.status = updatedStatus;
      await user.save();
      res.status(200).json({message: 'Status updated.'});
    }catch (err){
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };