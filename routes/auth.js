import express from "express";
const authRouter = express.Router();
import { User } from "../files/schema.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

authRouter.get('/check/permissions', (req, res) => {
    const token = req.cookies.jwt;

    if(!token){
        return res.status(401).json("Unauthorized");
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
        if(err){
            return res.status(403).json("Forbidden");
        }
        
        const username = decode.username;
        const role = decode.role;
        return res.json({username: username, role: role});
    })
})

authRouter.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    console.log(password, username, email)

    if(password.length < 6){
        return res.status(400).json("Parola trebuie să conțină cel puțin 6 caractere")
    }

    try {
        const user = await User.findOne({email: email});

        if(user){
            return res.status(409).json("Un cont cu date similare este deja existent")
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username: username,
            email: email,
            password: hashedPassword
        });

        const token = jwt.sign({
            id: newUser._id,
            username: username,
            email: email,
            role: newUser.role
        }, process.env.JWT_SECRET, {expiresIn: "48h"});
        console.log(newUser);
        return res.cookie("jwt", token, {httpOnly: true, secure: true, sameSite: "none", maxAge: 48 * 60 * 60 * 1000}).status(201).json("Contul a fost creat cu succes");

    } catch (err) {
        return res.status(500).json("Eroare internă a serverului. Te rugăm să încerci din nou mai târziu.")
    }
});

authRouter.post('/login', async (req, res) => {
    const { email , password } = req.body;
    try {

        if(!email || !password){
            return res.status(400).json("Cerere invalidă. Verifică datele introduse și încearcă din nou.")
        }

        const user = await User.findOne({email: email});

        if(!user){
            return res.status(404).json("Resursa solicitată nu a putut fi recuperată");
        }

        if(await bcrypt.compare(password, user.password)){
            const token = jwt.sign({
                id: user._id,
                username: user.username,
                email: email,
                role: user.role
            }, process.env.JWT_SECRET, {expiresIn: "48h"});

            return res.cookie("jwt", token, {httpOnly: true, secure: true, sameSite: "none", maxAge: 48 * 60 * 60 * 1000}).json("Autentificare reușită!");
        } else {
            return res.status(401).json("Autentificare eșuată");
        }
    } catch (err) {
        return res.status(500).json("Eroare internă a serverului. Te rugăm să încerci din nou mai târziu.")
    }
});


authRouter.get('/logout', (req, res) => {
    return res.clearCookie("jwt", {httpOnly: true, secure: true, sameSite: "none", maxAge: 48 * 60 * 60 * 1000}).sendStatus(204);
});

export default authRouter;