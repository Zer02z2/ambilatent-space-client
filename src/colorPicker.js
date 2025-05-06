export default function createColorPicker(targetElementId) {
  const targetDiv = document.getElementById(targetElementId)
  if (!targetDiv) {
    console.error(`Element with ID "${targetElementId}" not found.`)
    return
  }
  targetDiv.innerHTML = "" // Clear existing content

  // --- State Variables ---
  let hue = 0 // 0-360
  let saturation = 100 // 0-100
  let value = 100 // 0-100 (sometimes called brightness)
  let r = 255,
    g = 0,
    b = 0 // Corresponding RGB

  let isDraggingSatVal = false
  let isDraggingHue = false

  // --- Create DOM Elements ---
  const pickerContainer = document.createElement("div")
  const satValBox = document.createElement("div")
  const satValCursor = document.createElement("div")
  const hueSlider = document.createElement("div")
  const hueCursor = document.createElement("div")
  const controlsContainer = document.createElement("div")
  const previewBox = document.createElement("div")
  const rgbFields = document.createElement("div")
  const rLabel = document.createElement("label")
  const rInput = document.createElement("input")
  const gLabel = document.createElement("label")
  const gInput = document.createElement("input")
  const bLabel = document.createElement("label")
  const bInput = document.createElement("input")

  // --- Apply Styles (Inline CSS via JS) ---

  // Main Container
  pickerContainer.style.display = "flex"
  pickerContainer.style.width = "100%" // Take width from targetDiv

  // Saturation/Value Box
  const satValSize = 200 // Size of the square box
  satValBox.style.width = `${satValSize}px`
  satValBox.style.height = `${satValSize}px`
  satValBox.style.position = "relative"
  satValBox.style.cursor = "crosshair"
  satValBox.style.overflow = "hidden" // Ensure gradients don't bleed out
  // Background gradients: one for saturation (white->color), one for value (transparent->black)
  // The base color is set dynamically based on hue
  satValBox.style.background = `linear-gradient(to right, white, transparent), linear-gradient(to top, black, transparent)`

  // Saturation/Value Cursor
  satValCursor.style.position = "absolute"
  satValCursor.style.width = "10px"
  satValCursor.style.height = "10px"
  satValCursor.style.border = "2px solid white"
  satValCursor.style.borderRadius = "50%"
  satValCursor.style.boxSizing = "border-box"
  satValCursor.style.pointerEvents = "none" // Prevent interference with clicks
  satValCursor.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.5)" // Make it visible on light colors
  satValCursor.style.transform = "translate(-50%, -50%)" // Center on position

  // Hue Slider
  const hueWidth = 25
  hueSlider.style.width = `${hueWidth}px`
  hueSlider.style.height = `${satValSize}px`
  hueSlider.style.position = "relative"
  hueSlider.style.cursor = "pointer"
  hueSlider.style.marginLeft = "15px"
  hueSlider.style.background =
    "linear-gradient(to bottom, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))"

  // Hue Cursor
  hueCursor.style.position = "absolute"
  hueCursor.style.left = "0px"
  hueCursor.style.width = "100%"
  hueCursor.style.height = "4px"
  hueCursor.style.background = "white"
  hueCursor.style.border = "1px solid black"
  hueCursor.style.boxSizing = "border-box"
  hueCursor.style.pointerEvents = "none"
  hueCursor.style.transform = "translateY(-50%)" // Center vertically

  // Controls Area (Preview + Inputs)
  controlsContainer.style.marginLeft = "15px"
  controlsContainer.style.display = "flex"
  controlsContainer.style.flexDirection = "column"

  // Preview Box
  previewBox.style.width = "50px"
  previewBox.style.height = "50px"
  previewBox.style.border = "1px solid #ccc"
  previewBox.style.marginBottom = "10px"

  // RGB Fields Container
  rgbFields.style.display = "flex"
  rgbFields.style.flexDirection = "column"
  rgbFields.style.gap = "5px" // Space between input rows

  // RGB Input Styling (Common)
  const setupInput = (input, label, labelText) => {
    input.type = "number"
    input.min = "0"
    input.max = "255"
    input.style.width = "50px" // Adjust width as needed
    input.style.padding = "4px"
    input.style.border = "1px solid #ccc"
    input.style.marginRight = "5px"
    label.textContent = labelText
    label.style.display = "inline-block" // Or use flex for alignment
    label.style.width = "15px" // Align labels
    label.appendChild(input)
  }

  setupInput(rInput, rLabel, "R:")
  setupInput(gInput, gLabel, "G:")
  setupInput(bInput, bLabel, "B:")

  // --- Append Elements ---
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

  // --- Color Conversion Functions ---

  // From https://stackoverflow.com/a/54070620/1493461 with slight modifications
  function HSVtoRGB(h, s, v) {
    s /= 100
    v /= 100
    let f = (n, k = (n + h / 60) % 6) =>
      v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)
    return {
      r: Math.round(f(5) * 255),
      g: Math.round(f(3) * 255),
      b: Math.round(f(1) * 255),
    }
  }

  // From https://stackoverflow.com/a/54070620/1493461 with slight modifications
  function RGBtoHSV(r, g, b) {
    r /= 255
    g /= 255
    b /= 255
    let v = Math.max(r, g, b),
      c = v - Math.min(r, g, b)
    let h =
      c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c)
    return {
      h: Math.round(60 * (h < 0 ? h + 6 : h)) % 360, // Ensure h is 0-359
      s: Math.round((v && c / v) * 100),
      v: Math.round(v * 100),
    }
  }

  // --- Update Functions ---

  function updatePickerUI() {
    // Update Sat/Val Box background color based on hue
    satValBox.style.backgroundColor = `hsl(${hue}, 100%, 50%)`

    // Update Preview Box
    previewBox.style.backgroundColor = `rgb(${r}, ${g}, ${b})`

    // Update Sat/Val Cursor position
    const satValX = (saturation / 100) * satValSize
    const satValY = (1 - value / 100) * satValSize
    satValCursor.style.left = `${satValX}px`
    satValCursor.style.top = `${satValY}px`
    // Update cursor border color based on perceived brightness
    satValCursor.style.borderColor = value > 50 ? "black" : "white"

    // Update Hue Cursor position
    const hueY = (hue / 360) * satValSize
    hueCursor.style.top = `${hueY}px`

    // Update RGB Input fields (if not currently being edited)
    if (document.activeElement !== rInput) rInput.value = r
    if (document.activeElement !== gInput) gInput.value = g
    if (document.activeElement !== bInput) bInput.value = b
  }

  function updateColorFromHSV() {
    const rgbColor = HSVtoRGB(hue, saturation, value)
    r = rgbColor.r
    g = rgbColor.g
    b = rgbColor.b
    updatePickerUI()
  }

  function updateColorFromRGB() {
    const hsvColor = RGBtoHSV(r, g, b)
    // Only update hue if color isn't grayscale (saturation > 0)
    if (hsvColor.s > 0) {
      hue = hsvColor.h
    }
    saturation = hsvColor.s
    value = hsvColor.v
    updatePickerUI()
  }

  // --- Event Handlers ---

  function handleSatValInteraction(event) {
    event.preventDefault() // Prevent text selection during drag
    const rect = satValBox.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top

    // Clamp coordinates within the box boundaries
    x = Math.max(0, Math.min(satValSize, x))
    y = Math.max(0, Math.min(satValSize, y))

    saturation = Math.round((x / satValSize) * 100)
    value = Math.round((1 - y / satValSize) * 100)

    updateColorFromHSV()
  }

  function handleHueInteraction(event) {
    event.preventDefault()
    const rect = hueSlider.getBoundingClientRect()
    let y = event.clientY - rect.top

    // Clamp coordinate
    y = Math.max(0, Math.min(satValSize, y))

    hue = Math.round((y / satValSize) * 360)
    if (hue === 360) hue = 0 // Keep hue in 0-359 range

    updateColorFromHSV()
  }

  // Sat/Val Mouse Events
  satValBox.addEventListener("mousedown", (e) => {
    isDraggingSatVal = true
    handleSatValInteraction(e)
    document.addEventListener("mousemove", handleSatValMouseMove)
    document.addEventListener("mouseup", handleSatValMouseUp)
  })

  function handleSatValMouseMove(e) {
    if (isDraggingSatVal) {
      handleSatValInteraction(e)
    }
  }

  function handleSatValMouseUp() {
    if (isDraggingSatVal) {
      isDraggingSatVal = false
      document.removeEventListener("mousemove", handleSatValMouseMove)
      document.removeEventListener("mouseup", handleSatValMouseUp)
    }
  }
  // Add touch event support for Sat/Val Box
  satValBox.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1) {
        isDraggingSatVal = true
        handleSatValInteraction(e.touches[0])
        // Prevent scrolling while dragging
        e.preventDefault()
        document.addEventListener("touchmove", handleSatValTouchMove, {
          passive: false,
        })
        document.addEventListener("touchend", handleSatValTouchEnd)
      }
    },
    { passive: false }
  ) // Need passive: false to call preventDefault

  function handleSatValTouchMove(e) {
    if (isDraggingSatVal && e.touches.length === 1) {
      handleSatValInteraction(e.touches[0])
      // Prevent scrolling while dragging
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

  // Hue Slider Mouse Events
  hueSlider.addEventListener("mousedown", (e) => {
    isDraggingHue = true
    handleHueInteraction(e)
    document.addEventListener("mousemove", handleHueMouseMove)
    document.addEventListener("mouseup", handleHueMouseUp)
  })

  function handleHueMouseMove(e) {
    if (isDraggingHue) {
      handleHueInteraction(e)
    }
  }

  function handleHueMouseUp() {
    if (isDraggingHue) {
      isDraggingHue = false
      document.removeEventListener("mousemove", handleHueMouseMove)
      document.removeEventListener("mouseup", handleHueMouseUp)
    }
  }
  // Add touch event support for Hue Slider
  hueSlider.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1) {
        isDraggingHue = true
        handleHueInteraction(e.touches[0])
        e.preventDefault() // Prevent scrolling
        document.addEventListener("touchmove", handleHueTouchMove, {
          passive: false,
        })
        document.addEventListener("touchend", handleHueTouchEnd)
      }
    },
    { passive: false }
  )

  function handleHueTouchMove(e) {
    if (isDraggingHue && e.touches.length === 1) {
      handleHueInteraction(e.touches[0])
      e.preventDefault() // Prevent scrolling
    }
  }
  function handleHueTouchEnd() {
    if (isDraggingHue) {
      isDraggingHue = false
      document.removeEventListener("touchmove", handleHueTouchMove)
      document.removeEventListener("touchend", handleHueTouchEnd)
    }
  }

  // RGB Input Event Handlers
  function handleRgbInputChange() {
    let rVal = parseInt(rInput.value, 10)
    let gVal = parseInt(gInput.value, 10)
    let bVal = parseInt(bInput.value, 10)

    // Validate and clamp values
    rVal = isNaN(rVal) ? r : Math.max(0, Math.min(255, rVal))
    gVal = isNaN(gVal) ? g : Math.max(0, Math.min(255, gVal))
    bVal = isNaN(bVal) ? b : Math.max(0, Math.min(255, bVal))

    // Only update if values are valid and different
    if (rVal !== r || gVal !== g || bVal !== b) {
      r = rVal
      g = gVal
      b = bVal
      updateColorFromRGB()
    }
    // Update input fields in case they were invalid/clamped
    rInput.value = r
    gInput.value = g
    bInput.value = b
  }

  rInput.addEventListener("input", handleRgbInputChange)
  gInput.addEventListener("input", handleRgbInputChange)
  bInput.addEventListener("input", handleRgbInputChange)
  // Also update on 'change' in case user uses arrow keys etc.
  rInput.addEventListener("change", handleRgbInputChange)
  gInput.addEventListener("change", handleRgbInputChange)
  bInput.addEventListener("change", handleRgbInputChange)

  // --- Initial Setup ---
  updateColorFromHSV() // Set initial color and UI state
}
