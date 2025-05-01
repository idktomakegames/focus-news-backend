import express from "express";
import multer from 'multer';
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { Article } from "../files/schema.js";
const articleRouter = express.Router();
articleRouter.use(express.json());
import jwt from 'jsonwebtoken';

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API,
    api_secret: process.env.CLOUD_SECRET
})

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'FocusNewsImages',
        allowed_formats: ['jpg', 'png', 'jpeg']
    }
})

const uploader = multer({storage: storage})

articleRouter.post('/upload-image', uploader.single("articleImg"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    return res.status(201).json({imageUrl: req.file.path})
});

articleRouter.post('/post-article', async (req, res) => {
    const { title, content, category, imageUrl } = req.body;
    const token = req.cookies.jwt;
    

    if(!token){
        return res.status(401).json("Something went wrong")
    }


    if(!title || !content || !category || !imageUrl){
        return res.status(400).json("All fields are required")
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
        if(err){
            return res.status(403).json("Something went wrong")
        }

        if(decode.role !== "admin"){
            return res.status(403).json("Something went wrong")
        }
    })

    const articleExists = await Article.findOne({title: title});

    if(articleExists){
        return res.status(409).json("Please, choose a different title for the article")
    }

    try {
        const article = await Article.create({
        title: title,
        content: content,
        category: category,
        imageUrl: imageUrl
    });

    return res.status(201).json("Article uploaded successfully")
    } catch (error) {
        return res.status(500).json("Something went wrong")
    } 
});

articleRouter.get('/get-articles/:page', async (req, res) => {
    const { page } = req.params;
    console.log(page);
    
    
    const currentPage = parseInt(page)

    if(isNaN(currentPage) || currentPage < 1){
        return res.sendStatus(400);
    }
    
    const articles = await Article.find().sort({createdAt: -1}).skip((currentPage - 1) * 10).limit(4);
    const totalArticles = await Article.countDocuments();
    const totalPages = Math.ceil(totalArticles / 10)
    return res.json({totalPages: totalPages, articles: articles})
});

articleRouter.get('/get-articles/category/economie/:page', async (req, res) => {

    const { page } = req.params;
    
    const currentPage = parseInt(page)

    if(isNaN(currentPage) || currentPage < 1){
        return res.sendStatus(400);
    }
    
    const articles = await Article.find({category: "economie"}).sort({createdAt: -1}).skip((currentPage - 1) * 10).limit(9);
    const totalArticles = await Article.countDocuments({category: "economie"});
    const totalPages = Math.ceil(totalArticles / 10)
    return res.json({totalPages: totalPages, articles: articles})

});

articleRouter.get('/get-articles/category/infrastructura/:page', async (req, res) => {
    
    const { page } = req.params;
    
    const currentPage = parseInt(page)

    if(isNaN(currentPage) || currentPage < 1){
        return res.sendStatus(400);
    }
    
    const articles = await Article.find({category: "infrastructura"}).sort({createdAt: -1}).skip((currentPage - 1) * 10).limit(9);
    const totalArticles = await Article.countDocuments({category: "infrastructura"});
    const totalPages = Math.ceil(totalArticles / 10)
    return res.json({totalPages: totalPages, articles: articles})
});

articleRouter.get('/get-articles/category/sanatate/:page', async (req, res) => {
    
    const { page } = req.params;
    
    const currentPage = parseInt(page)

    if(isNaN(currentPage) || currentPage < 1){
        return res.sendStatus(400);
    }
    
    const articles = await Article.find({category: "sanatate"}).sort({createdAt: -1}).skip((currentPage - 1) * 10).limit(9);
    const totalArticles = await Article.countDocuments({category: "sanatate"});
    const totalPages = Math.ceil(totalArticles / 10)
    return res.json({totalPages: totalPages, articles: articles})
});

articleRouter.get('/get-articles/category/tragedii/:page', async (req, res) => {
    
    const { page } = req.params;
    
    const currentPage = parseInt(page)

    if(isNaN(currentPage) || currentPage < 1){
        return res.sendStatus(400);
    }
    
    const articles = await Article.find({category: "tragedii"}).sort({createdAt: -1}).skip((currentPage - 1) * 10).limit(9);
    const totalArticles = await Article.countDocuments({category: "tragedii"});
    const totalPages = Math.ceil(totalArticles / 10)
    return res.json({totalPages: totalPages, articles: articles})
});

articleRouter.get('/article/:id', async (req, res) => {
    const title = req.params.id;

    const article = await Article.findOne({title: title});

    if(article == null){
        return res.status(404).json("Article not found")
    }
    return res.json(article);
    
});

articleRouter.get('/search/:query', async (req, res) => {
    const query = req.params.query;

    const articles = await Article.find({title: {$regex: new RegExp(query, 'i')}}).limit(9);

    if(articles.length === 0){
        return res.status(404).json("Nu au fost găsite articole.")
    }
    return res.json(articles);
});

articleRouter.delete('/delete/article', async (req, res) => {
    const { query } = req.body;
    const token = req.cookies.jwt;

    if(!token){
        return res.status(401).json({message: "Something went wrong"});
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
        if(err){
            return res.status(403).json({message: "Something went wrong"})
        }

        if(decode.role !== "admin"){
            return res.status(403).json({message: "Something went wrong"})
        }
    });

    try {
        const article = await Article.findOne({title: { $regex: new RegExp(query, 'i')}});
        if(!article){
            return res.status(404).json({message: "Article not found"})
        }

        await Article.deleteOne({_id: article._id});
        return res.json({message: "Article deleted successfully", title: article.title });
    } catch (err) {
        return res.status(500).json("Internal server error");
    }  
})

export default articleRouter;