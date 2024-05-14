import { Router } from 'express';
import { ProductManagerMONGO as ProductManager } from '../dao/productManagerMONGO.js';
import { CartManagerMONGO as CartManager } from '../dao/cartManagerMONGO.js';
export const router=Router();

const productManager = new ProductManager();
const cartManager = new CartManager();

router.get('/',async(req,res)=>{
    
    try{ 
        res.setHeader('Content-type', 'text/html');
        res.status(200).render('home')
    }catch(error){
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            error:`Unexpected server error (500) - try again or contact support`,
            message: error.message
        })
    }
})

router.get('/products',async(req,res)=>{
    let {pagina, limit, sort, ...query}=req.query

    if (!pagina) pagina=1;
    if (!limit) limit=10;
    if (sort) sort= {price:sort};
    if (query.category) query.category = query.category;
    if (query.stock === "disponible") query.stock = { $gt: 0 };


    try{
        const {docs:products,page,totalPages, hasPrevPage, hasNextPage, prevPage,nextPage} = await productManager.getProducts(query,{pagina,limit,sort})
        res.setHeader('Content-type', 'text/html');
        res.status(200).render('products',{
            products,
            page,
            totalPages, 
            hasPrevPage, 
            hasNextPage, 
            prevPage,
            nextPage
        })
    }catch(error){
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            error:`Unexpected server error (500) - try again or contact support`,
            message: error.message
        })
    }
})

router.get('/products/:pid',async(req,res)=>{
    const {pid} = req.params
   
    try{
        const matchingProduct = await productManager.getProductByFilter({_id:pid})
        if(!matchingProduct){
            res.setHeader('Content-type', 'application/json');
            return res.status(404).json({
                error: `Product with ID#${id} was not found in our database. Please verify your ID# and try again`
            })
        }
        res.setHeader('Content-type', 'text/html');
        return res.status(200).render('singleProduct',{matchingProduct})
    }catch(error){
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            error:`Unexpected server error (500) - try again or contact support`,
            message: `${error.message}`
        })
    }
})

router.get('/carts',async(req,res)=>{
    try{
        const carts = await cartManager.getCarts()
        if(!carts){
            return res.status(404).json({
                error: `ERROR: resource not found`,
                message: `No carts were found in our database, please try again later`
            })
        }       
        res.setHeader('Content-type', 'text/html')
        return res.status(200).render('carts',{carts})
    }catch(error){
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            error:`Unexpected server error (500) - try again or contact support`,
            message: error.message
        })
    }
    
})

router.get('/carts/:cid',async(req,res)=>{
    const {cid} = req.params
   
    try{
        const matchingCart = await cartManager.getCartById(cid)
        if(!matchingCart){
            return res.status(404).json({
                error: `ERROR: Cart id# provided was not found`,
                message: `Resource not found: The Cart id provided (id#${cid}) does not exist in our database. Please verify and try again`
            })
        }     
        res.setHeader('Content-type', 'text/html');
        return res.status(200).render('singleCart',{matchingCart})
    }catch(error){
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            error:`Error inesperado en servidor - intenta mas tarde`,
            message: `${error.message}`
        })
    }
})

router.get('/chat',async(req,res)=>{
    res.status(200).render('chat')
})

