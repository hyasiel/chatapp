const chat_on = document.querySelector(".chat-on");
const mediaQuery = window.matchMedia("(max-width:700px)");
let mobileScreen = false;
let hiddenChats = false
const sectionChats = document.querySelector(".chats")
const sidebar = document.querySelector(".sidebar");


function handleChange(e){
    if (e.matches){
        chat_on.classList.add("chat-on-hidden");
        mobileScreen = true
    } else {
        chat_on.classList.remove("chat-on-hidden")
        mobileScreen = false
        if(hiddenChats){
            sectionChats.style.display = "flex";
            hiddenChats = false
        }
    }
}



handleChange(mediaQuery)

mediaQuery.addEventListener("change", handleChange);




//salir del chat

const back = document.querySelector(".back");

back.addEventListener("click",(e)=>{
    sectionChats.style.display = "flex";
    chat_on.style.display = "none";
    sidebar.style.display = "flex"

})