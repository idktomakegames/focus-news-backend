import express from "express";
const authRouter = express.Router();
import { User } from "../files/schema.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

authRouter.get('/refresh', (req, res) => {
    const refreshToken = req.cookies.refresh;
    

    if(!refreshToken){
        return res.status(401).json("Unauthorized");
    }

    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decode) => {
        if(err){
            return res.status(403).json("Forbidden");
        }
        
        const { username, role, email } = decode

        const token = jwt.sign({ 
            id: id, 
            username: username, 
            email: email, 
            role: role },
            process.env.JWT_SECRET,
            { expiresIn: "15s" }
        );
        console.log(token);
        
        return res.cookie("jwt", token, { httpOnly: true, secure: true, sameSite: "none", maxAge: 15 * 1000 }).json({username: username, role: role, email: email});
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
        }, process.env.JWT_SECRET, {expiresIn: "15m"});

        const refreshToken = jwt.sign({
            id: newUser._id,
            username: username,
            email: email,
            role: newUser.role
        }, process.env.REFRESH_SECRET, {expiresIn: "7d"});

        res.cookie("jwt", token, {httpOnly: true, secure: true, sameSite: "none", maxAge: 15 * 60 * 1000, path: '/'})
        res.cookie("refresh", refreshToken, {httpOnly: true, secure: true, sameSite: "none", maxAge: 7 * 24 * 60 * 60 * 1000, path: '/'})

        return res.status(201).json("Contul a fost creat cu succes");

    } catch (err) {
        return res.status(500).json("Eroare internă a serverului. Te rugăm să încerci din nou mai târziu.")
    }
});

authRouter.post('/login', async (req, res) => {
    const { email , password } = req.body;
    console.log(req.cookies)
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
            }, process.env.JWT_SECRET, {expiresIn: "15m"});

            const refreshToken = jwt.sign({
                id: user._id,
                username: user.username,
                email: email,
                role: user.role
            }, process.env.REFRESH_SECRET, {expiresIn: "7d"});

            res.cookie("jwt", token, {httpOnly: true, secure: true, sameSite: "none", maxAge: 15 * 60 * 1000, path: '/'})
            res.cookie("refresh", refreshToken, {httpOnly: true, secure: true, sameSite: "none", maxAge: 7 * 24 * 60 * 60 * 1000, path: '/'})

            return res.json("Autentificare reușită!");
        } else {
            return res.status(401).json("Autentificare eșuată");
        }
    } catch (err) {
        console.log(err.message);
        return res.status(500).json("Eroare internă a serverului. Te rugăm să încerci din nou mai târziu.")
    }
});


authRouter.get('/logout', (_, res) => {
    res.clearCookie("jwt", {httpOnly: true, secure: true, sameSite: "none", maxAge: 0, path: '/'});
    res.clearCookie("refresh", {httpOnly: true, secure: true, sameSite: "none", maxAge: 0, path: '/'});
});

authRouter.post('/update', async (req, res) => {
    const { username, email } = req.body;
    const token = req.cookies.jwt;

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findOne({_id: decoded.id});

    if(!user){
        return res.status(404).json({message: "Resursa solicitată nu a putut fi recuperată"});
    }

    if(username === user.username || email === user.email){
        return res.status(400).json({message: "Datele introduse trebuie să fie diferite de cele vechi"})
    }

    if(username){
        user.username = username
    }

    if(email){
        if(!email.includes("@") && email.length < 10){
            return res.status(400).json({message: "Email invalid"});
          }
        user.email = email
    }

    await user.save();
    return res.clearCookie("jwt", {httpOnly: true, secure: true, sameSite: "none", maxAge: 0, path: '/'}).json({message: "Datele au fost schimbate cu succes, re-autentificare necesară", username: user.username})
});

export default authRouter;