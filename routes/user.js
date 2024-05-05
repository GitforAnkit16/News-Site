const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const requireLogin = require('../middleware/requireLogin');
const User = mongoose.model("User");
const Post = mongoose.model("Post")
router.get('/user/:id', requireLogin, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id }).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const posts = await Post.find({ postedBy: req.params.id }).populate("postedBy", "_id name");
        
        res.json({ user, posts });
    } catch (err) {
        console.error("Error fetching user profile:", err);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
});

router.put('/follow', requireLogin, async (req, res) => {
    try {
        // Check if the user is already following the target user
        const user = await User.findById(req.user._id);
        if (user.following.includes(req.body.followId)) {
            return res.status(400).json({ error: "You are already following this user" });
        }

        // Add the follower ID to the target user's followers array
        const followedUser = await User.findByIdAndUpdate(
            req.body.followId,
            { $push: { followers: req.user._id } },
            { new: true }
        );

        // Add the followee ID to the current user's following array
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $push: { following: req.body.followId } },
            { new: true }
        );

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

router.put('/unfollow', requireLogin, async (req, res) => {
    try {
        // Remove the follower ID from the target user's followers array
        const unfollowedUser = await User.findByIdAndUpdate(
            req.body.followId,
            { $pull: { followers: req.user._id } },
            { new: true }
        );

        // Remove the followee ID from the current user's following array
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { following: req.body.followId } },
            { new: true }
        );

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});
router.put('/updatepic', requireLogin, async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { pic: req.body.pic } },
            { new: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(updatedUser);
    } catch (err) {
        res.status(422).json({ error: "Failed to update profile picture" });
    }
});

module.exports = router;
