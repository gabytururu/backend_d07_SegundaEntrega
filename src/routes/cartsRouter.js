import { Router } from 'express';
import { CartManagerMONGO as CartManager } from '../dao/cartManagerMONGO.js';
import { ProductManagerMONGO as ProductManager } from '../dao/productManagerMONGO.js';
import { isValidObjectId } from 'mongoose';
export const router=Router();

const cartManager = new CartManager()
const productManager = new ProductManager()

router.get('/',async(req,res)=>{
    res.setHeader('Content-type', 'application/json');

    try{
        const carts = await cartManager.getCarts() 
        if(!carts){
            return res.status(404).json({
                error: `ERROR: resource not found`,
                message: `No carts were found in our database, please try again later`
            })
        }             
        res.status(200).json({payload:carts})
    }catch(error){
        return res.status(500).json({
            error:`Unexpected server error - try again or contact support`,
            message: error.message
        })
    }
})

router.get('/:cid', async(req,res)=>{
    const {cid}=req.params
    res.setHeader('Content-type', 'application/json');

    if(!isValidObjectId(cid)){
        return res.status(400).json({error:`The Cart ID# provided is not an accepted Id Format in MONGODB database. Please verify your Cart ID# and try again`})
    }

    try {
        const matchingCart = await cartManager.getCartById(cid) 
        if(!matchingCart){
            return res.status(404).json({
                error: `ERROR: Cart id# provided was not found`,
                message: `Resource not found: The Cart id provided (id#${cid}) does not exist in our database. Please verify and try again`
            })
        }        
        return res.status(200).json({payload: matchingCart})
    } catch (error) {
        return res.status(500).json({
            error:`Unexpected server error - try again or contact support`,
            message: error.message
        })
    }

})

router.post('/', async(req,res)=>{
    res.setHeader('Content-type', 'application/json')
    try {
        const newCart = await cartManager.createCart()
        if(!newCart){
            return res.status(404).json({
                error: `ERROR: resource not found - new cart not posted`,
                message: `Resource not found: the new cart could not be created. Please try again`
            })
        }
        return res.status(200).json({
            newCart
        })
    } catch (error) {
        return res.status(500).json({
            error:`Unexpected server error (500) - try again or contact support`,
            message: error.message
        })
    }
})

router.put('/:cid', async(req,res)=>{
    const {cid} = req.params;
    const newCartDetails = req.body
    res.setHeader('Content-type', 'application/json')

    if(!isValidObjectId(cid)){
        return res.status(400).json({error:`The Cart ID# provided is not an accepted Id Format in MONGODB database. Please verify your Cart ID# and try again`})
    }


    try{
        const cartIsValid = await cartManager.getCartById(cid)
        if(!cartIsValid){
            return res.status(404).json({
                error: `ERROR: Cart id# provided was not found`,
                message: `Failed to replace the content in cart due to invalid argument: The Cart id provided (id#${cid}) does not exist in our database. Please verify and try again`
            })
        }
    }catch(error){
        return res.status(500).json({
            error:`Unexpected server error (500) - try again or contact support`,
            message: error.message
        })
    }
   

    //note:not sure if needed anymore due to regex validation(test more & decide)
    if (typeof newCartDetails !== 'object'){
        return res.status(400).json({
            error: 'Invalid format in request body',
            message: `Failed to replace the content in the cart id#${cid} due to invalid format request. Please make sure the products you submit are in a valid JSON format.`
        });
    }
    
    //note:not sure if needed due to regex validation(test more & decide)
    if (Object.keys(newCartDetails).length === 0) {
        return res.status(400).json({
            error: 'Empty request body',
            message: `Failed to replace the content in the cart id#${cid} due to incomplete request. Please submit the products you want to push to replace the cart content.`
        });
    }
    
    const newCartDetailsString = JSON.stringify(newCartDetails)
    const regexValidFormat = /^\[\{.*\}\]$/;
    if(!regexValidFormat.test(newCartDetailsString)){
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

    const pidArray = newCartDetails.map(cart=>cart.pid)
    try{
        for(const pid of pidArray){
            const pidIsValid = await productManager.getProductById(pid)
            if(!pidIsValid){
                return res.status(404).json({
                    error: `ERROR: Cart could not be replaced`,
                    message: `Failed to replace the content in cart id#${cid}. Product id#${pid} was not found in our database. Please verify and try again`
                })
            }
        }  
    }catch(error){
        return res.status(500).json({
            error:`Unexpected server error (500) - try again or contact support`,
            message: error.message
        })
    }
 
    
    try{
        const cartEditDetails = await cartManager.replaceCart(cid,newCartDetails)
        if(!cartEditDetails){
            return res.status(404).json({
                error: `ERROR: Cart id# could not be replaced`,
                message: `Failed to replace the content in cart id#${cid}. Please verify and try again`
            })
        }
        return res.status(200).json({
            cartEditDetails
        })
    }catch(error){  
        return res.status(500).json({
            error:`Unexpected server error (500) - try again or contact support`,
            message: error.message
        })
    }
})

router.put('/:cid/products/:pid', async(req,res)=>{
    const {cid, pid} = req.params
    const {qty} = req.body
    res.setHeader('Content-type', 'application/json');
    
    if(!isValidObjectId(cid)){
        return res.status(400).json({error:`The Cart ID# provided is not an accepted Id Format in MONGODB database. Please verify your Cart ID# and try again`})
    }

    if(!isValidObjectId(pid)){
        return res.status(400).json({error:`The Product ID# provided is not an accepted Id Format in MONGODB database. Please verify your Product ID# and try again`})
    }

    // future improvement: see if can improve/simplify UX logic (eg. allow for null OR [] OR {} to result in +1 instead of error)
    const regexValidBodyFormat = /^\{.*\}$/
    const fullBody = JSON.stringify(req.body)
    if(!regexValidBodyFormat.test(fullBody)){    
        return res.status(400).json({
            error: 'Invalid format in request body',
            message:  `Failed to increase requested qty of product id#${pid} in cart id#${cid} due to invalid format request. Quantities can only be increased by notifying the quantity to add, through a valid JSON format (Alike simple object: {"qty":x} ). If you leave the body empty or send an empty object (eg. {}) the quantity will be added by 1 (+1). Any other body structure results in request failure.`
        })
    }

    try{
        const productIsValid = await productManager.getProductById(pid)
        if(!productIsValid){
            return res.status(400).json({
                error: `ERROR: Product id# provided is not valid`,
                message: `Failed to update cart with Id#${cid} due to invalid argument: The product id provided (id#${pid}) does not exist in our database. Please verify and try again`
            })
        }
        const cartIsValid = await cartManager.getCartById(cid)
        if(!cartIsValid){
            return res.status(400).json({
                error: `ERROR: Cart id# provided is not valid`,
                message: `Failed to update cart due to invalid argument: The Cart id provided (id#${cid}) does not exist in our database. Please verify and try again`
            })
        }
    }catch(error){
        return res.status(500).json({
            error:`Error 500 Server failed unexpectedly, please try again later`,
            message: `${error.message}`
        })
    }
    
    try{
        const productAlreadyInCart = await cartManager.findProductInCart(cid,pid) 
        if(productAlreadyInCart){
            try{
                const updatedCart = await cartManager.updateProductInCartQuantity(cid,pid,qty)
                if(!updatedCart){
                    return res.status(404).json({
                        error: `ERROR: Failed to update the intended product quantity in cart`,
                        message: `Failed to update quantity of product id#${pid} in cart id#${cid} Please verify and try again`
                    })
                }
                return res.status(200).json({ updatedCart });
            }catch(error){
                return res.status(500).json({
                    error:`Error 500 Server failed unexpectedly, please try again later`,
                    message: `${error.message}`
                })
            }
        }
    }catch(error){
        return res.status(500).json({
            error:`Error 500 Server failed unexpectedly, please try again later`,
            message: `${error.message}`
        })
    }
   

    //future improvement - seek for better method (change +1 for +N even on first iteration if desired)
    try{
        const updatedCart = await cartManager.updateCart(cid,pid)
        if(!updatedCart){
            return res.status(404).json({
                error: `ERROR: Failed to update the intended product in cart`,
                message: `Failed to increase quantity of product id#${pid} in cart id#${cid} Please verify and try again`
            })
        }
        return res.status(200).json({
            updatedCart
        })   
    }catch(error){
        return res.status(500).json({
            error:`Error 500 Server failed unexpectedly, please try again later`,
            message: `${error.message}`
        })
    }
})

router.delete('/:cid', async(req,res)=>{
    const {cid} = req.params
    res.setHeader('Content-type', 'application/json');

    if(!isValidObjectId(cid)){       
        return res.status(400).json({error:`The ID# provided is not an accepted Id Format in MONGODB database. Please verify your ID# and try again`})
    }

    try {
        const deletedCart = await cartManager.deleteCart(cid)
        if(!deletedCart){
            return res.status(404).json({
                error: `ERROR: Cart id# provided was not found`,
                message: `Failed to delete cart id#${cid} as it was not found in our database, Please verify and try again`
            })
        }       
        return res.status(200).json({
            payload:deletedCart
        })
    } catch (error) {
        return res.status(500).json({
            error:`Error 500 Server failed unexpectedly, please try again later`,
            message: `${error.message}`
        })
    }
})

router.delete('/:cid/products/:pid', async(req,res)=>{
    const {cid, pid} = req.params;
    res.setHeader('Content-type', 'application/json');

    if(!isValidObjectId(cid)){
        return res.status(400).json({error:`The Cart ID# provided is not an accepted Id Format in MONGODB database. Please verify your Cart ID# and try again`})
    }

    if(!isValidObjectId(pid)){
        return res.status(400).json({error:`The Product ID# provided is not an accepted Id Format in MONGODB database. Please verify your Product ID# and try again`})
    }

    try{
        const isProductIdValid = await productManager.getProductById(pid)
        if(!isProductIdValid){
            return res.status(404).json({
                error: `ERROR: Product id# provided was not found`,
                message: `Failed to delete product id#${pid} in cart. This product id was not found in our database, Please verify and try again`
            })
        }

        const isCartIdValid = await cartManager.getCartById(cid)
        if(!isCartIdValid){
            return res.status(404).json({
                error: `ERROR: Cart id# provided was not found`,
                message: `Failed to delete intended products in cart id#${cid}. The cart id# provided was not found in our database, Please verify and try again`
            })
        }

        const isProductInCart = await cartManager.findProductInCart(cid,pid)
        if(!isProductInCart){
            return res.status(404).json({
                error: `ERROR: Product id# was not found in this cartid#`,
                message: `Failed to delete product id#${pid} in cart id#${cid}. The product id# provided was not found in the selected cart, Please verify and try again`
            })
        }
    }catch(error){
        return res.status(500).json({
            error:`Error 500 Server failed unexpectedly, please try again later`,
            message: `${error.message}`
        })
    }

    try {
        const deletedProductInCart = await cartManager.deleteProductInCart(cid,pid)
        if(!deletedProductInCart){
            return res.status(404).json({
                error: `ERROR: Failed to delete product in cart`,
                message: `Could not delete product id#${pid} in cart id#${cid}, Please verify and try again`
            })
        }
        return res.status(200).json({
            payload:deletedProductInCart
        })
    } catch (error) {
        return res.status(500).json({
            error:`Error 500 Server failed unexpectedly, please try again later`,
            message: `${error.message}`
        })
    }
})

