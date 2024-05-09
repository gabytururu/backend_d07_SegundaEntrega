import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import {router as productsRouter} from './routes/productsRouter.js'
import {router as cartsRouter} from './routes/cartsRouter.js'
import { router as vistasRouter} from './routes/vistasRouter.js'
import { engine } from 'express-handlebars';
import { Server } from 'socket.io';
import __dirname from './utils.js';
import { messagesModel } from './dao/models/messagesModel.js'

const PORT = 8080;
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname,'/views'));

app.use(express.static(path.join(__dirname,'/public')));

app.use("/", vistasRouter)
app.use("/api/products", productsRouter)
app.use("/api/carts", cartsRouter)


const server= app.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`)
})

const dbConnection = async()=>{
    try{
        await mongoose.connect(
            "mongodb+srv://gabriela:wO2Mjvm7zojeyD7T@cluster0testgaby.l3ofz0y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0TestGaby",
            {
                dbName: "ecommerce"
            }
        )

        console.log('DB Conectada en puerto 8080 - ecommerce...!')
    }catch(err){
        console.log('error al connectarse con la DB via puerto 8080:', err.message)
    }
}

dbConnection()

const io= new Server(server)

io.on("connection", socket=>{
    console.log(`El cliente con id ${socket.id} se ha conectado al chat`)

    socket.on("email", async email=>{
        let messages = await messagesModel.find()
        socket.emit("chatHistory", messages)
        socket.broadcast.emit("newUserConnection", email)
    })

    socket.on("createNewMessage", async (email, message)=>{
        await messagesModel.create({email, message})
        io.emit("displayNewMessage", email, message)
    })
})