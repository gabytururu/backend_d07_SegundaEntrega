import { Router } from 'express';
import { ProductManagerMONGO as ProductManager } from '../dao/productManagerMONGO.js';
import { isValidObjectId } from 'mongoose';
export const router=Router();

const productManager = new ProductManager()

router.get('/',async(req,res)=>{
    let {pagina, limit, sort, ...query}=req.query; 
    res.setHeader('Content-type', 'application/json');

    if (!pagina) pagina=1;
    if (!limit) limit=10;
    if (sort) sort= {price:sort};
    if (query.category) query.category = query.category;
    if (query.stock === "disponible") query.stock = { $gt: 0 };
   
    try{ 
        const {docs,totalPages,prevPage,nextPage,page,hasPrevPage,hasNextPage}= await productManager.getProducts(query,{pagina, limit, sort});
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
        return res.status(500).json({
            status: 'Error',
            error:`Unexpected server error - try again or contact support`,
            message: error.message
        })
    }    
})

router.get('/:id',async(req,res)=>{
    const id = req.params.id
    res.setHeader('Content-type', 'application/json');

    if(!isValidObjectId(id)){        
        return res.status(400).json({error:`The ID# provided is not an accepted Id Format in MONGODB database. Please verify your ID# and try again`})
    }

    try{
        const matchingProduct = await productManager.getProductByFilter({_id:id})
        if(!matchingProduct){
            return res.status(404).json({
                error: `Product with ID#${id} was not found in our database. Please verify your ID# and try again`
            })
        }
        return res.status(200).json({payload: matchingProduct})
    }catch(error){
        return res.status(500).json({
            error:`Error 500 - Server failed, please try again later`,
            message: `${error.message}`
        })
    }
})

router.post('/', async(req, res)=>{
    const {title, description, code, price, stock,category,thumbnails} = req.body
    res.setHeader('Content-type', 'application/json');

    const prodToPost = {
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
                return res.status(400).json({
                    error:`Error 400 - Product was not added - Please try again`,
                    message: `Failed to complete product posting due to missing property: ${property.toUpperCase()}. The following properties are always mandatory: title, description, code, price and stock. Please verify and try again.`                
                })
            }            
    }  
    
    try{
        const duplicateCode = await productManager.getProductByFilter({code: code})
        if(duplicateCode){
            return res.status(400).json({
                error:`Error: Product Code already exists and cannot be duplicated`,
                message: `Failed to complete product posting due to duplicate CODE. The code ${code} already exists in our database and cannot be inserted again. Please verify the product code and try again.`
            })
        }
    }catch(error){
        return res.status(500).json({
            error:`Error - Server failed, please try again later`,
            message: error.message
        })
    }

    try{
        const newProduct = await productManager.addProduct(prodToPost)
        return res.status(200).json({
            payload: newProduct
        })
    }catch(error){
        return res.status(500).json({
            error:`Error - Server failed, please try again later`,
            message: error.message
        })
    }    
})  

router.put('/:id', async(req,res)=>{
    const {id} = req.params
    const propsToUpdate = req.body // was let
    res.setHeader('Content-type', 'application/json');

    if(!isValidObjectId(id)){
        return res.status(400).json({error:`The ID# provided is not an accepted Id Format in MONGODB database. Please verify your ID# and try again`})
    }

    try{
        const matchingProduct = await productManager.getProductByFilter({_id:id})
        if(!matchingProduct){
            return res.status(404).json({
                error: `Failed to complete product update: the product you are trying to modify (product with ID#${id}) was not found in our database. Please verify your ID# and try again`,                
            })
        }
    }catch(error){
        return res.status(500).json({
            error:`Error - Server failed, please try again later`,
            message: error.message
        })
    }   
    
    if(propsToUpdate._id){
        return res.status(400).json({
            error:`Error: product not updated`,
            message: `Failed to update the product with id#${id} due to invalid argument. The property "_id" cannot be modified. Please verify and try again`
        })
    }

    if(propsToUpdate.code){
        try {
            const duplicateCode = await productManager.getProductByFilter({_id:{$ne:id}, code: propsToUpdate.code})
            if(duplicateCode){
                return res.status(400).json({
                    error:`Error: product not updated`,
                    message:`Failed to update product with id#${id} due to invalid argument: The "code" provided already exists in database and cannot be duplicated. Please verify and try again with a different code#`
                })
            }
        } catch (error) {
            return res.status(500).json({
                error:`Error - Server failed, please try again later`,
                message: error.message
            })
        }
    }


    try {
        let updatedProduct = await productManager.updateProduct(id,propsToUpdate)
        return res.status(200).json({payload:updatedProduct})
    } catch (error) {
        return res.status(500).json({
            error:`Error - Server failed, please try again later`,
            message:error.message
        })
    }
})

router.delete('/:id', async(req,res)=>{
    const {id} = req.params
    res.setHeader('Content-type', 'application/json');

    if(!isValidObjectId(id)){
        return res.status(400).json({error:`The ID# provided is not an accepted Id Format in MONGODB database. Please verify your ID# and try again`})
    }

    try {
        let deletedProduct = await productManager.deleteProduct(id)
        if(!deletedProduct){
            return res.status(404).json({
                error: `Failed to delete product: the product you are trying to delete (ID#${id}) was not found in our database. Please verify your ID# and try again`,                
            })
        }
        return res.status(200).json({
            payload:deletedProduct
        })
    } catch (error) {
        return res.status(500).json({
            error:`Error 500 Server failed unexpectedly, please try again later`,
            message: `${error.message}`
        })
    }
})

// future: not working - test & resolve
// router.get("*",(req,res)=>{
//     res.status(404).json({
//         error:`Resource Not Found`,
//         message:`The page you are trying to access does not exist. Please verify and try again.`
//     });
// });

