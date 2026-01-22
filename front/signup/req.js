let username = document.querySelector('.usr_name');
let password = document.querySelector('.usr_pwd');

document.querySelector(".btn").addEventListener("click",(e)=>{
    e.preventDefault();

    if(username.value.trim() === "" || password.value.trim() === ""){
        alert("es necesario ingresar un nombre y contraseña")
        return;
    }

    fetch("http://192.168.1.7:3000/createNewUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.value.trim(), password: password.value.trim()})
    })
    .then(res=>res.json())
    .then(data=>{
        
        if (data.success){
            window.location.href = "/login"
        } else {
            alert("ha ocurrido un error al crear el usuario")
        }

    })
    .catch(err=>{console.log(err)})



});

