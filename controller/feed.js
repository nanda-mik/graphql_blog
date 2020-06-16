const {validationResult} = require('express-validator/check');
const fs = require('fs');
const path = require('path');
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try{
  let totalItems = await  Post.find().countDocuments();
  let posts = await Post.find().skip((currentPage - 1)* perPage).limit(perPage);
  res.status(200).json({message: 'Fetched posts successfully.', posts: posts, totalItems: totalItems});
  }catch (err){
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);
  }
};
  
exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      const error = new Error('Validation failed.');
      error.statusCode = 422;
      throw error;
    }
    if(!req.file){
      const error = new Error('No images provided');
      error.statusCode = 422;
      throw error;
    }
    const imageUrl = req.file.path.replace("\\","/");
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    });
    try{
      await post.save();
      let user = await User.findById(req.userId);
      creator = user;
      user.posts.push(post);
      await user.save();
      res.status(201).json({
        message: 'Post created successfully!',
        post: post,
        creator: {_id: creator._id, name: creator.name}
      })
  }catch (err){
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.viewPost = async (req,res,next) =>{
    const postId = req.params.postId;
    try{
      let post = await Post.findById(postId)
      if(!post){
        const error = new Error('Could not find post');
        error.statusCode = 404;
        throw error;
      }
      console.log(post);
      res.status(200).json({message: 'Post fetched.', post: post});
    }catch (err) {
      if(!err.statusCode){
        err.statusCode = 500;
      }
      next(err);
    }
};
  
exports.updatePost = async (req, res, next) => {
  const postId =req.params.postId;
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    const error = new Error('Validation failed.');
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if(req.file){
    imageUrl = req.file.path.replace("\\","/");;
  }
  if(!imageUrl){
    const error = new Error('No file picked');
    error.statusCode = 422;
    throw error;
  }
  try{
  let post = await Post.findById(postId)
    if(!post){
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }
    if(post.creator.toString() !== req.userId){
      const error = new Error('Not Authorized!');
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    let result = await post.save();
    res.status(200).json({ message: 'Post updated!', post: result });
  }catch (err){
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async(req,res,next) => {
  const postId = req.params.postId;
  try{
  let post = await Post.findById(postId)
    if(!post){
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }
    if(post.creator.toString() !== req.userId){
      const error = new Error('Not Authorized!');
      error.statusCode = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    let user = await User.findById(req.userId);
    console.log(user);
    user.posts.pull(postId);
    let result = await user.save();
    console.log(result);
    res.status(200).json({message: 'Deleted Post.'});
  }catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};