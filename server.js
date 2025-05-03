import express from "express";
import cors from 'cors';
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import articleRouter from "./routes/articles.js";
import resetRouter from "./routes/resetPassword.js";
import authRouter from "./routes/auth.js";
import rateLimit from 'express-rate-limit';
import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const options = ["https://focus-giurgiu.ro", "https://focus-giurgiu.netlify.app"]
app.use(cors({origin: options, credentials: true}));
const limiter = rateLimit({
    windowMs: 10 * 60000,
    max: 300,
    handler: (req, res) => res.status(429).json("Prea multe cereri. Te rugăm să încerci din nou mai târziu.")
})
app.use(cookieParser())
app.use(limiter)
app.use('/', articleRouter);
app.use('/', authRouter);
app.use('/', resetRouter);
mongoose.connect(process.env.DB_ADRESS).then(console.log("Connected")).catch((e) => console.log(e.message))


app.listen(process.env.PORT, () => console.log(`Server running on port 7500`))