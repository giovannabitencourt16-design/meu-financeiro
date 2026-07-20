import { auth,db,doc,setDoc } from "./firebase.js";
import { createUserWithEmailAndPassword,signInWithEmailAndPassword,updateProfile,onAuthStateChanged }
 from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { toast } from "./common.js";
function tab(t){const l=t==="login";loginTab.classList.toggle("active",l);registerTab.classList.toggle("active",!l);loginForm.classList.toggle("hidden",!l);registerForm.classList.toggle("hidden",l)}
loginTab.onclick=()=>tab("login");registerTab.onclick=()=>tab("register");
onAuthStateChanged(auth,u=>{if(u)location.href="pages/dashboard.html"});
loginForm.onsubmit=async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,loginEmail.value.trim(),loginPassword.value)}catch(x){console.error(x);toast("E-mail ou senha incorretos.")}};
registerForm.onsubmit=async e=>{e.preventDefault();try{const n=registerName.value.trim();const c=await createUserWithEmailAndPassword(auth,registerEmail.value.trim(),registerPassword.value);await updateProfile(c.user,{displayName:n});await setDoc(doc(db,"users",c.user.uid),{name:n,email:c.user.email,createdAt:Date.now()});location.href="pages/dashboard.html"}catch(x){console.error(x);toast("Não foi possível criar a conta.")}};