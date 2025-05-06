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
  const rgbFields = document.createElement("div") // This will hold the R, G, B rows
  const rLabelElement = document.createElement("label") // Using more specific names for clarity
  rInput = document.createElement("input")
  const gLabelElement = document.createElement("label")
  gInput = document.createElement("input")
  const bLabelElement = document.createElement("label")
  bInput = document.createElement("input")

  // Define fixed widths for consistent layout
  const LABEL_TEXT_PART_WIDTH = "20px" // For "R:", "G:", "B:" text part
  const INPUT_FIELD_PART_WIDTH = "45px"
  const ROW_GAP = "5px" // Gap between text and input within a row
  // Calculate total width for one R/G/B row. Add 1px for potential subpixel rendering or minor inconsistencies.
  const RGB_ROW_TOTAL_WIDTH =
    parseFloat(LABEL_TEXT_PART_WIDTH) +
    parseFloat(ROW_GAP) +
    parseFloat(INPUT_FIELD_PART_WIDTH) +
    1 +
    "px"

  // Apply Styles (Original Layout)
  pickerContainer.style.display = "flex"
  pickerContainer.style.width = "100%" // Let parent determine overall width
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
  //controlsContainer.style.justifyContent = "center" // Vertically centers preview and rgbFields group
  controlsContainer.style.alignItems = "center" // This will center the rgbFields container and previewBox

  previewBox.style.width = RGB_ROW_TOTAL_WIDTH // MODIFIED: Same width as RGB rows container
  previewBox.style.height = "30px" // Adjusted height
  previewBox.style.border = "1px solid #ccc"
  previewBox.style.marginBottom = "10px"
  // previewBox.style.alignSelf = "center"; // Handled by controlsContainer.alignItems

  rgbFields.style.display = "flex"
  rgbFields.style.flexDirection = "column"
  rgbFields.style.gap = "4px" // Gap between R, G, B rows
  rgbFields.style.width = RGB_ROW_TOTAL_WIDTH // MODIFIED: rgbFields container has fixed width

  const setupInputRow = (inputField, labelContainer, labelTextString) => {
    // labelContainer is the <label> element acting as a row container
    labelContainer.style.display = "flex"
    labelContainer.style.alignItems = "center"
    labelContainer.style.gap = ROW_GAP // Gap between text span and input
    // labelContainer.style.width = "100%"; // Let it take full width of rgbFields container
    // No need to set width on labelContainer if rgbFields has a fixed width
    // and labelContainer is a direct child.

    const textSpan = document.createElement("span")
    textSpan.textContent = labelTextString
    textSpan.style.display = "inline-block"
    textSpan.style.width = LABEL_TEXT_PART_WIDTH
    textSpan.style.textAlign = "left"
    textSpan.style.fontSize = "0.85em"
    textSpan.style.flexShrink = "0" // Prevent text from shrinking

    inputField.type = "number"
    inputField.min = "0"
    inputField.max = "255"
    inputField.style.width = INPUT_FIELD_PART_WIDTH
    inputField.style.padding = "3px"
    inputField.style.border = "1px solid #ccc"
    inputField.style.fontSize = "0.8em"
    inputField.style.textAlign = "right"
    inputField.style.boxSizing = "border-box" // Important for width calculation
    // inputField.style.flexGrow = "1"; // Not needed if both parts have fixed width and sum up to parent

    labelContainer.appendChild(textSpan)
    labelContainer.appendChild(inputField)
  }

  setupInputRow(rInput, rLabelElement, "R:")
  setupInputRow(gInput, gLabelElement, "G:")
  setupInputRow(bInput, bLabelElement, "B:")

  // Append Elements
  satValBox.appendChild(satValCursor)
  hueSlider.appendChild(hueCursor)

  // rLabelElement, gLabelElement, bLabelElement are now the styled rows
  rgbFields.appendChild(rLabelElement)
  rgbFields.appendChild(gLabelElement)
  rgbFields.appendChild(bLabelElement)

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
