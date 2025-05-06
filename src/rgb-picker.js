// File: rgb-picker.js

// --- Module-Scoped State Variables ---
// These are private to this module unless exposed via exported functions
let currentHue = 0 // 0-360
let currentSat = 100 // 0-100
let currentVal = 100 // 0-100 (value/brightness)
let currentR = 255 // Current RGB state
let currentG = 0
let currentB = 0

let targetDiv = null // Reference to the container element
let satValBox,
  satValCursor,
  hueSlider,
  hueCursor,
  previewBox,
  rInput,
  gInput,
  bInput // Element references
let isDraggingSatVal = false
let isDraggingHue = false

// --- Private Color Conversion Functions ---
function HSVtoRGB(h, s, v) {
  s /= 100
  v /= 100
  let f = (n, k = (n + h / 60) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)
  currentR = Math.round(f(5) * 255)
  currentG = Math.round(f(3) * 255)
  currentB = Math.round(f(1) * 255)
  // Note: No return needed if only updating module state
}

function RGBtoHSV(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  let v = Math.max(r, g, b),
    c = v - Math.min(r, g, b)
  let h =
    c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c)
  if (c !== 0) {
    currentHue = Math.round(60 * (h < 0 ? h + 6 : h)) % 360
  } // Keep old hue for grayscale
  currentSat = Math.round((v && c / v) * 100)
  currentVal = Math.round(v * 100)
  // Note: No return needed
}

// --- Private Update Functions ---
function updatePickerUI() {
  if (
    !satValBox ||
    !previewBox ||
    !rInput ||
    !gInput ||
    !bInput ||
    !hueSlider ||
    !hueCursor ||
    !satValCursor
  )
    return

  satValBox.style.backgroundColor = `hsl(${currentHue}, 100%, 50%)`
  previewBox.style.backgroundColor = `rgb(${currentR}, ${currentG}, ${currentB})`

  const satValSize = satValBox.offsetWidth
  const satValX = (currentSat / 100) * satValSize
  const satValY = (1 - currentVal / 100) * satValSize
  satValCursor.style.left = `${satValX}px`
  satValCursor.style.top = `${satValY}px`
  satValCursor.style.borderColor =
    currentVal > 50 || currentSat < 50 ? "black" : "white"

  const hueSize = hueSlider.offsetHeight
  const hueY = (currentHue / 360) * hueSize
  hueCursor.style.top = `${hueY}px`

  if (document.activeElement !== rInput) rInput.value = currentR
  if (document.activeElement !== gInput) gInput.value = currentG
  if (document.activeElement !== bInput) bInput.value = currentB
}

function updateColorFromHSV() {
  HSVtoRGB(currentHue, currentSat, currentVal)
  updatePickerUI()
}

function updateColorFromRGB() {
  currentR = Math.max(0, Math.min(255, parseInt(rInput.value, 10) || 0))
  currentG = Math.max(0, Math.min(255, parseInt(gInput.value, 10) || 0))
  currentB = Math.max(0, Math.min(255, parseInt(bInput.value, 10) || 0))
  rInput.value = currentR
  gInput.value = currentG
  bInput.value = currentB
  RGBtoHSV(currentR, currentG, currentB)
  updatePickerUI()
}

// --- Private Event Handlers ---
function handleSatValInteraction(event, clientX, clientY) {
  event.preventDefault()
  const rect = satValBox.getBoundingClientRect()
  let x = clientX - rect.left
  let y = clientY - rect.top
  const size = satValBox.offsetWidth
  x = Math.max(0, Math.min(size, x))
  y = Math.max(0, Math.min(size, y))
  currentSat = Math.round((x / size) * 100)
  currentVal = Math.round((1 - y / size) * 100)
  updateColorFromHSV()
}

function handleHueInteraction(event, clientY) {
  event.preventDefault()
  const rect = hueSlider.getBoundingClientRect()
  let y = clientY - rect.top
  const size = hueSlider.offsetHeight
  y = Math.max(0, Math.min(size, y))
  currentHue = Math.round((y / size) * 360)
  if (currentHue === 360) currentHue = 0
  updateColorFromHSV()
}

// Mouse/Touch Drag Handlers
function handleSatValMouseMove(e) {
  if (isDraggingSatVal) handleSatValInteraction(e, e.clientX, e.clientY)
}
function handleSatValMouseUp() {
  if (isDraggingSatVal) {
    isDraggingSatVal = false
    document.removeEventListener("mousemove", handleSatValMouseMove)
    document.removeEventListener("mouseup", handleSatValMouseUp)
  }
}
function handleHueMouseMove(e) {
  if (isDraggingHue) handleHueInteraction(e, e.clientY)
}
function handleHueMouseUp() {
  if (isDraggingHue) {
    isDraggingHue = false
    document.removeEventListener("mousemove", handleHueMouseMove)
    document.removeEventListener("mouseup", handleHueMouseUp)
  }
}
function handleSatValTouchMove(e) {
  if (isDraggingSatVal && e.touches.length === 1) {
    handleSatValInteraction(e, e.touches[0].clientX, e.touches[0].clientY)
    e.preventDefault()
  }
}
function handleSatValTouchEnd() {
  if (isDraggingSatVal) {
    isDraggingSatVal = false
    document.removeEventListener("touchmove", handleSatValTouchMove)
    document.removeEventListener("touchend", handleSatValTouchEnd)
  }
}
function handleHueTouchMove(e) {
  if (isDraggingHue && e.touches.length === 1) {
    handleHueInteraction(e, e.touches[0].clientY)
    e.preventDefault()
  }
}
function handleHueTouchEnd() {
  if (isDraggingHue) {
    isDraggingHue = false
    document.removeEventListener("touchmove", handleHueTouchMove)
    document.removeEventListener("touchend", handleHueTouchEnd)
  }
}

// --- Exported Initialization Function ---
export function init(targetElementId) {
  targetDiv = document.getElementById(targetElementId)
  if (!targetDiv) {
    console.error(`RgbPicker: Element with ID "${targetElementId}" not found.`)
    return
  }
  targetDiv.innerHTML = ""

  // Reset state
  currentHue = 0
  currentSat = 100
  currentVal = 100
  currentR = 255
  currentG = 0
  currentB = 0
  isDraggingSatVal = false
  isDraggingHue = false

  // Create DOM Elements (assign to module-scoped vars)
  const pickerContainer = document.createElement("div")
  satValBox = document.createElement("div")
  satValCursor = document.createElement("div")
  hueSlider = document.createElement("div")
  hueCursor = document.createElement("div")
  const controlsContainer = document.createElement("div")
  previewBox = document.createElement("div")
  const rgbFields = document.createElement("div")
  const rLabel = document.createElement("label")
  rInput = document.createElement("input")
  const gLabel = document.createElement("label")
  gInput = document.createElement("input")
  const bLabel = document.createElement("label")
  bInput = document.createElement("input")

  // Apply Styles (Original Layout)
  pickerContainer.style.display = "flex"
  pickerContainer.style.width = "100%"
  const satValSize = 150
  satValBox.style.width = `${satValSize}px`
  satValBox.style.height = `${satValSize}px`
  satValBox.style.position = "relative"
  satValBox.style.cursor = "crosshair"
  satValBox.style.overflow = "hidden"
  satValBox.style.background = `linear-gradient(to right, white, transparent), linear-gradient(to top, black, transparent)`
  satValCursor.style.position = "absolute"
  satValCursor.style.width = "10px"
  satValCursor.style.height = "10px"
  satValCursor.style.border = "2px solid white"
  satValCursor.style.borderRadius = "50%"
  satValCursor.style.boxSizing = "border-box"
  satValCursor.style.pointerEvents = "none"
  satValCursor.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.5)"
  satValCursor.style.transform = "translate(-50%, -50%)"
  const hueWidth = 25
  hueSlider.style.width = `${hueWidth}px`
  hueSlider.style.height = `${satValSize}px`
  hueSlider.style.position = "relative"
  hueSlider.style.cursor = "pointer"
  hueSlider.style.marginLeft = "10px"
  hueSlider.style.background =
    "linear-gradient(to bottom, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))"
  hueCursor.style.position = "absolute"
  hueCursor.style.left = "0px"
  hueCursor.style.width = "100%"
  hueCursor.style.height = "4px"
  hueCursor.style.background = "white"
  hueCursor.style.border = "1px solid black"
  hueCursor.style.boxSizing = "border-box"
  hueCursor.style.pointerEvents = "none"
  hueCursor.style.transform = "translateY(-50%)"
  controlsContainer.style.marginLeft = "10px"
  controlsContainer.style.display = "flex"
  controlsContainer.style.flexDirection = "column"
  controlsContainer.style.justifyContent = "center"
  previewBox.style.width = "40px"
  previewBox.style.height = "40px"
  previewBox.style.border = "1px solid #ccc"
  previewBox.style.marginBottom = "10px"
  previewBox.style.alignSelf = "center"
  rgbFields.style.display = "flex"
  rgbFields.style.flexDirection = "column"
  rgbFields.style.gap = "4px"
  rgbFields.style.alignItems = "center"
  const setupInput = (input, label, labelText) => {
    input.type = "number"
    input.min = "0"
    input.max = "255"
    input.style.width = "45px"
    input.style.padding = "3px"
    input.style.border = "1px solid #ccc"
    input.style.fontSize = "0.8em"
    input.style.textAlign = "right"
    label.textContent = labelText
    label.style.display = "flex"
    label.style.alignItems = "center"
    label.style.fontSize = "0.85em"
    label.style.gap = "5px"
    label.appendChild(input)
  }
  setupInput(rInput, rLabel, "R:")
  setupInput(gInput, gLabel, "G:")
  setupInput(bInput, bLabel, "B:")

  // Append Elements
  satValBox.appendChild(satValCursor)
  hueSlider.appendChild(hueCursor)
  rgbFields.appendChild(rLabel)
  rgbFields.appendChild(gLabel)
  rgbFields.appendChild(bLabel)
  controlsContainer.appendChild(previewBox)
  controlsContainer.appendChild(rgbFields)
  pickerContainer.appendChild(satValBox)
  pickerContainer.appendChild(hueSlider)
  pickerContainer.appendChild(controlsContainer)
  targetDiv.appendChild(pickerContainer)

  // Attach Event Listeners
  satValBox.addEventListener("mousedown", (e) => {
    isDraggingSatVal = true
    handleSatValInteraction(e, e.clientX, e.clientY)
    document.addEventListener("mousemove", handleSatValMouseMove)
    document.addEventListener("mouseup", handleSatValMouseUp)
  })
  satValBox.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1) {
        isDraggingSatVal = true
        handleSatValInteraction(e, e.touches[0].clientX, e.touches[0].clientY)
        e.preventDefault()
        document.addEventListener("touchmove", handleSatValTouchMove, {
          passive: false,
        })
        document.addEventListener("touchend", handleSatValTouchEnd)
      }
    },
    { passive: false }
  )
  hueSlider.addEventListener("mousedown", (e) => {
    isDraggingHue = true
    handleHueInteraction(e, e.clientY)
    document.addEventListener("mousemove", handleHueMouseMove)
    document.addEventListener("mouseup", handleHueMouseUp)
  })
  hueSlider.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1) {
        isDraggingHue = true
        handleHueInteraction(e, e.touches[0].clientY)
        e.preventDefault()
        document.addEventListener("touchmove", handleHueTouchMove, {
          passive: false,
        })
        document.addEventListener("touchend", handleHueTouchEnd)
      }
    },
    { passive: false }
  )
  rInput.addEventListener("input", updateColorFromRGB)
  gInput.addEventListener("input", updateColorFromRGB)
  bInput.addEventListener("input", updateColorFromRGB)
  rInput.addEventListener("change", updateColorFromRGB)
  gInput.addEventListener("change", updateColorFromRGB)
  bInput.addEventListener("change", updateColorFromRGB)

  // Initial Update
  rInput.value = currentR
  gInput.value = currentG
  bInput.value = currentB
  // Calculate initial HSV from defaults *before* first UI update
  RGBtoHSV(currentR, currentG, currentB)
  updatePickerUI()
}

// --- Exported Getter Function ---
export function getCurrentRgb() {
  return {
    r: currentR,
    g: currentG,
    b: currentB,
  }
}
