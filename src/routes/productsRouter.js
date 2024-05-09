import { Router } from 'express';
import { ProductManagerMONGO as ProductManager } from '../dao/productManagerMONGO.js';
import { isValidObjectId } from 'mongoose';
export const router=Router();

const productManager = new ProductManager()

router.get('/',async(req,res)=>{
    let {pagina, limit, sort, ...query}=req.query;

    if (!pagina) pagina=1;
    if (!limit) limit=10;
    if (sort) sort= {price:sort};
    if (query.category) query.category = query.category;
    if (query.stock === "disponible") query.stock = { $gt: 0 };
   
    try{
        let {docs,totalPages,prevPage,nextPage,page,hasPrevPage,hasNextPage }= await productManager.getProducts(query,{pagina, limit, sort});
        res.setHeader('Content-type', 'application/json');
        return res.status(200).json({
            status: 'success',
            payload:docs,
            totalPages,
            prevPage,
            nextPage,
            page,
            hasPrevPage,
            hasNextPage,
            prevLink: hasPrevPage ? `localhost:8080/api/products?pagina=${prevPage}` : 'No previous page available',
            nextLink: hasNextPage ? `localhost:8080/api/products?pagina=${nextPage}` : 'No next page available'
        });
    }catch(error){
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            status: 'Error',
            error:`Unexpected server error (500) - try again or contact support`,
            message: error.message
        })
    }
    
})

router.get('/:id',async(req,res)=>{
    let id = req.params.id
    if(!isValidObjectId(id)){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({error:`The ID# provided is not an accepted Id Format in MONGODB database. Please verify your ID# and try again`})
    }

    try{
        let matchingProduct = await productManager.getProductByFilter({_id:id})
        res.setHeader('Content-type', 'application/json');
        return res.status(200).json({payload: matchingProduct})
    }catch(error){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({
            error:`Error inesperado en servidor - intenta mas tarde`,
            message: `${error.message}`
        })
    }
})

router.post('/', async(req, res)=>{

    const {title, description, code, price, stock,category,thumbnails} = req.body

    let prodToPost = {
        title: title,
        description: description,
        code: code,
        price: price,
        status: true,
        stock: stock,
        category: category || 'tbd',
        thumbnails: thumbnails || 'tbd'
    }

    for(const property in prodToPost){
            if(prodToPost[property] === undefined){
                res.setHeader('Content-type', 'application/json');
                return res.status(400).json({
                    error:`Error 400 - Product was not added - Please try again`,
                    message: `Failed to complete product submition due to missing property: ${property.toUpperCase()}. The following properties are always mandatory: title, description, code, price and stock. Please verify and try again.`
                
                })
            }            
    }  
    
    let duplicateCode;
    try{
        duplicateCode = await productManager.getProductByFilter({code: code})
    }catch(error){
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({error:`Error 500 - Server failed, please try again later`})
    }

    if(duplicateCode){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({
            error:`Error: Product Code already Exist and cannot duplicate`,
            message: `Failed to complete product submition due to duplicate CODE. The code ${code} already exist in our database and cannot be inserted again. Please verify the product code and try again.`
        })
    }

    try{
        let newProduct = await productManager.addProduct(prodToPost)
        res.setHeader('Content-type', 'application/json')
        return res.status(200).json({
            payload: newProduct
        })
    }catch(error){
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({error:`ERROR 500: An Unexpected server error occured when attempting to add your product. Please try again later`})
    }
  
    // if(prodToPost.status === 'SUCCESS'){
    //     req.io.emit("newProduct", prodToPost)
    // }
    
})  

router.put('/:id', async(req,res)=>{
    const {id} = req.params
    let propsToUpdate = req.body

    if(!isValidObjectId(id)){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({error:`The ID# provided is not an accepted Id Format in MONGODB database. Please verify your ID# and try again`})
    }

    if(propsToUpdate._id){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({
            error:`Error 400 - product not updated`,
            message: `Failed to update the product with id#${id} due to invalid argument. The property "_id" cannot be modified. Please verify and try again`
        })
    }

    if(propsToUpdate.code){
        let duplicateCode;
        try {
            duplicateCode = await productManager.getProductByFilter({_id:{$ne:id}, code: propsToUpdate.code})

            if(duplicateCode){
                res.setHeader('Content-type', 'application/json');
                return res.status(400).json({
                    error:`Error 400 - product not updated`,
                    message:`Failed to update product with id#${id} due to invalid argument. The "code" provided already exists in database and cannot be duplicated. Please verify and try again with a different code#`
                })
            }
        } catch (error) {
            res.setHeader('Content-type', 'application/json');
            return res.status(500).json({error:`Error 500 - Server failed, please try again later`})
        }
    }

    try {
        let updatedProduct = await productManager.updateProduct(id,propsToUpdate)
        res.setHeader('Content-type', 'application/json');
        return res.status(200).json({payload:updatedProduct})
    } catch (error) {
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            error:`Error inesperado del servidor (500) intente nuevamente`,
            message:error.message
        })
    }


})

router.delete('/:id', async(req,res)=>{
    const {id} = req.params

    if(!isValidObjectId(id)){
        res.setHeader('Content-type', 'application/json');
        return res.status(400).json({error:`The ID# provided is not an accepted Id Format in MONGODB database. Please verify your ID# and try again`})
    }

    try {
        let deletedProduct = await productManager.deleteProduct(id)
        console.log(deleteResult)
        res.setHeader('Content-type', 'application/json');
        return res.status(200).json({
            payload:deletedProduct
        })
    } catch (error) {
        res.setHeader('Content-type', 'application/json');
        return res.status(500).json({
            error:`Error 500 Server failed unexpectedly, please try again later`,
            message: `${error.message}`
        })
    }
})


// router.get("*",(req,res)=>{
//     res.setHeader('Content-Type','application/json');
//     res.status(404).json({
//         error:`Resource Not Found`,
//         message:`404 - The page you are trying to access does not exist. Please verify and try again.`
//     });
// });

