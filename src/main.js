// Import the interface functions from the picker module
import { init as initRgbPicker, getCurrentRgb } from "./rgb-picker.js"

document.addEventListener("DOMContentLoaded", () => {
  // --- Initialize the color picker ---
  initRgbPicker("rgb-picker")

  // --- Notification Element and Logic ---
  const notificationElement = document.getElementById(
    "global-fetch-notification"
  )
  let notificationTimeoutId = null

  function showNotification(message, type) {
    if (!notificationElement) {
      console.error("Notification element not found!")
      return
    }
    if (notificationTimeoutId) clearTimeout(notificationTimeoutId)

    notificationElement.textContent = message
    notificationElement.className = "fetch-notification"
    notificationElement.classList.add(type)

    requestAnimationFrame(() => {
      notificationElement.classList.add("show")
    })

    const visibilityDuration = 1500
    notificationTimeoutId = setTimeout(() => {
      notificationElement.classList.remove("show")
    }, visibilityDuration)
  }

  // --- Common DOM Elements ---
  const presetTabs = document.querySelectorAll(".tab")

  // --- Helper function to reset preset button visuals ---
  function resetAllPresetsVisuals() {
    presetTabs.forEach((ptab) => {
      ptab.classList.remove("active")
    })
  }

  // --- 1. On/Off Switch Logic ---
  let isOnState = true // Default to ON
  const switchOnButton = document.getElementById("switch-on")
  const switchOffButton = document.getElementById("switch-off")

  function updateSwitchVisuals() {
    if (isOnState) {
      switchOnButton.classList.add("active")
      switchOffButton.classList.remove("active")
    } else {
      switchOnButton.classList.remove("active")
      switchOffButton.classList.add("active")
    }
  }

  if (switchOnButton && switchOffButton) {
    switchOnButton.addEventListener("click", () => {
      // Only trigger if state changes
      isOnState = true
      updateSwitchVisuals()
      showNotification("sent", "success") // ADDED Notification
      sendData({ on: true })
    })
    switchOffButton.addEventListener("click", () => {
      // Only trigger if state changes
      isOnState = false
      updateSwitchVisuals()
      showNotification("sent", "success") // ADDED Notification
      sendData({ on: false })
    })
    updateSwitchVisuals() // Initial visual state
  } else {
    console.error("error")
  }

  // --- 2. Slider Value Updates ---
  const sliders = document.querySelectorAll('input[type="range"].slider')
  sliders.forEach((slider) => {
    const valueSpan =
      slider.parentElement.querySelector(
        `span[data-controls="${slider.id}"]`
      ) || slider.nextElementSibling
    if (valueSpan) {
      valueSpan.textContent = slider.value
      slider.addEventListener("input", (event) => {
        valueSpan.textContent = event.target.value
      })
    } else {
      console.warn(`Could not find value span for slider #${slider.id}`)
    }
  })

  // --- 3. Send Button and Preset Logic ---
  const sendButton1 = document.getElementById("send1")
  const sendButton2 = document.getElementById("send2")
  const temperatureSlider = document.getElementById("temperature")
  const brightnessSlider = document.getElementById("brightness")
  const brightnessSlider2 = document.getElementById("brightness2")
  const apiUrl = "https://io.zongzechen.com/ambilatent"

  async function sendData(payload) {
    console.log("Sending data:", payload)
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const errorText = await response.text()
        const displayError = errorText.substring(0, 100)
        console.error(`HTTP error! Status: ${response.status}`, errorText)
        showNotification(
          `Error: ${response.status}${
            displayError ? " - " + displayError : ""
          }`,
          "error"
        )
      } else {
        console.log("Success: Data sent")
        showNotification("sent", "success")
      }
    } catch (error) {
      console.error("Fetch error:", error)
      showNotification("error", "error")
    }
  }

  // Mode 1 Send
  if (sendButton1 && temperatureSlider && brightnessSlider) {
    sendButton1.addEventListener("click", () => {
      resetAllPresetsVisuals() // ADDED: Reset presets
      const payload = {
        mode: "mode1",
        temperature: parseInt(temperatureSlider.value, 10),
        brightness: parseInt(brightnessSlider.value, 10),
        on: isOnState,
      }
      sendData(payload)
    })
  } else {
    console.error("Could not find all elements for Mode 1 send button.")
  }

  // Mode 2 Send
  if (sendButton2 && brightnessSlider2) {
    sendButton2.addEventListener("click", () => {
      resetAllPresetsVisuals() // ADDED: Reset presets
      const { r, g, b } = getCurrentRgb()
      const payload = {
        mode: "mode2",
        r: r,
        g: g,
        b: b,
        brightness: parseInt(brightnessSlider2.value, 10),
        on: isOnState,
      }
      sendData(payload)
    })
  } else {
    console.error("Could not find all elements for Mode 2 send button.")
  }

  // Preset Tab Clicks
  presetTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.dataset.mode
      const isCurrentlyActive = tab.classList.contains("active")

      if (isCurrentlyActive) {
        // Clicking an active preset deactivates it, no data sent
        tab.classList.remove("active")
      } else {
        // Clicking an inactive preset:
        resetAllPresetsVisuals() // Deactivate all others
        tab.classList.add("active") // Activate this one
        if (mode) {
          const payload = {
            mode: mode,
            // 'on' state can be added here too if desired for presets:
            // on: isOnState
          }
          sendData(payload)
        }
      }
    })
  })
}) // End DOMContentLoaded
