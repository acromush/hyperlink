document.addEventListener("DOMContentLoaded", () => {

  const openBtn = document.getElementById("openProfile");
  const sidebar = document.getElementById("profileSidebar");
  const overlay = document.getElementById("overlay");

  const fileInput = document.getElementById("fileInput");
  const profileImage = document.getElementById("profileImage");
  const changeBtn = document.getElementById("changePic");
  const removeBtn = document.getElementById("removePic");

  const cropModal = document.getElementById("cropModal");
  const cropImg = document.getElementById("cropImage");
  const uploadBtn = document.getElementById("uploadCropped");

  let cropper;

  // OPEN SIDEBAR
  openBtn.onclick = () => {
    sidebar.classList.add("active");
    overlay.classList.add("active");
  };

  overlay.onclick = () => {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  };

    // UPLOAD
// uploadBtn.addEventListener("click", async () => {

//   console.log("Upload clicked");
//   console.log("Cropper:", cropper);

//   if (!cropper) {
//     console.error("Cropper not initialized");
//     return;
//   }

//   const canvas = cropper.getCroppedCanvas({
//     width: 400,
//     height: 400,
//   });

//   canvas.toBlob(async (blob) => {
//     if (!blob) {
//       console.error("Blob creation failed");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("profilePic", blob);

//     const res = await fetch("/profile/upload-pic", {
//       method: "POST",
//       body: formData,
//     });

//     const data = await res.json();
//     profileImage.src = data.path;

//     cropper.destroy();
//     cropModal.style.display = "none";
//   });
// });

uploadBtn.addEventListener("click", () => {
  console.log("Upload clicked");
});


  // CHANGE PIC
  changeBtn.onclick = () => {
    fileInput.click();
  };

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
reader.onload = () => {
  cropImg.src = reader.result;
  cropModal.style.display = "flex";

  cropImg.onload = () => {
    cropper = new Cropper(cropImg, {
      aspectRatio: 1,
      viewMode: 1,
    });
  };
};

    reader.readAsDataURL(file);
  };
});
