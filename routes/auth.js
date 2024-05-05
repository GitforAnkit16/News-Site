const express = require("express");
const router = express.Router()
const mongoose = require('mongoose')
const User = mongoose.model("User")
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
const {JWT_SECRET} = require("../keys")
const requireLogin = require('../middleware/requireLogin')


router.post('/signup',(req,res)=>{
    const {name,email,pic} = req.body
    const password = String(req.body.password);
    if(!email || !password || !name){
        return res.status(422).json({error:"please add all the fields"})
    }
    User.findOne({email:email}).
    then((savedUser)=>{
        if(savedUser){
            return res.status(422).json({error:"User already exists"})
        }
        bcrypt.hash(password, 12)
         .then(hashedpassword => {
            const user = new User({
                email,
                password:hashedpassword,
                name,
                pic
            })
            user.save()
            .then(user=>{
                res.json({message:"saved succesfully"})
            })
            .catch(err=>{
                console.log(err)
            })
        })
        
    })
    .catch(err=>{
        console.log(err)
    })
})

router.post('/signin',(req,res)=>{
    const email = req.body.email;
    const password = String(req.body.password);
    if(!email || !password){
        return res.status(422).json({error:"please add email or password"})
    }
    User.findOne({email:email})
    .then(savedUser=>{
        if(!savedUser)
            return res.status(422).json({error:"Invalid Email or Password"})
        bcrypt.compare(password,savedUser.password)
        .then(doMatch=>{
            if(doMatch){
                const token = jwt.sign({_id:savedUser._id},JWT_SECRET)
                const {_id,name,email,followers,following,pic} = savedUser
                res.json({token,user:{_id,name,email,followers,following,pic}})
            }
            else    
                return res.status(422).json({error:"Invalid email or password"})
        })
        .catch(err=>{
            console.log(err)
        }
        )
    })
})


module.exports = router