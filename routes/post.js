const express = require("express");
const router = express.Router()
const mongoose = require('mongoose')
const requireLogin = require("../middleware/requireLogin")
const Post = mongoose.model("Post")
const Poll = require("../models/poll")

router.get('/allpost',requireLogin,(req,res)=>{
    Post.find()
    .populate("postedBy","_id name")
    .populate("comments.postedBy","_id name")
    .then(posts=>{
        res.json({posts})
    })
    .catch(err=>{
        console.log(err)
    })
})

router.post('/createpost',requireLogin,(req,res)=>{
    const {title,body,pic} = req.body
    if(!title || !body || !pic){
        return res.status(422).json({error:"please add all the field"})
    }
    req.user.password = undefined
    const post = new Post({
        title,
        body,
        photo:pic,
        postedBy:req.user
    })
    post.save().then(result=>{
        res.json({post:result})
    })
    .catch(err=>{
        console.log(err)
    })
})

router.get('/mypost',requireLogin,(req,res)=>{
    Post.find({postedBy:req.user._id})
    .populate("postedBy","_id name")
    .then(mypost=>{
        res.json({mypost})
    })
    .catch(err=>{
        console.log(err)
    })
})

router.put('/like', requireLogin, (req, res) => {
    Post.findByIdAndUpdate(req.body.postId, {
        $push: { likes: req.user._id }
    }, {
        new: true
    })
    .then(result => {
        res.json(result);
    })
    .catch(err => {
        res.status(422).json({ error: err });
    });
});

router.put('/unlike', requireLogin, (req, res) => {
    Post.findByIdAndUpdate(req.body.postId, {
        $pull: { likes: req.user._id }
    }, {
        new: true
    })
    .then(result => {
        res.json(result);
    })
    .catch(err => {
        res.status(422).json({ error: err });
    });
});

router.put('/comment', requireLogin, async (req, res) => {
    const comment = {
        text: req.body.text,
        postedBy: req.user._id
    };

    try {
        const result = await Post.findByIdAndUpdate(req.body.postId, {
            $push: { comments: comment }
        }, {
            new: true
        }).populate("comments.postedBy", "_id name")
          .populate("postedBy", "_id name");

        res.json(result);
    } catch (err) {
        res.status(422).json({ error: err.message });
    }
});

router.delete('/deletepost/:postId', requireLogin, (req, res) => {
    const postId = req.params.postId;
    Post.findOneAndDelete({ _id: postId, postedBy: req.user._id })
        .then(deletedPost => {
            if (!deletedPost) {
                return res.status(404).json({ error: "Post not found or you are not authorized to delete it" });
            }
            res.json({ message: "Post deleted successfully", deletedPost });
        })
        .catch(error => {
            console.error('Error deleting post:', error);
            res.status(500).json({ error: "Internal server error" });
        });
});

router.get('/getsubpost',requireLogin,(req,res)=>{
    Post.find({postedBy:{$in:req.user.following}})
    .populate("postedBy","_id name")
    .populate("comments.postedBy","_id name")
    .then(posts=>{
        res.json({posts})
    })
    .catch(err=>{
        console.log(err)
    })
})

// routes/post.js

// routes/post.js

router.post('/createpoll', requireLogin, async (req, res) => {
    const { question, options, postId } = req.body;
    if (!question || !options || options.length < 2 || !postId) {
        return res.status(400).json({ error: "Please provide a question, at least two options, and a post ID for the poll." });
    }

    try {
        const poll = await Poll.create({
            question,
            options: options.map(text => ({ text, votes: 0 })),
            postId,
            voters: []
        });
        res.status(201).json({ poll });
    } catch (err) {
        console.error('Error creating poll:', err);
        res.status(500).json({ error: "Failed to create poll" });
    }
});

router.put('/vote', requireLogin, async (req, res) => {
    const { pollId, optionIndex } = req.body;
    if (!pollId || optionIndex === undefined || optionIndex < 0) {
        return res.status(400).json({ error: "Invalid request parameters" });
    }

    try {
        const poll = await Poll.findById(pollId);
        if (!poll) {
            return res.status(404).json({ error: "Poll not found" });
        }

        if (optionIndex >= poll.options.length) {
            return res.status(400).json({ error: "Invalid option index" });
        }

        if (poll.voters.includes(req.user._id)) {
            return res.status(400).json({ error: "You have already voted in this poll" });
        }
        poll.options[optionIndex].votes++;
        poll.voters.push(req.user._id);
        await poll.save();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/pollresults/:pollId', requireLogin, async (req, res) => {
    const pollId = req.params.pollId;
    if (!pollId) {
        return res.status(400).json({ error: "Invalid request parameters" });
    }

    try {
        const poll = await Poll.findById(pollId);
        if (!poll) {
            return res.status(404).json({ error: "Poll not found" });
        }
        const totalVotes = poll.options.reduce((acc, option) => acc + option.votes, 0);
        const results = poll.options.map(option => ({
            text: option.text,
            votes: option.votes,
            percentage: totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0
        }));

        res.json({ results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/polls', requireLogin, async (req, res) => {
    try {
        const polls = await Poll.find();
        res.json({ polls });
    } catch (err) {
        console.error('Error fetching polls:', err);
        res.status(500).json({ error: "Failed to fetch polls" });
    }
});
module.exports = router;



