var btnSignin = document.querySelector("#signin");
var btnSignup = document.querySelector("#signup");

var body = document.querySelector("body");


btnSignin.addEventListener("click", function () {
   body.className = "sign-in-js"; 
});

btnSignup.addEventListener("click", function () {
    body.className = "sign-up-js";
})


const form = {
    signEmail: () => document.getElementById('signEmail'),
    signPassword: () => document.getElementById('signPassword'),
    loginEmail: () => document.getElementById('loginEmail'),
    loginPassword: () => document.getElementById('loginPassword')
};

function login() {

    signInWithEmailAndPassword(auth, form.loginEmail().value, form.loginPassword().value)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("Usuário autenticado:", user);
            window.location.href = "hub.html";
        })
        .catch((error) => {
            console.error("Erro de autenticação:", error.code, error.message);
        });
}