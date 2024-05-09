const addProdToCart=(_id, title)=>{
    console.log(`El código a comprar es ${_id}`)
    Swal.fire({
        text: `El producto ${title} con id#${_id} fue agregado a tu carrito`,
        toast: true,
        position: "center"
    })
}

const checkProductDetails=(_id)=>{
   
    console.log(`ver detalles del producto con id#${_id} `)

    window.location.href = `/products/${_id}`

}

const finalizePurchase = (_id) =>{
    Swal.fire({
        text: `El producto id#${_id} fue agregado al carrito`,
        toast: true,
        position: "center"
    })
    console.log(_id)
}