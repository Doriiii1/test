const API = "http://localhost:3000/api";
const token = localStorage.getItem("token");

/* ================= CHANGE PASSWORD ================= */

async function changePassword(){

    const oldPassword =
        document.getElementById("oldPass").value;

    const newPassword =
        document.getElementById("newPass").value;

    const res = await fetch(API+"/auth/change-password",{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            Authorization:"Bearer "+token
        },
        body:JSON.stringify({
            oldPassword,
            newPassword
        })
    });

    const data = await res.json();

    if(res.ok){
        alert("Password changed successfully");
    }else{
        alert(data.message || "Error");
    }
}
document
.getElementById("mfaToggle")
.addEventListener("change", async function(){

    await fetch(API+"/mfa/toggle",{
        method:"POST",
        headers:{
            Authorization:"Bearer "+token
        }
    });

    alert("MFA updated");
});