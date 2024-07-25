const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageInput = document.getElementById('image-input');
const addImageButton = document.getElementById('add-image-button');
const xInput = document.getElementById('x');
const yInput = document.getElementById('y');
const sizeInput = document.getElementById('size');
const rotationInput = document.getElementById('rotation');

let images = [];
let selectedImageIndex = null;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let panOffsetX = 0;
let panOffsetY = 0;

// Função para desenhar todas as imagens no canvas
function drawImages() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa o canvas antes de desenhar
  ctx.save(); // Salva o estado atual do canvas

  // Aplica o offset de pan (movimento da câmera)
  ctx.translate(panOffsetX, panOffsetY);

  images.forEach((imgData, index) => {
    const { img, x, y, width, height, rotation } = imgData;

    // Move o canvas para a posição da imagem
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);

    // Desenha a borda vermelha
    if (index === selectedImageIndex) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const points = [
        { x: -width / 2, y: -height / 2 },
        { x: width / 2, y: -height / 2 },
        { x: width / 2, y: height / 2 },
        { x: -width / 2, y: height / 2 }
      ];
      points.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  });

  ctx.restore(); // Restaura o estado do canvas
}

// Função para limpar os controles
function clearControls() {
  xInput.value = '';
  yInput.value = '';
  sizeInput.value = '';
  rotationInput.value = '';
}

// Carrega a imagem quando o usuário seleciona um arquivo
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const newSize = 100;
      const newWidth = newSize;
      const newHeight = newSize / aspectRatio;

      // Adiciona a nova imagem na posição central da câmera
      images.push({
        img,
        x: (canvas.width / 2 - newWidth / 2) - panOffsetX,
        y: (canvas.height / 2 - newHeight / 2) - panOffsetY,
        width: newWidth,
        height: newHeight,
        rotation: 0,
      });
      drawImages();
    };
  };
  reader.readAsDataURL(file);
});

// Atualiza a imagem selecionada quando os inputs mudam
xInput.addEventListener('input', () => {
  if (selectedImageIndex !== null) {
    images[selectedImageIndex].x = parseInt(xInput.value);
    drawImages();
  }
});
yInput.addEventListener('input', () => {
  if (selectedImageIndex !== null) {
    images[selectedImageIndex].y = parseInt(yInput.value);
    drawImages();
  }
});
sizeInput.addEventListener('input', () => {
  if (selectedImageIndex !== null) {
    const selectedImage = images[selectedImageIndex];
    const aspectRatio = selectedImage.img.naturalWidth / selectedImage.img.naturalHeight;
    const newSize = Math.max(10, parseInt(sizeInput.value) || 0);
    const newWidth = newSize;
    const newHeight = newSize / aspectRatio;
    selectedImage.width = newWidth;
    selectedImage.height = newHeight;
    drawImages();
  }
});
rotationInput.addEventListener('input', () => {
  if (selectedImageIndex !== null) {
    images[selectedImageIndex].rotation = parseInt(rotationInput.value) || 0;
    drawImages();
  }
});

// Botão para adicionar mais imagens
addImageButton.addEventListener('click', () => {
  imageInput.click();
});

// Detecta clique no canvas para selecionar a imagem
canvas.addEventListener('mousedown', (e) => {
  e.preventDefault(); // Previne o comportamento padrão do navegador

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (e.button === 1) { // Botão do meio do mouse
    isPanning = true;
    canvas.classList.add('grabbing');
    panStartX = x;
    panStartY = y;
    return;
  }

  if (e.button === 0) { // Botão esquerdo do mouse
    // Ajustar coordenadas para o panning
    const transformedX = x - panOffsetX;
    const transformedY = y - panOffsetY;

    // Encontra a imagem mais próxima do ponto de clique, verificando do topo para o fundo
    let foundIndex = null;
    for (let i = images.length - 1; i >= 0; i--) {
      const imgData = images[i];
      if (
        transformedX >= imgData.x &&
        transformedX <= imgData.x + imgData.width &&
        transformedY >= imgData.y &&
        transformedY <= imgData.y + imgData.height
      ) {
        foundIndex = i;
        break;
      }
    }

    selectedImageIndex = foundIndex;

    if (selectedImageIndex !== null) {
      const selectedImage = images[selectedImageIndex];
      xInput.value = selectedImage.x;
      yInput.value = selectedImage.y;
      sizeInput.value = selectedImage.width;
      rotationInput.value = selectedImage.rotation;

      // Preparar para arrastar
      isDragging = true;
      dragOffsetX = x - selectedImage.x;
      dragOffsetY = y - selectedImage.y;
    } else {
      // Se a imagem não for selecionada, limpa os controles
      selectedImageIndex = null;
      clearControls();
    }
  }
  drawImages();
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isDragging && selectedImageIndex !== null) {
    images[selectedImageIndex].x = x - dragOffsetX;
    images[selectedImageIndex].y = y - dragOffsetY;
    xInput.value = images[selectedImageIndex].x;
    yInput.value = images[selectedImageIndex].y;
    drawImages();
  }

  if (isPanning) {
    panOffsetX += x - panStartX;
    panOffsetY += y - panStartY;
    panStartX = x;
    panStartY = y;
    drawImages();
  }
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  isPanning = false;
  canvas.classList.remove('grabbing'); // Remove a classe quando o mouse é solto
});

canvas.addEventListener('mouseout', () => {
  isDragging = false;
  isPanning = false;
  canvas.classList.remove('grabbing'); // Remove a classe quando o mouse sai do canvas
});

// Ajusta o tamanho da imagem usando a roda do mouse e a tecla Shift
canvas.addEventListener('wheel', (e) => {
  if (selectedImageIndex !== null) {
    if (e.shiftKey) {
      e.preventDefault();
      const scaleFactor = 0.1;
      const selectedImage = images[selectedImageIndex];
      const newSize = Math.max(10, parseInt(sizeInput.value) + (e.deltaY > 0 ? -scaleFactor * sizeInput.value : scaleFactor * sizeInput.value));
      sizeInput.value = newSize;
      const aspectRatio = selectedImage.img.naturalWidth / selectedImage.img.naturalHeight;
      selectedImage.width = newSize;
      selectedImage.height = newSize / aspectRatio;
      drawImages();
    } else if (e.ctrlKey) {
      e.preventDefault();
      const rotationFactor = 1; // Ajuste a velocidade de rotação se necessário
      const selectedImage = images[selectedImageIndex];
      selectedImage.rotation += (e.deltaY > 0 ? -rotationFactor : rotationFactor);
      rotationInput.value = selectedImage.rotation;
      drawImages();
    }
  }
});

// Adiciona a funcionalidade de deletar a imagem com a tecla Delete
document.addEventListener('keydown', (e) => {
  if (e.key === 'Delete' && selectedImageIndex !== null) {
    images.splice(selectedImageIndex, 1);
    selectedImageIndex = null;
    clearControls();
    drawImages();
  }
});

//github hover code

document.addEventListener("DOMContentLoaded", () => {
  const hoverElement = document.querySelector(".hover-element");
  const tooltip = document.getElementById("tooltip");

  hoverElement.addEventListener("mouseover", () => {
    tooltip.style.display = "block";
  });

  hoverElement.addEventListener("mouseout", () => {
    tooltip.style.display = "none";
  });

  hoverElement.addEventListener("mousemove", (e) => {
    tooltip.style.left = `${e.pageX + 10}px`;
    tooltip.style.top = `${e.pageY + 10}px`;
  });
});
