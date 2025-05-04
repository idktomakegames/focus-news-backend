import express from "express";
import nodemailer from 'nodemailer';
import { User } from "../files/schema.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
const resetRouter = express.Router();

const blackList = [];

resetRouter.post("/reset-password", async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({email: email});

    try {
    const token = jwt.sign({
        id: user._id,
        email: email
    }, process.env.JWT_SECRET, { expiresIn: "3m"});

    const link = `https://focus-giurgiu.ro/reset/password/${token}`

    const html = `<p>Salutare,</p><p>Urmează acest link pentru a-ți reseta parola pentru contul ${email}</p> <a href='${link}'>${link}</a><p>Dacă nu ați solicitat pentru resetarea parolei, puteți ignora acest email.</p> <p>@Focus Giurgiu</p>`


    const sendEmail = (service) => {
        return nodemailer.createTransport({
            service: service,
            secure: true,
            auth: {
                user: "redactiafocusgiurgiu@gmail.com",
                pass: process.env.EMAIL_PASS
            }
        }).sendMail({
            from: "redactiafocusgiurgiu@gmail.com",
            to: email,
            subject: "Reset Password",
            html: html
        });
    };

    await Promise.all([
        sendEmail("gmail"),
        sendEmail("yahoo")
    ]);
    return res.json("Dacă există un cont asociat adresei de email vei primi un link de reset.")
    } catch (error) {
        return res.status(500).json("Eroare la trimiterea emailului")
    }
});

resetRouter.get("/valid/reset-token", (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if(blackList.some(t => t === token)){
        return res.sendStatus(403)
    }
    
    if(!token){
        return res.sendStatus(401) 
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, _) => {
        if(err){
            return res.sendStatus(403)
        }
    })

    return res.sendStatus(204);
})

resetRouter.post('/update-password', async (req, res) => {
    const { newPassword, token } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({email: decoded.email});

        if(newPassword.length < 6){
            return res.status(400).json("Parola trebuie să conțină cel puțin 6 caractere")
        }

        if(await bcrypt.compare(newPassword, user.password)){
            return res.status(409).json("Parola nouă trebuie să fie diferită de cea veche")
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();
        blackList.push(token);
        return res.json("Parola a fost schimbată cu succes");
    } catch (error) {
        console.log(error)
        return res.status(500).json("Eroare internă a serverului. Te rugăm să încerci din nou mai târziu.")
    }  
});

export default resetRouter;