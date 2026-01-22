// main.js

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof io === "undefined") {
    console.error("No se encontró socket.io");
    return;
  }

  const socket = io({
    auth: {
      uid: localStorage.getItem("userId")
    }
  });


  // —– 2) UID del usuario —–
  const myUid = localStorage.getItem("userId");
  if (!myUid) {
    console.error("No hay userId en localStorage");
    return;
  }


  // —– 3) Referencias al DOM —–
  const sectionChats = document.querySelector(".chats");
  const ulMsgs      = document.querySelector(".messages");
  const form        = document.querySelector(".form");
  const input       = form?.querySelector(".input");


  if (!sectionChats || !ulMsgs || !form || !input) {
    console.error("Faltan elementos .chats, .messages, .form o .input");
    return;
  }

  let currentChat     = null;
  let currentRoomId   = null;  // TRACK de la sala actual

  // —– 4) Carga y render de contactos —–
  async function loadContacts() {
    try {
      const res      = await fetch(`/api/getContacts?uid=${encodeURIComponent(myUid)}`);
      const contacts = await res.json();
      sectionChats.innerHTML = "";
      contacts.forEach(c => {
        const div = document.createElement("div");
        div.classList.add("chat-item");
        div.dataset.uid = c.contact_uid;
        div.innerHTML = `
          <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.contact_name)}&background=random" alt="Avatar">
          <div class="preview-info">
            <span class="contact-name"><b>${c.contact_name}</b></span>
          </div>
        `;
        sectionChats.append(div);
      });
    } catch (err) {
      console.error("Error cargando contactos:", err);
    }
  }

  //Delegación de clicks
  sectionChats.addEventListener("click", e => {
    const chatItem = e.target.closest(".chat-item");
    if(!chatItem) return;
    //console.log(chatItem)

    showHeader(chatItem);
    activateChat(chatItem);
  });


  async function activateChat(chatItem) {
    chat_on.style.display = "grid";
    const contactUid = chatItem.dataset.uid;
    //console.log(" Activando chat con:", contactUid);

    const roomId = normalizePair(myUid, contactUid);

    if (roomId === currentRoomId) return;

    if (currentRoomId) {
      socket.emit("leaveChat", { roomId: currentRoomId });
      socket.emit("disconnectRoom", { roomId: currentRoomId });
    }

    socket.emit("joinChat", {
      user1: myUid,
      user2: contactUid
    });
    currentRoomId = roomId;

    //Marca visual
    sectionChats.querySelectorAll(".chat-item").forEach(el => el.classList.remove("active"));
    chatItem.classList.add("active");

    //Limpiar mensajes e historial
    ulMsgs.innerHTML = "";
    currentChat = { myUid, contactUid };

    if(mobileScreen){
      sectionChats.style.display = "none";
      hiddenChats = true
      chat_on.classList.remove("chat-on-hidden")
      chat_on.style.position = "absolute";
      chat_on.style.left = "-19%";

      const sidebar = document.querySelector(".sidebar");
      sidebar.style.display = "none";
      chat_on.style.overflow = "hidden";

    }

    //cargar historial
    try {
      const res  = await fetch(
        `/api/getMessages?user1=${encodeURIComponent(myUid)}&user2=${encodeURIComponent(contactUid)}`
      );
      const msgs = await res.json();
      //console.log("Historial para", roomId, msgs);
      msgs.forEach(renderMessage);
    } catch (err) {
      console.error("Error al cargar mensajes:", err);
    }
  }

  //send messages
  form.addEventListener("submit", e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || !currentChat) return;

    const payload = {
      from:    myUid,
      to:      currentChat.contactUid,
      content: text
    };

    socket.emit("sendMessage", payload);

    const myMsg = {
      emisor_id: myUid,
      destinatary_id: currentChat.contactUid,
      content: text,
      timestamp: new Date().toISOString().slice(0,19).replace("T"," "),
      emisor_name: localStorage.getItem("userName")
    }
    renderMessage(myMsg);

    updateLastMessageInContactList(myMsg);


    input.value = "";
  });



  //Recepcion de mensajes
  socket.on("newMessage", msg => {
    if (!currentChat) return;
    const roomId = normalizePair(msg.emisor_id, msg.destinatary_id);
    if (roomId !== currentRoomId) return;
    renderMessage(msg);
    updateLastMessageInContactLis()
  });

  function normalizePair(u1, u2) {
    return u1 < u2
      ? `${u1}_${u2}`
      : `${u2}_${u1}`;
  }

  function escapeHtml(str) {
    return str.replace(/&/g,"&amp;")
              .replace(/</g,"&lt;")
              .replace(/>/g,"&gt;");
  }

  function renderMessage(msg) {
    const li      = document.createElement("li");
    const rawTs   = msg.timestamp.replace(" ", "T");
    const timeStr = new Date(rawTs)
    .toLocaleTimeString("es-CO", { hour12:false, hour:"2-digit", minute:"2-digit" });

    const author  = msg.emisor_name === localStorage.getItem("userName")
      ? (msg.emisor_name)
      : (msg.emisor_name);

    //verify is me

    let isMe = author === localStorage.getItem("userName");

    li.innerHTML = `
    <div class="all-msg ${(isMe)? "my-msg" : "contact-msg"}">
      <div class="first-msg-cont">
        <span class="msg-author ${(isMe)?"hidden-author":""}">${author}</span>
        <span class="msg-text">${escapeHtml(msg.content)}</span> 
      </div>
      <span class="msg-time">${timeStr}</span>
    </div>
    `;
    ulMsgs.appendChild(li);
    msgcn = document.querySelector(".msg_container")

    //auto scroll
    msgcn.scrollTop = ulMsgs.scrollHeight;
  }

  loadContacts();



//modal
const modal = document.querySelector(".modal");
const modal_form = document.querySelector(".modal-form");
const open_modal = document.querySelector(".open-modal");
const modal_input = document.querySelector(".modal-input");


open_modal.addEventListener("click",()=>{
  modal.showModal();
})

modal_form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const myUid = localStorage.getItem("userId");
  const contactUid = modal_input.value.trim();

  if (!myUid || !contactUid) {
    alert("ID inválido");
    return;
  }

  try {
    const res = await fetch(`/api/addContact?from=${myUid}&to=${contactUid}`);
    const data = await res.json();

    if (data.ok) {
      alert("Contacto agregado correctamente");
      await loadContacts();  // recarga contactos automáticamente
    } else {
      alert("❌ Error: " + data.error);
    }
  } catch (err) {
    alert("Error de red al agregar contacto");
    console.error(err);
  }

  modal.close();
  modal_input.value = "";
});


function showHeader(contactItem){
  console.log(contactItem)
  let headerCont = document.querySelector(".chat_header");
  headerCont.innerHTML = ""

  headerCont.innerHTML =
  `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(contactItem.querySelector(".contact-name").textContent)}&background=random" alt="Avatar">
      <div class="header-preview-info">
        <span class="contact-name"><b>${contactItem.querySelector(".contact-name").textContent}</b></span>
      </div>
  `
}


socket.on("updateContactPreview", preview => {
  const contactItem = document.querySelector(`.chat-item[data-uid="${preview.contact_uid}"]`);
  if (!contactItem) return;

  const lastMsgEl = contactItem.querySelector(".last-message");
  if (!lastMsgEl) return;

  lastMsgEl.innerHTML = `<b>${preview.last_sender}:</b> ${escapeHtml(preview.last_message)}`;
});


});











