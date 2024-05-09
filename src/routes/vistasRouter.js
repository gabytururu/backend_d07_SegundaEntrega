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
    let {pagina, limit, sort, query}=req.query
    if(!pagina) pagina=1
    

    try{
        let {docs:products,page,totalPages, hasPrevPage, hasNextPage, prevPage,nextPage} = await productManager.getProducts({page:pagina,limit,sort,query})
        console.log({
            docs:products,
            page,
            totalPages, 
            hasPrevPage, 
            hasNextPage, 
            prevPage,
            nextPage}
        )
        console.log({products,page,totalPages, hasPrevPage, hasNextPage, prevPage,nextPage})
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
    let {pid} = req.params
   
    try{
        let matchingProduct = await productManager.getProductByFilter({_id:pid})
        res.setHeader('Content-type', 'text/html');
        return res.status(200).render('singleProduct',{matchingProduct})
    }catch(error){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({
            error:`Error inesperado en servidor - intenta mas tarde`,
            message: `${error.message}`
        })
    }
    
})

router.get('/carts',async(req,res)=>{
    try{
        let carts = await cartManager.getCarts()
        res.setHeader('Content-type', 'text/html')
        console.log(carts)
        console.log(JSON.stringify(carts, null, 2))
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
    let {cid} = req.params
   
    try{
       // let matchingCart = await cartManager.getCartByFilter({_id:cid})
        let matchingCart = await cartManager.getCartById(cid)
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

