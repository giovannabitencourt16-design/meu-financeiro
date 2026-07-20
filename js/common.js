import { auth,onAuthStateChanged,signOut } from "./firebase.js";
export const money=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export const monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
export const dateBR=s=>s?s.split("-").reverse().join("/"):"—";
export const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
export const escapeHtml=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
export const billStatus=b=>b.status==="paid"?"paid":new Date(`${b.dueDate}T00:00:00`)<new Date(new Date().setHours(0,0,0,0))?"overdue":"pending";
export function toast(m){const e=document.getElementById("toast");if(!e)return;e.textContent=m;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),2500)}
export function protect(cb){
 document.querySelectorAll("[data-page]").forEach(a=>{if(a.dataset.page===document.body.dataset.page)a.classList.add("active")});
 menuButton?.addEventListener("click",()=>sidebar.classList.toggle("open"));
 logoutButton?.addEventListener("click",async()=>{await signOut(auth);location.href="../index.html"});
 onAuthStateChanged(auth,async u=>{if(!u){location.href="../index.html";return}const n=u.displayName||"Usuário";userName.textContent=n;userEmail.textContent=u.email||"";userInitial.textContent=n[0]?.toUpperCase()||"U";await cb(u)});
}