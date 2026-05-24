// State Management
let state = {
  image: null,
  imageLoaded: false,
  imageName: 'carousel',
  aspectRatio: '4:5', // '4:5' or '1:1'
  slideCount: 2,
  zoom: 1.0,
  quality: 90,
  
  // Coordinate offsets of the image inside the crop container (in CSS pixels)
  offsetX: 0,
  offsetY: 0,
  
  // Dimensions of the crop container (in CSS pixels)
  cropBoxWidth: 0,
  cropBoxHeight: 0,
  
  // Base scale: scale to fit the image to "cover" the crop container at 1.0x zoom
  baseScale: 1.0,
  
  // Workspace scaling (between screen viewport dimensions and maximum display limits)
  workspaceScale: 1.0,
  
  // Dragging state
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  imageStartX: 0,
  imageStartY: 0,
  
  // Preview simulator state
  currentSlideIndex: 0,
  previewIsDragging: false,
  previewStartX: 0,
  previewTranslateX: 0,
  previewDeltaX: 0
};

// Config Constants
const INSTAGRAM_RESOLUTIONS = {
  '4:5': { width: 1080, height: 1350, ratio: 0.8 },
  '1:1': { width: 1080, height: 1080, ratio: 1.0 }
};

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const ratioPortrait = document.getElementById('ratio-portrait');
const ratioSquare = document.getElementById('ratio-square');
const inputSlides = document.getElementById('input-slides');
const valSlides = document.getElementById('val-slides');
const inputZoom = document.getElementById('input-zoom');
const valZoom = document.getElementById('val-zoom');
const inputQuality = document.getElementById('input-quality');
const valQuality = document.getElementById('val-quality');
const btnReset = document.getElementById('btn-reset');
const btnFit = document.getElementById('btn-fit');
const btnDownload = document.getElementById('btn-download');

const canvasContainer = document.getElementById('canvas-container');
const cropperWrapper = document.getElementById('cropper-wrapper');
const cropperImage = document.getElementById('source-image-element');
const splitGuides = document.getElementById('split-guides');
const dragHint = document.getElementById('drag-hint');
const emptyState = document.getElementById('workspace-empty-state');

const imageNameDisplay = document.getElementById('image-name-display');
const canvasDimensionsDisplay = document.getElementById('canvas-dimensions-display');
const totalDimensionsDisplay = document.getElementById('total-dimensions');

// Mobile Preview Elements
const previewViewport = document.getElementById('preview-viewport');
const previewStrip = document.getElementById('preview-strip');
const previewDots = document.getElementById('preview-dots');
const previewSlideIndex = document.getElementById('preview-slide-index');
const previewTotalSlides = document.getElementById('preview-total-slides');
const phoneContainer = document.getElementById('phone-content-container');

// Modal Elements
const loadingOverlay = document.getElementById('loading-overlay');
const modalLoader = document.getElementById('modal-loader');
const modalSuccessCheck = document.getElementById('modal-success-check');
const modalTitle = document.getElementById('modal-title');
const modalStatus = document.getElementById('modal-status');
const btnCloseModal = document.getElementById('btn-close-modal');

// Init Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  setupUploadEvents();
  setupControlEvents();
  setupWorkspaceEvents();
  setupSwipeSimulatorEvents();
  setupEasterEgg();
  setupKeyboardShortcuts();
  setupPasteUpload();
});

// --- Upload Section ---
function setupUploadEvents() {
  dropZone.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
}

function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file (JPG, PNG, or WEBP).');
    return;
  }
  
  state.imageName = file.name.substring(0, file.name.lastIndexOf('.')) || 'carousel';
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state.image = img;
      state.imageLoaded = true;
      
      // Update displays
      imageNameDisplay.textContent = file.name;
      totalDimensionsDisplay.textContent = `${img.width} × ${img.height} px`;
      
      // Enable controls
      inputZoom.disabled = false;
      btnReset.disabled = false;
      btnFit.disabled = false;
      btnDownload.disabled = false;
      
      emptyState.style.display = 'none';
      cropperWrapper.style.display = 'block';
      dragHint.classList.add('show');
      
      // Reset cropping parameters & set source
      cropperImage.src = e.target.result;
      resetCrop();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// --- Control Settings UI ---
function setupControlEvents() {
  // Aspect Ratios
  ratioPortrait.addEventListener('click', () => {
    if (state.aspectRatio === '4:5') return;
    state.aspectRatio = '4:5';
    ratioPortrait.classList.add('active');
    ratioSquare.classList.remove('active');
    phoneContainer.classList.remove('ratio-square');
    phoneContainer.classList.add('ratio-portrait');
    onWorkspaceParamsChange();
  });
  
  ratioSquare.addEventListener('click', () => {
    if (state.aspectRatio === '1:1') return;
    state.aspectRatio = '1:1';
    ratioSquare.classList.add('active');
    ratioPortrait.classList.remove('active');
    phoneContainer.classList.remove('ratio-portrait');
    phoneContainer.classList.add('ratio-square');
    onWorkspaceParamsChange();
  });
  
  // Slide count
  inputSlides.addEventListener('input', (e) => {
    state.slideCount = parseInt(e.target.value, 10);
    valSlides.textContent = state.slideCount;
    onWorkspaceParamsChange();
  });
  
  // Zoom
  inputZoom.addEventListener('input', (e) => {
    state.zoom = parseFloat(e.target.value);
    valZoom.textContent = `${state.zoom.toFixed(2)}x`;
    renderCrop();
  });
  
  // Quality
  inputQuality.addEventListener('input', (e) => {
    state.quality = parseInt(e.target.value, 10);
    valQuality.textContent = `${state.quality}%`;
  });
  
  // Resets
  btnReset.addEventListener('click', resetCrop);
  btnFit.addEventListener('click', autoFitImage);
  
  // Download button
  btnDownload.addEventListener('click', processAndExport);
  
  // Close Modal
  btnCloseModal.addEventListener('click', () => {
    loadingOverlay.classList.remove('show');
  });

  // Watch window resize to keep workspace crop box responsive
  window.addEventListener('resize', () => {
    if (state.imageLoaded) {
      updateCropBoxDimensions();
      renderCrop();
    }
  });
}

// --- Crop Workspace Logic ---
function setupWorkspaceEvents() {
  // --- Mouse events (desktop) ---
  cropperWrapper.addEventListener('mousedown', (e) => {
    if (!state.imageLoaded) return;
    state.isDragging = true;
    state.dragStartX = e.clientX;
    state.dragStartY = e.clientY;
    state.imageStartX = state.offsetX;
    state.imageStartY = state.offsetY;
    cropperWrapper.style.cursor = 'grabbing';
  });
  
  window.addEventListener('mousemove', (e) => {
    if (!state.isDragging) return;
    
    const dx = e.clientX - state.dragStartX;
    const dy = e.clientY - state.dragStartY;
    
    state.offsetX = state.imageStartX + dx;
    state.offsetY = state.imageStartY + dy;
    
    const renderedWidth = state.image.width * state.baseScale * state.zoom;
    const renderedHeight = state.image.height * state.baseScale * state.zoom;
    
    // Constraint: Image must always cover the cropBox
    state.offsetX = Math.min(0, Math.max(state.offsetX, state.cropBoxWidth - renderedWidth));
    state.offsetY = Math.min(0, Math.max(state.offsetY, state.cropBoxHeight - renderedHeight));
    
    applyPositionStyles();
    updateLivePreviews();
  });
  
  window.addEventListener('mouseup', () => {
    if (state.isDragging) {
      state.isDragging = false;
      cropperWrapper.style.cursor = 'grab';
    }
  });

  // Wheel zoom helper
  cropperWrapper.addEventListener('wheel', (e) => {
    if (!state.imageLoaded) return;
    e.preventDefault();
    
    // Zoom delta
    const delta = -e.deltaY * 0.001;
    let newZoom = Math.min(3.0, Math.max(1.0, state.zoom + delta));
    
    if (newZoom !== state.zoom) {
      // Zoom centered on pointer coordinate
      const rect = cropperWrapper.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;
      
      const oldRenderedW = state.image.width * state.baseScale * state.zoom;
      const oldRenderedH = state.image.height * state.baseScale * state.zoom;
      
      const relX = (pointerX - state.offsetX) / oldRenderedW;
      const relY = (pointerY - state.offsetY) / oldRenderedH;
      
      state.zoom = newZoom;
      inputZoom.value = newZoom;
      valZoom.textContent = `${newZoom.toFixed(2)}x`;
      
      const newRenderedW = state.image.width * state.baseScale * state.zoom;
      const newRenderedH = state.image.height * state.baseScale * state.zoom;
      
      // Calculate new offsets to keep pointer focused
      state.offsetX = pointerX - relX * newRenderedW;
      state.offsetY = pointerY - relY * newRenderedH;
      
      // Constraints
      state.offsetX = Math.min(0, Math.max(state.offsetX, state.cropBoxWidth - newRenderedW));
      state.offsetY = Math.min(0, Math.max(state.offsetY, state.cropBoxHeight - newRenderedH));
      
      applyPositionStyles();
      updateLivePreviews();
    }
  }, { passive: false });

  // --- Touch events (mobile pinch-to-zoom + drag) ---
  let touchState = {
    isDragging: false,
    isPinching: false,
    startX: 0,
    startY: 0,
    imageStartX: 0,
    imageStartY: 0,
    initialPinchDistance: 0,
    initialZoom: 1.0,
    pinchCenterX: 0,
    pinchCenterY: 0
  };

  function getTouchDistance(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getTouchCenter(t1, t2) {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    };
  }

  cropperWrapper.addEventListener('touchstart', (e) => {
    if (!state.imageLoaded) return;
    e.preventDefault();

    if (e.touches.length === 1) {
      // Single finger → drag
      touchState.isDragging = true;
      touchState.isPinching = false;
      touchState.startX = e.touches[0].clientX;
      touchState.startY = e.touches[0].clientY;
      touchState.imageStartX = state.offsetX;
      touchState.imageStartY = state.offsetY;
    } else if (e.touches.length === 2) {
      // Two fingers → pinch to zoom
      touchState.isDragging = false;
      touchState.isPinching = true;
      touchState.initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
      touchState.initialZoom = state.zoom;

      const rect = cropperWrapper.getBoundingClientRect();
      const center = getTouchCenter(e.touches[0], e.touches[1]);
      touchState.pinchCenterX = center.x - rect.left;
      touchState.pinchCenterY = center.y - rect.top;
    }
  }, { passive: false });

  cropperWrapper.addEventListener('touchmove', (e) => {
    if (!state.imageLoaded) return;
    e.preventDefault();

    if (touchState.isPinching && e.touches.length === 2) {
      // Pinch zoom
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scaleFactor = currentDistance / touchState.initialPinchDistance;
      let newZoom = Math.min(3.0, Math.max(1.0, touchState.initialZoom * scaleFactor));

      const oldRenderedW = state.image.width * state.baseScale * state.zoom;
      const oldRenderedH = state.image.height * state.baseScale * state.zoom;

      const relX = (touchState.pinchCenterX - state.offsetX) / oldRenderedW;
      const relY = (touchState.pinchCenterY - state.offsetY) / oldRenderedH;

      state.zoom = newZoom;
      inputZoom.value = newZoom;
      valZoom.textContent = `${newZoom.toFixed(2)}x`;

      const newRenderedW = state.image.width * state.baseScale * state.zoom;
      const newRenderedH = state.image.height * state.baseScale * state.zoom;

      state.offsetX = touchState.pinchCenterX - relX * newRenderedW;
      state.offsetY = touchState.pinchCenterY - relY * newRenderedH;

      state.offsetX = Math.min(0, Math.max(state.offsetX, state.cropBoxWidth - newRenderedW));
      state.offsetY = Math.min(0, Math.max(state.offsetY, state.cropBoxHeight - newRenderedH));

      applyPositionStyles();
      updateLivePreviews();

    } else if (touchState.isDragging && e.touches.length === 1) {
      // Single finger drag
      const dx = e.touches[0].clientX - touchState.startX;
      const dy = e.touches[0].clientY - touchState.startY;

      state.offsetX = touchState.imageStartX + dx;
      state.offsetY = touchState.imageStartY + dy;

      const renderedWidth = state.image.width * state.baseScale * state.zoom;
      const renderedHeight = state.image.height * state.baseScale * state.zoom;

      state.offsetX = Math.min(0, Math.max(state.offsetX, state.cropBoxWidth - renderedWidth));
      state.offsetY = Math.min(0, Math.max(state.offsetY, state.cropBoxHeight - renderedHeight));

      applyPositionStyles();
      updateLivePreviews();
    }
  }, { passive: false });

  cropperWrapper.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
      touchState.isDragging = false;
      touchState.isPinching = false;
    } else if (e.touches.length === 1) {
      // Went from pinch back to single finger — restart drag from current position
      touchState.isPinching = false;
      touchState.isDragging = true;
      touchState.startX = e.touches[0].clientX;
      touchState.startY = e.touches[0].clientY;
      touchState.imageStartX = state.offsetX;
      touchState.imageStartY = state.offsetY;
    }
  });
}

function resetCrop() {
  if (!state.imageLoaded) return;
  state.zoom = 1.0;
  inputZoom.value = 1.0;
  valZoom.textContent = '1.0x';
  
  updateCropBoxDimensions();
  autoFitImage();
}

function updateCropBoxDimensions() {
  const containerW = canvasContainer.clientWidth - 64; // pad 32px each side
  const containerH = canvasContainer.clientHeight - 64;
  
  const slideRatio = INSTAGRAM_RESOLUTIONS[state.aspectRatio].ratio;
  const targetRatio = state.slideCount * slideRatio;
  
  // Fit targetRatio inside container dimensions
  if (containerW / containerH > targetRatio) {
    state.cropBoxHeight = containerH;
    state.cropBoxWidth = containerH * targetRatio;
  } else {
    state.cropBoxWidth = containerW;
    state.cropBoxHeight = containerW / targetRatio;
  }
  
  // Set dimensions of the cropper viewport wrapper
  cropperWrapper.style.width = `${state.cropBoxWidth}px`;
  cropperWrapper.style.height = `${state.cropBoxHeight}px`;
}

function autoFitImage() {
  if (!state.imageLoaded) return;
  
  // The base scale makes the image size fit the height/width of the crop viewport
  // to ensure it completely covers the crop frame (minimal cover zoom).
  const scaleW = state.cropBoxWidth / state.image.width;
  const scaleH = state.cropBoxHeight / state.image.height;
  
  state.baseScale = Math.max(scaleW, scaleH);
  
  // Center image
  const renderedW = state.image.width * state.baseScale * state.zoom;
  const renderedH = state.image.height * state.baseScale * state.zoom;
  
  state.offsetX = (state.cropBoxWidth - renderedW) / 2;
  state.offsetY = (state.cropBoxHeight - renderedH) / 2;
  
  renderCrop();
}

function renderCrop() {
  if (!state.imageLoaded) return;
  
  applyPositionStyles();
  generateGuides();
  setupSwipeSimulator();
  updateLivePreviews();
  
  // Update detail displays
  const sliceRes = INSTAGRAM_RESOLUTIONS[state.aspectRatio];
  canvasDimensionsDisplay.textContent = `Individual Slices will render at ${sliceRes.width} × ${sliceRes.height} px`;
}

function applyPositionStyles() {
  const renderedWidth = state.image.width * state.baseScale * state.zoom;
  const renderedHeight = state.image.height * state.baseScale * state.zoom;
  
  cropperImage.style.width = `${renderedWidth}px`;
  cropperImage.style.height = `${renderedHeight}px`;
  cropperImage.style.transform = `translate(${state.offsetX}px, ${state.offsetY}px)`;
}

function generateGuides() {
  splitGuides.innerHTML = '';
  
  for (let i = 0; i < state.slideCount; i++) {
    const guide = document.createElement('div');
    guide.className = 'guide-line';
    
    const label = document.createElement('span');
    label.className = 'guide-label';
    label.textContent = `Slide ${i + 1}`;
    guide.appendChild(label);
    
    splitGuides.appendChild(guide);
  }
}

function onWorkspaceParamsChange() {
  if (state.imageLoaded) {
    updateCropBoxDimensions();
    autoFitImage();
  }
}

// --- Mobile Instagram Feed Swipe Mock Simulator ---
function setupSwipeSimulator() {
  previewStrip.innerHTML = '';
  previewDots.innerHTML = '';
  state.currentSlideIndex = 0;
  
  // Calculate heights based on aspect ratio
  const phoneViewportWidth = previewViewport.clientWidth || 234; // default mock width
  const slideRatio = INSTAGRAM_RESOLUTIONS[state.aspectRatio].ratio;
  previewViewport.style.height = `${phoneViewportWidth / slideRatio}px`;
  
  for (let i = 0; i < state.slideCount; i++) {
    // Post slide markup
    const slide = document.createElement('div');
    slide.className = 'carousel-slide-mock';
    slide.id = `preview-slide-el-${i}`;
    previewStrip.appendChild(slide);
    
    // Pagination indicator dot markup
    const dot = document.createElement('div');
    dot.className = `ig-dot ${i === 0 ? 'active' : ''}`;
    dot.dataset.index = i;
    dot.addEventListener('click', () => navigatePreviewTo(i));
    previewDots.appendChild(dot);
  }
  
  previewStrip.style.width = `${state.slideCount * 100}%`;
  document.querySelectorAll('.carousel-slide-mock').forEach(slide => {
    slide.style.width = `${100 / state.slideCount}%`;
  });
  
  previewTotalSlides.textContent = state.slideCount;
  updateIndicatorDisplay();
}

function navigatePreviewTo(index) {
  state.currentSlideIndex = Math.max(0, Math.min(state.slideCount - 1, index));
  const offset = -state.currentSlideIndex * (100 / state.slideCount);
  previewStrip.style.transform = `translateX(${offset}%)`;
  
  // Update indicator active dots
  const dots = previewDots.querySelectorAll('.ig-dot');
  dots.forEach((dot, idx) => {
    if (idx === state.currentSlideIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
  
  updateIndicatorDisplay();
}

function updateIndicatorDisplay() {
  previewSlideIndex.textContent = state.currentSlideIndex + 1;
}

// Extract crop pieces dynamically using tiny canvases and update the phone background
function updateLivePreviews() {
  if (!state.imageLoaded) return;
  
  const slideWidthPx = state.cropBoxWidth / state.slideCount;
  const slideHeightPx = state.cropBoxHeight;
  
  // Map display offset to source image scale coordinate system
  const imgScaleFactor = state.baseScale * state.zoom;
  const srcW = slideWidthPx / imgScaleFactor;
  const srcH = slideHeightPx / imgScaleFactor;
  const srcY = -state.offsetY / imgScaleFactor;
  
  // Generate thumbnails for mockup images
  for (let i = 0; i < state.slideCount; i++) {
    const srcX = (-state.offsetX / imgScaleFactor) + (i * srcW);
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 300; // standard preview size
    tempCanvas.height = 300 / INSTAGRAM_RESOLUTIONS[state.aspectRatio].ratio;
    
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(
      state.image,
      srcX, srcY, srcW, srcH,
      0, 0, tempCanvas.width, tempCanvas.height
    );
    
    const slideEl = document.getElementById(`preview-slide-el-${i}`);
    if (slideEl) {
      slideEl.style.backgroundImage = `url(${tempCanvas.toDataURL('image/jpeg', 0.85)})`;
    }
  }
}

// Touch and swipe events on Phone simulator
function setupSwipeSimulatorEvents() {
  previewViewport.addEventListener('mousedown', dragSwipeStart);
  previewViewport.addEventListener('touchstart', dragSwipeStart, { passive: true });
  
  window.addEventListener('mousemove', dragSwipeMove);
  window.addEventListener('touchmove', dragSwipeMove, { passive: false });
  
  window.addEventListener('mouseup', dragSwipeEnd);
  window.addEventListener('touchend', dragSwipeEnd);
}

function dragSwipeStart(e) {
  state.previewIsDragging = true;
  state.previewStartX = e.clientX || e.touches[0].clientX;
  state.previewDeltaX = 0;
  
  const viewportWidth = previewViewport.clientWidth;
  state.previewTranslateX = -state.currentSlideIndex * viewportWidth;
  
  previewStrip.style.transition = 'none'; // Disable transition during drag
}

function dragSwipeMove(e) {
  if (!state.previewIsDragging) return;
  
  const clientX = e.clientX || (e.touches && e.touches[0].clientX);
  state.previewDeltaX = clientX - state.previewStartX;
  
  // Constraint drag: drag resistance on outer limits
  let totalTranslate = state.previewTranslateX + state.previewDeltaX;
  const viewportWidth = previewViewport.clientWidth;
  const maxLimit = 0;
  const minLimit = -(state.slideCount - 1) * viewportWidth;
  
  if (totalTranslate > maxLimit) {
    totalTranslate = state.previewDeltaX * 0.3; // bounce resistance
  } else if (totalTranslate < minLimit) {
    totalTranslate = minLimit + (totalTranslate - minLimit) * 0.3;
  }
  
  previewStrip.style.transform = `translateX(${totalTranslate}px)`;
}

function dragSwipeEnd() {
  if (!state.previewIsDragging) return;
  state.previewIsDragging = false;
  
  previewStrip.style.transition = ''; // Restore default CSS transition
  
  const viewportWidth = previewViewport.clientWidth;
  const threshold = viewportWidth * 0.2; // swipe 20% to move
  
  if (state.previewDeltaX < -threshold && state.currentSlideIndex < state.slideCount - 1) {
    // Swipe left -> Next slide
    state.currentSlideIndex++;
  } else if (state.previewDeltaX > threshold && state.currentSlideIndex > 0) {
    // Swipe right -> Prev slide
    state.currentSlideIndex--;
  }
  
  navigatePreviewTo(state.currentSlideIndex);
}

// --- Slice Exporter & ZIP Generation ---
function showModal(title, status, isDone = false) {
  loadingOverlay.classList.add('show');
  modalTitle.textContent = title;
  modalStatus.textContent = status;
  
  if (isDone) {
    modalLoader.style.display = 'none';
    modalSuccessCheck.style.display = 'flex';
    btnCloseModal.style.display = 'block';
  } else {
    modalLoader.style.display = 'block';
    modalSuccessCheck.style.display = 'none';
    btnCloseModal.style.display = 'none';
  }
}

function processAndExport() {
  if (!state.imageLoaded) return;
  
  showModal('Slicing Image', 'Preparing High-Resolution Canvas renders...');
  
  setTimeout(() => {
    try {
      const slideRes = INSTAGRAM_RESOLUTIONS[state.aspectRatio];
      const targetW = slideRes.width;
      const targetH = slideRes.height;
      
      const slideWidthPx = state.cropBoxWidth / state.slideCount;
      const slideHeightPx = state.cropBoxHeight;
      const imgScaleFactor = state.baseScale * state.zoom;
      
      const srcW = slideWidthPx / imgScaleFactor;
      const srcH = slideHeightPx / imgScaleFactor;
      const srcY = -state.offsetY / imgScaleFactor;
      
      const renderedSlices = [];
      
      // Render each slide segment onto individual canvases
      for (let i = 0; i < state.slideCount; i++) {
        const srcX = (-state.offsetX / imgScaleFactor) + (i * srcW);
        
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = targetW;
        exportCanvas.height = targetH;
        
        const ctx = exportCanvas.getContext('2d');
        // Enable high quality scaling settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(
          state.image,
          srcX, srcY, srcW, srcH,
          0, 0, targetW, targetH
        );
        
        renderedSlices.push({
          canvas: exportCanvas,
          filename: `${state.imageName}_slide_${i + 1}.jpg`
        });
      }
      
      // Check if JSZip library is available
      if (typeof JSZip !== 'undefined') {
        createAndDownloadZip(renderedSlices);
      } else {
        // Fallback: Individual downloads
        showModal('Exporting Files', 'JSZip library unavailable. Downloading slides sequentially...');
        triggerSequentialDownloads(renderedSlices);
      }
      
    } catch (err) {
      console.error(err);
      showModal('Export Failed', 'An error occurred during canvas cropping: ' + err.message, true);
    }
  }, 100);
}

function createAndDownloadZip(slices) {
  showModal('Generating ZIP', 'Compressing high-quality JPGs into a single ZIP archive...');
  
  const zip = new JSZip();
  let completed = 0;
  
  slices.forEach((slice) => {
    // Convert canvas to JPG Blob
    slice.canvas.toBlob((blob) => {
      zip.file(slice.filename, blob);
      completed++;
      
      if (completed === slices.length) {
        zip.generateAsync({ type: 'blob' }).then((content) => {
          showModal('Export Complete', 'Your seamless carousel pack is ready!', true);
          
          const zipName = `${state.imageName}_instagram_carousel.zip`;
          downloadBlob(content, zipName);
        });
      }
    }, 'image/jpeg', state.quality / 100);
  });
}

function triggerSequentialDownloads(slices) {
  let idx = 0;
  
  function downloadNext() {
    if (idx >= slices.length) {
      showModal('Downloads Triggered', 'All slices downloaded. Please check your browser downloads folder!', true);
      return;
    }
    
    const slice = slices[idx];
    slice.canvas.toBlob((blob) => {
      downloadBlob(blob, slice.filename);
      idx++;
      setTimeout(downloadNext, 300); // 300ms pause to ensure popups/multiple downloads aren't blocked
    }, 'image/jpeg', state.quality / 100);
  }
  
  downloadNext();
}

function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// --- Easter Egg Logic for Cyril ---
let easterEggActive = false;
let easterAnimationFrame = null;

function setupEasterEgg() {
  const logoIcon = document.querySelector('.logo-icon');
  const easterOverlay = document.getElementById('easter-egg-overlay');
  const btnCloseEaster = document.getElementById('btn-close-easter');
  
  if (!logoIcon || !easterOverlay) return;
  
  let clickCount = 0;
  
  logoIcon.addEventListener('click', () => {
    clickCount++;
    // Subtle flash effect on logo when clicked
    logoIcon.style.transform = 'scale(1.2)';
    setTimeout(() => {
      logoIcon.style.transform = '';
    }, 100);
    
    if (clickCount >= 5) {
      clickCount = 0;
      activateEasterEgg();
    }
  });
  
  btnCloseEaster.addEventListener('click', () => {
    deactivateEasterEgg();
  });
}

function activateEasterEgg() {
  const easterOverlay = document.getElementById('easter-egg-overlay');
  easterOverlay.classList.add('show');
  easterEggActive = true;
  
  // Console ASCII Art greeting
  console.log(`%c
 ___           _          ___       _ _ _   
|_ _|         | |        / __|     (_) (_)  
 | |  _ __  __| |_ __ _  \\__ \\_ __  _| |_ __
 | | | '_ \\/ __| __/ _\` | |__/ / '_ \\| | | __|
|___||_| |_|___|\\__\\__,_| |___/| .__/|_|_|___|
                               |_|            
         ✨ Custom Studio Edition ✨
         Created with ❤️ for Cyril
  `, 'color: #ec4899; font-weight: bold; font-family: monospace; font-size: 11px;');
  
  console.log('%cWelcome, Cyril! Ready to slice some panoramas? 🚀', 'color: #6366f1; font-weight: bold; font-size: 13px;');
  
  startEasterConfetti();
}

function deactivateEasterEgg() {
  const easterOverlay = document.getElementById('easter-egg-overlay');
  easterOverlay.classList.remove('show');
  easterEggActive = false;
  if (easterAnimationFrame) {
    cancelAnimationFrame(easterAnimationFrame);
  }
}

function startEasterConfetti() {
  const canvas = document.getElementById('easter-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const parent = canvas.parentElement;
  
  // Fit canvas to dialog
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;
  
  const particles = [];
  const colors = ['#6366f1', '#ec4899', '#8b5cf6', '#a78bfa', '#f43f5e'];
  
  // Generate initial particles
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 4 + 2,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0,
      speed: Math.random() * 2 + 1.5
    });
  }
  
  function draw() {
    if (!easterEggActive) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((p, idx) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += p.speed;
      p.x += Math.sin(p.tiltAngle) * 0.5;
      
      // Draw falling particle
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.r, p.y);
      ctx.lineTo(p.x, p.y + p.tilt + p.r);
      ctx.stroke();
      
      // Recycle particle when it goes off screen
      if (p.y > canvas.height) {
        particles[idx] = {
          x: Math.random() * canvas.width,
          y: -20,
          r: p.r,
          d: p.d,
          color: p.color,
          tilt: Math.random() * 10 - 5,
          tiltAngleIncremental: p.tiltAngleIncremental,
          tiltAngle: 0,
          speed: p.speed
        };
      }
    });
    
    easterAnimationFrame = requestAnimationFrame(draw);
  }
  
  draw();
  
  // Handle resize of dialog container
  window.addEventListener('resize', () => {
    if (easterEggActive) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
  });
}

// --- Keyboard Shortcuts for Desktop Power Users ---
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+O / Cmd+O → Open file picker
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
      e.preventDefault();
      fileInput.click();
    }

    // Ctrl+S / Cmd+S → Slice & Download
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (state.imageLoaded && !btnDownload.disabled) {
        processAndExport();
      }
    }

    // Ctrl+R / Cmd+R → Reset Crop (prevent browser refresh)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      if (state.imageLoaded) {
        resetCrop();
      }
    }

    // Ctrl+F / Cmd+F → Auto-Fit
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      if (state.imageLoaded) {
        autoFitImage();
      }
    }

    // +/- keys to adjust zoom quickly
    if (state.imageLoaded && !e.ctrlKey && !e.metaKey) {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        state.zoom = Math.min(3.0, state.zoom + 0.1);
        inputZoom.value = state.zoom;
        valZoom.textContent = `${state.zoom.toFixed(2)}x`;
        renderCrop();
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        state.zoom = Math.max(1.0, state.zoom - 0.1);
        inputZoom.value = state.zoom;
        valZoom.textContent = `${state.zoom.toFixed(2)}x`;
        renderCrop();
      }
    }

    // Left/Right arrow keys navigate preview slides
    if (e.key === 'ArrowLeft') {
      navigatePreviewTo(state.currentSlideIndex - 1);
    }
    if (e.key === 'ArrowRight') {
      navigatePreviewTo(state.currentSlideIndex + 1);
    }
  });
}

// --- Paste Image from Clipboard ---
function setupPasteUpload() {
  document.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
        }
        return;
      }
    }
  });
}

