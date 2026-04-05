/* ================= CHANGE PASSWORD ================= */

async function changePassword(){
    const oldPassword = document.getElementById("oldPass").value;
    const newPassword = document.getElementById("newPass").value;

    try {
        // fetchAPI sẽ tự động lo URL, Token và lỗi 401
        await fetchAPI("/auth/change-password", {
            method: "POST",
            body: JSON.stringify({
                oldPassword,
                newPassword
            })
        });

        alert("Password changed successfully");
        
        // (Tùy chọn) Xóa trắng ô nhập liệu sau khi đổi thành công
        document.getElementById("oldPass").value = "";
        document.getElementById("newPass").value = "";
    } catch (error) {
        // fetchAPI ném lỗi nếu !response.ok hoặc !data.success
        alert(error.message || "Lỗi khi đổi mật khẩu");
    }
}

document.getElementById("mfaToggle").addEventListener("change", async function() {
    try {
        await fetchAPI("/mfa/toggle", {
        method: "POST"
    });

        alert("MFA updated");
    } catch (error) {
        alert(error.message || "Lỗi khi cập nhật MFA");

        // Hoàn tác lại trạng thái của nút toggle nếu API bị lỗi
        this.checked = !this.checked; 
    }
});