document.addEventListener("DOMContentLoaded", () => {
  console.log("Profile.js loaded");

  // --- CONFIG ---
  const ELEMENTS = {
    fileInput: document.getElementById("fileInput"),
    changeBtn: document.getElementById("changePic"),
    cropModal: document.getElementById("cropModal"),
    cropImg: document.getElementById("cropImage"),
    uploadBtn: document.getElementById("uploadCropped"),
    profileImage: document.getElementById("profileImage"),
    openBtn: document.getElementById("openProfile"),
    sidebar: document.getElementById("profileSidebar"),
    overlay: document.getElementById("overlay")
  };

  let cropper = null;

  // --- SIDEBAR LOGIC ---
  if(ELEMENTS.openBtn) {
    ELEMENTS.openBtn.onclick = () => {
      ELEMENTS.sidebar.classList.add("active");
      ELEMENTS.overlay.classList.add("active");
    };
    ELEMENTS.overlay.onclick = () => {
      ELEMENTS.sidebar.classList.remove("active");
      ELEMENTS.overlay.classList.remove("active");
    };
  }

  // --- TRIGGER SELECT ---
  if (ELEMENTS.changeBtn) {
    ELEMENTS.changeBtn.onclick = () => ELEMENTS.fileInput.click();
  }

  // --- MAIN LOGIC ---
  if (ELEMENTS.fileInput) {
    ELEMENTS.fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      
      reader.onload = (event) => {
        // 1. CLEANUP
        if (cropper) {
          cropper.destroy();
          cropper = null;
        }

        // 2. SETUP IMAGE
        ELEMENTS.cropImg.src = event.target.result;
        ELEMENTS.cropModal.style.display = "flex";

        // 3. WAIT FOR LIBRARY + IMAGE LOAD
        const startCropper = () => {
          // Check if library exists
          if (typeof Cropper === 'undefined') {
            console.warn("CropperJS not loaded yet... retrying in 50ms");
            setTimeout(startCropper, 50);
            return;
          }

          // Initialize
          try {
            cropper = new Cropper(ELEMENTS.cropImg, {
              aspectRatio: 1,
              viewMode: 1,
              autoCropArea: 1,
            });
            console.log("Cropper started successfully!");
          } catch (err) {
            console.error(err);
            alert("Cropper crashed: " + err.message);
          }
        };

        // Give the modal 100ms to render on screen before starting
        setTimeout(startCropper, 100);
      };

      reader.readAsDataURL(file);
    };
  }

  // --- UPLOAD ---
  if (ELEMENTS.uploadBtn) {
    ELEMENTS.uploadBtn.onclick = () => {
      if (!cropper) {
        alert("Crop failed to start. Please reload the page.");
        return;
      }

      const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 });
      if(!canvas) return alert("Canvas creation failed");

      canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append("profilePic", blob, "profile.png");

        // UI Feedback
        ELEMENTS.uploadBtn.innerText = "Uploading...";
        ELEMENTS.uploadBtn.disabled = true;

        fetch("/profile/upload-pic", {
          method: "POST",
          body: formData,
        })
        .then(res => res.json())
        .then(data => {
            // Update All Images
            document.querySelectorAll("img").forEach(img => {
                if(img.src === ELEMENTS.profileImage.src) img.src = data.path;
            });
            ELEMENTS.profileImage.src = data.path;
            
            // Close
            cropper.destroy();
            cropper = null;
            ELEMENTS.cropModal.style.display = "none";
            ELEMENTS.fileInput.value = "";
        })
        .catch(err => alert("Upload error"))
        .finally(() => {
            ELEMENTS.uploadBtn.innerText = "Upload";
            ELEMENTS.uploadBtn.disabled = false;
        });
      }, "image/png");
    };
  }
});