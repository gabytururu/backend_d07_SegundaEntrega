import { cartsModel } from "./models/cartsModel.js";

export class CartManagerMONGO{
  
    async getCarts(){
        return await cartsModel.find().populate("products.pid").lean()
    }

    async createCart(){
        let cart = (await cartsModel.create({}))  
        return cart 
    }   

    async getCartById(id){
        return await cartsModel.findById(id).populate("products.pid").lean()
    }

    async getCartByFilter(propFilter={}){
        return await cartsModel.findOne(propFilter).populate("products.pid").lean()
    }

    async findProductInCart(cid,pid){
        return await cartsModel.findOne({ _id: cid, "products.pid": pid }).lean()
        
    }

    async updateProductInCartQuantity(cid,pid,qty=1){
        return await cartsModel.findOneAndUpdate(
            {_id:cid, "products.pid":pid},
            {$inc:{"products.$.qty":qty}},
            {runValidators:true,returnDocument:'after'}
        )
        
    }

    async updateCart(cid,pid){
        return await cartsModel.findByIdAndUpdate(
            cid,
            {$push:{products:{pid}}},
            {runValidators:true, returnDocument:'after'}
        )
       
    }

    async replaceCart(cid,newCartDetails){
        return await cartsModel.findByIdAndUpdate(
            cid,
            {$set:{products:newCartDetails}},
            {runValidators:true, returnDocument:'after'}
        )
    }

    async deleteCart(cid){
        return await cartsModel.findByIdAndUpdate(
            cid,
            {$pull:{products:{}}}, 
            {runValidators:true, returnDocument:'after'}
        )
    }

    async deleteProductInCart(cid,pid){
        return await cartsModel.findByIdAndUpdate(
            cid,
            {$pull:{products:{pid}}}, 
            {runValidators:true, returnDocument:'after'}
        )
    }
}
 