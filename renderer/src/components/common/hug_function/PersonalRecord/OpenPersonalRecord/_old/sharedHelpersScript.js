// renderer/src/components/common/hug_function/PersonalRecord/OpenPersonalRecord/parts/sharedHelpersScript.js

export function getSharedHelpersScript() {
  return String.raw`
    function scrollToElement(element) {
      if (!element) {
        console.warn("[スクロール] 要素がありません")
        return false
      }

      try {
        const rect = element.getBoundingClientRect()
        const scrollTop =
          window.pageYOffset ||
          document.documentElement.scrollTop ||
          0

        const targetPosition =
          rect.top +
          scrollTop -
          150

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth"
        })

        setTimeout(() => {
          window.scrollTo(0, targetPosition)
        }, 100)

        setTimeout(() => {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
          })
        }, 200)

        return true
      } catch (error) {
        console.error("[スクロール] エラー:", error)
        return false
      }
    }

    function highlightElement(element) {
      if (!element) return

      const originalBackground = element.style.backgroundColor
      const originalOutline = element.style.outline
      const originalTransition = element.style.transition

      element.style.transition = "all 0.3s ease"
      element.style.backgroundColor = "#ffff99"
      element.style.outline = "3px solid #ff6b6b"

      setTimeout(() => {
        element.style.backgroundColor = originalBackground || ""
        element.style.outline = originalOutline || ""

        setTimeout(() => {
          element.style.transition = originalTransition || ""
        }, 300)
      }, 3000)
    }

    function resetButton(button, options) {
      setTimeout(() => {
        button.style.backgroundColor = options.backgroundColor
        button.innerText = options.text
        button.style.transform = "translateY(-50%) scale(1)"
      }, options.delay || 2000)
    }
  `
}
