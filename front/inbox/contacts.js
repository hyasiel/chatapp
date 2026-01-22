
// contacts.js

const myUid = localStorage.getItem("userId");


async function getContacts() {
  if (!myUid) return console.error("No hay userId en localStorage");

  try {
    const res = await fetch(`/api/getContacts?uid=${encodeURIComponent(myUid)}`);
    const contacts = await res.json();
    console.log(contacts)
    renderContacts(contacts);

  } catch (err) {
    console.error("Error cargando contactos:", err);
  }
}

function renderContacts(contacts) {
  const section = document.querySelector(".chats");
  section.innerHTML = ""; // limpia previos

  contacts.forEach(contact => {
    const div = document.createElement("div");
    div.classList.add("chat-item");
    div.dataset.uid = contact.contact_uid;

    function escapeHtml(str) {
      return str.replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;");
    }

    const sender = contact.last_sender ? `${escapeHtml(contact.last_sender)}: ` : "";
    const lastMessage = contact.last_message ? escapeHtml(contact.last_message) : " ";

    div.innerHTML = `
      <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(contact.contact_name)}&background=random" alt="Avatar">
      <div class="preview-info">
        <span class="contact-name"><b>${contact.contact_name}</b></span>
        <span class="last-message">${sender}${lastMessage}</span>
      </div>
    `;

    section.append(div);
  });
}



function updateLastMessageInContactList(msg) {
  const contactUid = msg.emisor_id === myUid ? msg.destinatary_id : msg.emisor_id;

  const chatItem = document.querySelector(`.chat-item[data-uid="${contactUid}"]`);
  if (!chatItem) return;

  const lastMsgSpan = chatItem.querySelector(".last-message");
  if (!lastMsgSpan) return;

  const isMe = msg.emisor_id === myUid;
  const previewText = isMe ? `Yo: ${msg.content}` : `${msg.emisor_name}: ${msg.content}`;
  
  lastMsgSpan.textContent = previewText;
}


// Al cargar la página
document.addEventListener("DOMContentLoaded", getContacts);
