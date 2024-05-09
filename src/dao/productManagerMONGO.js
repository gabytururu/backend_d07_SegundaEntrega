import { productsModel } from "./models/productsModel.js";

export class ProductManagerMONGO {

    async getProducts(query,{limit, pagina, sort}){ 
        return await productsModel.paginate(query,{
            page:pagina,
            limit,
            sort,
            lean:true
        })
    }

    async getProductById(id){   
        return await productsModel.findById(id).lean()
    }

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