import { Router } from 'express';
import { CartManagerMONGO as CartManager } from '../dao/cartManagerMONGO.js';
import { ProductManagerMONGO as ProductManager } from '../dao/productManagerMONGO.js';
import { isValidObjectId } from 'mongoose';
import { cartsModel } from '../dao/models/cartsModel.js';
export const router=Router();

const cartManager = new CartManager()
const productManager = new ProductManager()

router.get('/',async(req,res)=>{
    try{
        const carts = await cartManager.getCarts()
        res.setHeader('Content-type', 'application/json');
        res.status(200).json({carts})
    }catch(error){
        console.log(error)
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            error:`Unexpected server error (500) - try again or contact support`,
            message: error.message
        })
    }
})

router.get('/:cid', async(req,res)=>{
    const {cid}=req.params

    if(!isValidObjectId(cid)){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({error:`The Cart ID# provided is not an accepted Id Format in MONGODB database. Please verify your Cart ID# and try again`})
    }

    const matchingCart = await cartManager.getCartById(cid) 
    if(!matchingCart){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({
            error: `ERROR: Cart id# provided does not exist`,
            message: `Failed to update cart due to invalid argument: The Cart id provided (id#${cid}) does not exist in our database. Please verify and try again`
        })
    }

    try {
        res.setHeader('Content-type', 'application/json');
        return res.status(200).json({payload: matchingCart})
    } catch (error) {
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({
            error:`Error inesperado en servidor - intenta mas tarde`,
            message: `${error.message}`
        })
    }

})

router.post('/', async(req,res)=>{
    try {
        const newCart = await cartManager.createCart()
        res.setHeader('Content-type', 'application/json')
        return res.status(200).json({
            newCart
        })
    } catch (error) {
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            error:`Unexpected server error (500) - try again or contact support`,
            message: error.message
        })
    }
})

router.put('/:cid', async(req,res)=>{
    let {cid} = req.params;
    let newCartDetails = req.body

    if(!isValidObjectId(cid)){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({error:`The Cart ID# provided is not an accepted Id Format in MONGODB database. Please verify your Cart ID# and try again`})
    }

    let cartIsValid = await cartManager.getCartById(cid)
    if(!cartIsValid){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({
            error: `ERROR: Cart id# provided is not valid`,
            message: `Failed to replace the content in cart due to invalid argument: The Cart id provided (id#${cid}) does not exist in our database. Please verify and try again`
        })
    }

    //not sure if needed due to regex (test more & decide)
    if (typeof newCartDetails !== 'object'){
        return res.status(400).json({
            error: 'Invalid format in request body',
            message: `Failed to replace the content in the cart id#${cid} due to invalid format request. Please make sure the products you submit are in a valid JSON format.`
        });
    }
    
    //not sure if needed due to regex (test more & decide)
    if (Object.keys(newCartDetails).length === 0) {
        return res.status(400).json({
            error: 'Empty request body',
            message: `Failed to replace the content in the cart id#${cid} due to incomplete request. Please submit the products you want to push to replace the cart content.`
        });
    }
    
    const newCartDetailsString = JSON.stringify(newCartDetails)
    const regexValidFormat = /^\[\{.*\}\]$/;
    if(!regexValidFormat.test(newCartDetailsString)){
        console.log(regexValidFormat)
        return res.status(400).json({
            error: 'Invalid format in request body',
            message:  `Failed to replace the content in the cart id#${cid} due to invalid format request. Please make sure the products you submit are in a valid JSON format (Alike array with objects: [{...content}]).`
        });
    }
    
    const keys = Object.keys(newCartDetails)
    if(keys.length>0){
        const bodyFormatIsValid = keys.every(key=> 'pid' in newCartDetails[key] && 'qty' in newCartDetails[key])
        if(!bodyFormatIsValid){
            return res.status(400).json({
                error: 'Missing properties in body',
                message: `Failed to replace the content in the cart id#${cid} due to incomplete request (missing properties). All products in cart must have a "pid" and a "qty" property to be accepted. Please verify and try again.`
            });
        }
    }
    
    try{
        let cartEditDetails = await cartManager.replaceCart(cid,newCartDetails)
        res.setHeader('Content-type', 'application/json')
        return res.status(200).json({
            cartEditDetails
        })
    }catch(error){  
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            error:`Unexpected server error (500) - try again or contact support`,
            message: error.message
        })
    }
})

router.put('/:cid/products/:pid', async(req,res)=>{
    let {cid, pid} = req.params
    let {qty} = req.body
    let body = req.body
    
    if(!isValidObjectId(cid)){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({error:`The Cart ID# provided is not an accepted Id Format in MONGODB database. Please verify your Cart ID# and try again`})
    }

    if(!isValidObjectId(pid)){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({error:`The Product ID# provided is not an accepted Id Format in MONGODB database. Please verify your Product ID# and try again`})
    }

    let productIsValid = await productManager.getProductById(pid)
    if(!productIsValid){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({
            error: `ERROR: Product id# provided is not valid`,
            message: `Failed to update cart with Id#${cid} due to invalid argument: The product id provided (id#${pid}) does not exist in our database. Please verify and try again`
        })
    }

    let cartIsValid = await cartManager.getCartById(cid)
    if(!cartIsValid){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({
            error: `ERROR: Cart id# provided is not valid`,
            message: `Failed to update cart due to invalid argument: The Cart id provided (id#${cid}) does not exist in our database. Please verify and try again`
        })
    }

    // see if can improve/simplify UX logic (eg. allow for null OR [] OR {} to result in +1 instead of error)
    let regexValidBodyFormat = /^\{.*\}$/
    let fullBody = JSON.stringify(req.body)
    if(!regexValidBodyFormat.test(fullBody)){    
        return res.status(400).json({
            error: 'Invalid format in request body',
            message:  `Failed to increase requested qty of product id#${pid} in cart id#${cid} due to invalid format request. Quantities can only be increased by 1 (leaving the body or the object empty) or by notifying the quantity to add, through a valid JSON format (Alike simple object: {"qty":x} )`
        })
    }


    let productAlreadyInCart = await cartManager.findProductInCart(cid,pid) 
    if(productAlreadyInCart){
        try{
            const updatedCart = await cartManager.updateProductInCartQuantity(cid,pid,qty)
            res.setHeader('Content-type', 'application/json')
            return res.status(200).json({ updatedCart });
        }catch(error){
            res.setHeader('Content-type', 'application/json');
            return res.status(500).json({
                error:`Error 500 Server failed unexpectedly, please try again later`,
                message: `${error.message}`
            })
        }
    }

    //future improvement - seek for proper method (change +1 for +N even on first iteration)
    try{
        const updatedCart = await cartManager.updateCart(cid,pid)
        res.setHeader('Content-type', 'application/json')
        return res.status(200).json({
            updatedCart
        })   
    }catch(error){
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            error:`Error 500 Server failed unexpectedly, please try again later`,
            message: `${error.message}`
        })
    }
})

router.delete('/:cid', async(req,res)=>{
    const {cid} = req.params

    if(!isValidObjectId(cid)){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({error:`The ID# provided is not an accepted Id Format in MONGODB database. Please verify your ID# and try again`})
    }

    try {
        let deletedCart = await cartManager.deleteCart(cid)
        console.log(deletedCart)
        res.setHeader('Content-type', 'application/json');
        return res.status(200).json({
            payload:deletedCart
        })
    } catch (error) {
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            error:`Error 500 Server failed unexpectedly, please try again later`,
            message: `${error.message}`
        })
    }
})

router.delete('/:cid/products/:pid', async(req,res)=>{
    const {cid, pid} = req.params;

    if(!isValidObjectId(cid)){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({error:`The ID# provided is not an accepted Id Format in MONGODB database. Please verify your ID# and try again`})
    }

    if(!isValidObjectId(pid)){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({error:`The Product ID# provided is not an accepted Id Format in MONGODB database. Please verify your Product ID# and try again`})
    }

    // faltan validaciones -- is product in cart ? is cart valid,? is product valid?

    try {
        let deletedProductInCart = await cartManager.deleteProductInCart(cid,pid)
        console.log(deletedProductInCart)
        res.setHeader('Content-type', 'application/json');
        return res.status(200).json({
            payload:deletedProductInCart
        })
    } catch (error) {
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            error:`Error 500 Server failed unexpectedly, please try again later`,
            message: `${error.message}`
        })
    }






})
