import { productsModel } from "./models/productsModel.js";

export class ProductManagerMONGO {

    //async getProducts({limit,page,sort,query}){
    async getProducts(query,{limit, pagina, sort}){
        
        return await productsModel.paginate(query,{
            page:pagina,
            limit,
            sort,
            lean:true
        })
        //return await productsModel.find().lean()
        // return await productsModel.paginate(
        //     {
        //         stock:query.stock,
        //         category:query.category
                
        //     },
        //     {
        //         page:pagina,
        //         limit,
        //         sort,
        //         lean:true
        //     }
        // )
        //return await productsModel.paginate({},{limit,page, lean:true}).find({sort,query})
        //return await productsModel.paginate({query},{limit,page, lean:true}).find({sort,query})
    }

    async getProductById(id){   
        return await productsModel.findById(id).lean()
    }
f
    async getProductByFilter(propFilter){
        return await productsModel.findOne(propFilter).lean()
    }

    async addProduct(productObj){              
        return await productsModel.create(productObj)
    }

    async updateProduct(id, propsToUpdate){
        return await productsModel.findByIdAndUpdate(id, propsToUpdate,{runValidators:true, returnDocument:'after'})
    }

    async deleteProduct(id){
        return await productsModel.findByIdAndDelete(id)
    }
}