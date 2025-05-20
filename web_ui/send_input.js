import { initPLYViewer } from "./ply_viewer.js";

document.getElementById("form").addEventListener("submit", function(event) {
    event.preventDefault();

    const formData = new FormData();
    const files = document.getElementById("videoInput").files;
    for (let i = 0; i < files.length; i++) {
        formData.append("videos", files[i]);
    }

    const itemSelect = document.getElementById("itemSelect");
    itemSelect.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Elegir un Video";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    itemSelect.appendChild(defaultOption);
    
    for (let i = 0; i < files.length; i++) {
        const option = document.createElement("option");
        option.value = files[i].name;
        option.textContent = files[i].name;
        itemSelect.appendChild(option);
    }

    document.getElementById("loading").style.display = "block";

    fetch("http://localhost:8000/model", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error("Error:", error);
        alert("No se ha enviado correctamente");
    })
    .finally(() => {
        document.getElementById("loading").style.display = "none";
        document.getElementById("div-form").style.display = "none";
        document.getElementById("fases").style.display = "block";
    });
});

document.getElementById("itemSelect").addEventListener("change", function() {
    const downloadBtn = document.getElementById("downloadBtn");
    downloadBtn.style.display = "none"; // Hide by default on change
     
    fetch("http://localhost:8000/status")
    .then(response => response.json())
    .then(data => {
        console.log(data);
        
        const selectedItem = this.value;
        if (selectedItem) {
            showItemPhases(data);
        }

        const container = document.getElementById("plyViewerContainer");
        const canvas = container.querySelector('canvas');
        if (canvas) canvas.remove();

        document.getElementById("recenterBtn").style.display = 'none';
    })
    .catch(error => {
        console.error("Error:", error);
    });
});

document.getElementById("downloadBtn").addEventListener("click", () => {
    fetch("http://localhost:8000/status")
        .then(res => res.json())
        .then(itemData => {
            const zip = new JSZip();

            if (itemData.phase_1) {
                const phase1 = zip.folder("phase_1");
                Object.entries(itemData.phase_1).forEach(([name, base64], idx) => {
                    phase1.file(`image_${idx + 1}.png`, base64ToBlob(base64), { binary: true });
                });
            }

            if (itemData.phase_2) {
                const phase2 = zip.folder("phase_2");
                Object.entries(itemData.phase_2).forEach(([name, base64], idx) => {
                    phase2.file(`image_${idx + 1}.png`, base64ToBlob(base64), { binary: true });
                });
            }

            if (itemData.model) {
                zip.file("model.ply", base64ToBlob(itemData.model), { binary: true });
            }

            zip.generateAsync({ type: "blob" }).then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "output.zip";
                a.click();
                URL.revokeObjectURL(url);
            });
        })
        .catch(err => {
            console.error("Failed to download ZIP:", err);
            alert("Error generating ZIP.");
        });
});

function base64ToBlob(base64) {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = Array.from(slice).map(char => char.charCodeAt(0));
        byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays);
}

function showItemPhases(itemData) {
    const fasesContainer = document.getElementById("fases");

    const tabs = document.getElementById("tabButtons");
    if (tabs) tabs.remove();
    const content = document.getElementById("tabContents");
    if (content) content.remove();

    const existingMessage = fasesContainer.querySelector("p");
    if (existingMessage) {
        existingMessage.remove();
    }

    if (itemData.status === "phase 0") {
        const msg = document.createElement("p");
        msg.textContent = "Las fases se están preparando";
        fasesContainer.appendChild(msg);
        
        // Hide download button if phases not ready
        document.getElementById("downloadBtn").style.display = "none";
        return;
    }

    const tabButtonsContainer = document.createElement("div");
    tabButtonsContainer.id = "tabButtons";
    fasesContainer.appendChild(tabButtonsContainer);

    const tabContentsContainer = document.createElement("div");
    tabContentsContainer.id = "tabContents";
    fasesContainer.appendChild(tabContentsContainer);

    function addTab(title, contentCallback) {
        const button = document.createElement("button");
        button.textContent = title;
        tabButtonsContainer.appendChild(button);

        const contentDiv = document.createElement("div");
        contentDiv.style.display = "none";
        tabContentsContainer.appendChild(contentDiv);

        button.addEventListener("click", () => {
            Array.from(tabContentsContainer.children).forEach(div => div.style.display = "none");
            contentDiv.style.display = "block";

            Array.from(tabButtonsContainer.children).forEach(btn => btn.classList.remove("active-tab"));
            button.classList.add("active-tab");

            const prevViewer = document.getElementById("plyViewerContainer");
            if (prevViewer) {
                const canvas = prevViewer.querySelector('canvas');
                if (canvas) {
                    canvas.remove();
                }
            }

            const recenterBtn = document.getElementById("recenterBtn");
            if (title === "Modelo 3D") {
                recenterBtn.style.display = "inline-block";

                const plyViewerContainer = document.getElementById("plyViewerContainer");
                if (!plyViewerContainer.querySelector('canvas')) {
                    const fixedBase64 = 'data:application/octet-stream;base64,' + itemData.model;
                    initPLYViewer("plyViewerContainer", fixedBase64);
                }
            } else {
                recenterBtn.style.display = "none";
            }
        });

        contentCallback(contentDiv);
    }

    if (itemData.phase_1) {
        addTab("Fase 1", div => {
            const title = document.createElement("h2");
            title.textContent = "Fase 1:";
            div.appendChild(title);
            createImageViewer(Object.values(itemData.phase_1), div);
        });
    }

    if (itemData.phase_2) {
        addTab("Fase 2", div => {
            const title = document.createElement("h2");
            title.textContent = "Fase 2:";
            div.appendChild(title);
            createImageViewer(Object.values(itemData.phase_2), div);
        });
    }

    if (itemData.model) {
        addTab("Modelo 3D", div => {
            div.id = "plyViewerContainer";
        });
    }

    const firstTab = tabButtonsContainer.querySelector("button");
    if (firstTab) firstTab.click();

    
    const downloadBtn = document.getElementById("downloadBtn");
    const itemSelect = document.getElementById("itemSelect");
    const hasPhases = itemData.phase_1 || itemData.phase_2 || itemData.model;
    const hasSelection = itemSelect.value !== "";

    if (hasPhases && hasSelection) {
        downloadBtn.style.display = "inline-block";
    } else {
        downloadBtn.style.display = "none";
    }
}

function createImageViewer(images, container) {
    let currentImageIndex = 0;
    let zoomed = false;

    const imgContainer = document.createElement('div');
    imgContainer.style.position = 'relative';
    imgContainer.style.width = '400px';
    imgContainer.style.overflow = 'hidden';

    const imgElement = document.createElement('img');
    imgElement.style.width = '100%';
    imgElement.style.transition = 'transform 0.2s ease';
    imgElement.style.cursor = 'zoom-in';
    imgElement.style.display = 'block';
    imgElement.style.userSelect = 'none';
    imgElement.style.position = 'relative';
    imgContainer.appendChild(imgElement);

    const controls = document.createElement('div');
    controls.style.marginTop = '10px';
    const prevButton = document.createElement('button');
    const nextButton = document.createElement('button');

    prevButton.textContent = 'Prev';
    nextButton.textContent = 'Next';

    controls.appendChild(prevButton);
    controls.appendChild(nextButton);

    container.appendChild(imgContainer);
    container.appendChild(controls);

    function showImage() {
        if (images.length > 0) {
            imgElement.src = 'data:image/png;base64,' + images[currentImageIndex];
            imgElement.style.transform = 'scale(1)';
            imgElement.style.cursor = 'zoom-in';
            zoomed = false;
        }
    }

    prevButton.addEventListener('click', () => {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            showImage();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentImageIndex < images.length - 1) {
            currentImageIndex++;
            showImage();
        }
    });

    imgElement.addEventListener('click', (e) => {
        zoomed = !zoomed;
        if (zoomed) {
            const rect = imgElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const percentX = (x / rect.width) * 100;
            const percentY = (y / rect.height) * 100;

            imgElement.style.transformOrigin = `${percentX}% ${percentY}%`;
            imgElement.style.transform = 'scale(2)';
            imgElement.style.cursor = 'zoom-out';
        } else {
            imgElement.style.transform = 'scale(1)';
            imgElement.style.transformOrigin = 'center';
            imgElement.style.cursor = 'zoom-in';
        }
    });

    showImage();
}
