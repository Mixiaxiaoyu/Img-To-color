// 动态加载 html2canvas
(async function loadHtml2Canvas() {
  if (typeof html2canvas === "undefined") {
    try {
      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("html2canvas.min.js");
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error("Failed to load html2canvas:", error);
    }
  }
})();

// 颜色转换函数
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// 生成配色方案
function generateColorScheme(baseColor, type) {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  let colors = [];

  switch (type) {
    case "类比":
      // 类比色：在色环上相邻的颜色
      colors = [
        hslToHex(hsl.h, hsl.s, hsl.l),
        hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 60) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h - 60 + 360) % 360, hsl.s, hsl.l),
        baseColor,
      ];
      break;
    case "单色":
      // 单色系：改变明度和饱和度
      colors = [
        hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 0.2, 1)),
        hslToHex(hsl.h, Math.min(hsl.s + 0.2, 1), hsl.l),
        hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 0.2, 0)),
        hslToHex(hsl.h, Math.max(hsl.s - 0.2, 0), hsl.l),
        hslToHex(hsl.h, Math.min(hsl.s + 0.1, 1), Math.min(hsl.l + 0.1, 1)),
        baseColor,
      ];
      break;
    case "三原色":
      // 三原色：120度间隔
      colors = [
        baseColor,
        hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, Math.min(hsl.s + 0.1, 1), Math.min(hsl.l + 0.1, 1)),
        hslToHex(
          (hsl.h + 120) % 360,
          Math.min(hsl.s + 0.1, 1),
          Math.min(hsl.l + 0.1, 1)
        ),
        hslToHex(
          (hsl.h + 240) % 360,
          Math.min(hsl.s + 0.1, 1),
          Math.min(hsl.l + 0.1, 1)
        ),
      ];
      break;
    case "互补":
      // 互补色：180度对立
      colors = [
        baseColor,
        hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, Math.min(hsl.s + 0.2, 1), hsl.l),
        hslToHex((hsl.h + 180) % 360, Math.min(hsl.s + 0.2, 1), hsl.l),
        hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 0.2, 1)),
        hslToHex((hsl.h + 180) % 360, hsl.s, Math.min(hsl.l + 0.2, 1)),
      ];
      break;
    case "复合":
      // 复合色：对立色加邻近色
      colors = [
        baseColor,
        hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 150) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 210) % 360, hsl.s, hsl.l),
      ];
      break;
  }
  return colors;
}

// RGB转HSL
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s, l: l };
}

// HSL转RGB然后转Hex
function hslToHex(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, (h + 120) / 360);
    g = hue2rgb(p, q, h / 360);
    b = hue2rgb(p, q, (h - 120) / 360);
  }

  return rgbToHex(
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  );
}

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 复制颜色值到剪贴板
function copyColorToClipboard(color) {
  // 如果颜色是 rgb 格式，转换为 hex
  let hexColor = color;
  if (color.startsWith("rgb")) {
    const rgb = color.match(/\d+/g);
    hexColor = rgbToHex(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
  }

  // 移除可能存在的旧 toast
  const existingToast = document.querySelector(".color-copy-toast");
  if (existingToast) {
    existingToast.remove();
  }

  navigator.clipboard.writeText(hexColor).then(() => {
    const toast = document.createElement("div");
    toast.className = "color-copy-toast";
    toast.textContent = `已复制: ${hexColor}`;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2000);
  });
}

// 将弹窗内容转换为图片并下载
async function captureAndDownloadModal() {
  const container = document.querySelector(".container");
  if (!container) return;

  try {
    // 检查 html2canvas 是否可用
    if (typeof html2canvas === "undefined") {
      throw new Error("html2canvas 库未正确加载");
    }

    // 配置 html2canvas
    const options = {
      scale: 2, // 使用2倍缩放以获得更清晰的图像
      useCORS: true, // 允许加载跨域图片
      backgroundColor: "rgba(255, 255, 255, 0.8)", // 设置与弹窗相同的背景色
      logging: false, // 关闭日志
      allowTaint: true, // 允许图片污染canvas
      foreignObjectRendering: false, // 禁用 foreignObject 渲染以提高兼容性
      removeContainer: false, // 不移除临时创建的容器
      ignoreElements: (element) => {
        // 忽略下载按钮和关闭按钮
        return (
          element.classList.contains("icon-download") ||
          element.classList.contains("icon-close") ||
          element.classList.contains("icon-star")
        );
      },
    };

    // 创建加载提示
    const loadingToast = document.createElement("div");
    loadingToast.className = "color-copy-toast";
    loadingToast.textContent = "正在生成图片...";
    document.body.appendChild(loadingToast);

    try {
      // 使用 html2canvas 捕获弹窗内容
      const canvas = await html2canvas(container, options);

      // 将 canvas 转换为图片
      const dataUrl = canvas.toDataURL("image/png", 1.0);

      // 创建下载链接并触发下载
      const link = document.createElement("a");
      link.download = "color-scheme.png";
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 显示成功提示
      loadingToast.textContent = "图片已保存";
      setTimeout(() => {
        if (document.body.contains(loadingToast)) {
          document.body.removeChild(loadingToast);
        }
      }, 2000);
    } catch (error) {
      console.error("截图过程出错:", error);
      if (document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast);
      }
      throw error;
    }
  } catch (error) {
    console.error("截图失败:", error);

    // 显示错误提示
    const errorToast = document.createElement("div");
    errorToast.className = "color-copy-toast";
    errorToast.textContent = "截图失败，请稍后重试";
    document.body.appendChild(errorToast);
    setTimeout(() => {
      if (document.body.contains(errorToast)) {
        document.body.removeChild(errorToast);
      }
    }, 2000);
  }
}

// 更新事件监听函数
function initializeColorCircles() {
  const colorCircles = document.querySelectorAll(
    ".color-circles .color-circle"
  );
  const choiceButtons = document.querySelectorAll(
    ".choice-buttons .choice-button"
  );
  const secondaryColorBoxes = document.querySelectorAll(".secondary-color-box");
  const gradientRect = document.querySelector(".gradient-color-rect");

  // 用于追踪颜色组合的数组
  let colorPairs = [];
  let currentPairIndex = -1;

  // 创建防抖的双击处理函数
  const debouncedCopyColor = debounce((element) => {
    const color = element.style.backgroundColor;
    if (color) {
      copyColorToClipboard(color);
    }
  }, 300); // 300ms 的防抖时间

  // 为颜色圈添加双击事件
  colorCircles.forEach((circle) => {
    circle.addEventListener("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();
      debouncedCopyColor(circle);
    });
  });

  // 为颜色方块添加双击事件
  secondaryColorBoxes.forEach((box) => {
    box.addEventListener("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();
      debouncedCopyColor(box);
    });
  });

  // 更新渐变色的函数
  function updateGradient() {
    const circles = Array.from(
      document.querySelectorAll(".color-circles .color-circle")
    );

    // 如果颜色组合数组为空或已经用完，重新生成所有可能的组合
    if (currentPairIndex === -1 || currentPairIndex >= colorPairs.length - 1) {
      colorPairs = [];
      // 生成所有可能的颜色组合
      for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
          colorPairs.push([i, j]);
        }
      }
      // 随机打乱颜色组合顺序
      for (let i = colorPairs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [colorPairs[i], colorPairs[j]] = [colorPairs[j], colorPairs[i]];
      }
      currentPairIndex = 0;
    } else {
      currentPairIndex++;
    }

    // 获取当前的颜色组合
    const [index1, index2] = colorPairs[currentPairIndex];
    const color1 = circles[index1].style.backgroundColor;
    const color2 = circles[index2].style.backgroundColor;

    // 更新渐变色矩形
    gradientRect.style.background = `linear-gradient(90deg, ${color1} 0%, ${color2} 100%)`;
  }

  // 添加渐变矩形的点击事件
  if (gradientRect) {
    gradientRect.addEventListener("click", updateGradient);
  }

  // 更新配色方案的函数
  function updateColorScheme() {
    const activeCircle = document.querySelector(".color-circle.active");
    const activeButton = document.querySelector(".choice-button.active");

    if (activeCircle && activeButton) {
      const baseColor = activeCircle.style.backgroundColor;
      const hex =
        "#" +
        baseColor
          .match(/\d+/g)
          .map((x) => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          })
          .join("");

      const colors = generateColorScheme(hex, activeButton.textContent);

      // 更新颜色方块
      secondaryColorBoxes.forEach((box, index) => {
        box.style.backgroundColor = colors[index];
      });

      // 移除这行代码
      // updateGradient();
    }
  }

  colorCircles.forEach((circle) => {
    circle.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      colorCircles.forEach((c) => c.classList.remove("active"));
      this.classList.add("active");

      updateColorScheme();
    });
  });

  choiceButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const wasActiveButton = this.classList.contains("active");
      const buttonType = this.textContent;

      choiceButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      // 如果按钮之前就是激活状态，生成新的变体配色
      if (wasActiveButton) {
        const activeCircle = document.querySelector(".color-circle.active");
        if (activeCircle) {
          const baseColor = activeCircle.style.backgroundColor;
          const hex =
            "#" +
            baseColor
              .match(/\d+/g)
              .map((x) => {
                const hex = parseInt(x).toString(16);
                return hex.length === 1 ? "0" + hex : hex;
              })
              .join("");

          // 根据不同的配色方案类型生成变体
          const colors = generateColorScheme(hex, buttonType).map(
            (color, index) => {
              if (index === 5) return color; // 保持基准色不变
              const rgb = hexToRgb(color);
              const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

              switch (buttonType) {
                case "类比":
                  // 类比色：在色环上相邻的颜色，偏移±10度以保持和谐
                  const analogousOffset = (Math.random() - 0.5) * 20;
                  // 为了保持和谐，同时调整饱和度和明度
                  const analogousS = Math.max(
                    0,
                    Math.min(1, hsl.s + (Math.random() - 0.5) * 0.1)
                  );
                  const analogousL = Math.max(
                    0,
                    Math.min(1, hsl.l + (Math.random() - 0.5) * 0.1)
                  );
                  return hslToHex(
                    (hsl.h + analogousOffset + 360) % 360,
                    analogousS,
                    analogousL
                  );

                case "单色":
                  // 单色系：主要调整饱和度和明度，保持色相不变
                  // 饱和度和明度的变化范围在±0.15，这样可以保持色调的统一性
                  const monoS = Math.max(
                    0,
                    Math.min(1, hsl.s + (Math.random() - 0.5) * 0.3)
                  );
                  const monoL = Math.max(
                    0,
                    Math.min(1, hsl.l + (Math.random() - 0.5) * 0.3)
                  );
                  return hslToHex(hsl.h, monoS, monoL);

                case "三原色":
                  // 三原色：在120度间隔的基础上允许更大范围的变化
                  // 增加色相、饱和度和明度的变化范围
                  const triOffset = (Math.random() - 0.5) * 30; // 增加到±15度
                  const triS = Math.max(
                    0.3,
                    Math.min(1, hsl.s + (Math.random() - 0.5) * 0.4)
                  ); // 增加饱和度变化
                  const triL = Math.max(
                    0.2,
                    Math.min(0.8, hsl.l + (Math.random() - 0.5) * 0.3)
                  ); // 添加明度变化
                  // 确保颜色仍然保持在三原色的基本关系上
                  const baseAngle = Math.floor(hsl.h / 120) * 120; // 将色相吸附到最近的120度倍数
                  const newHue = (baseAngle + triOffset + 360) % 360;
                  return hslToHex(newHue, triS, triL);

                case "互补":
                  // 互补色：在180度对立的基础上只允许±5度的微调
                  // 这样可以保持互补关系的强度
                  const compOffset = (Math.random() - 0.5) * 10;
                  // 可以适当调整饱和度和明度以增加变化
                  const compS = Math.max(
                    0,
                    Math.min(1, hsl.s + (Math.random() - 0.5) * 0.15)
                  );
                  const compL = Math.max(
                    0,
                    Math.min(1, hsl.l + (Math.random() - 0.5) * 0.1)
                  );
                  return hslToHex(
                    (hsl.h + compOffset + 360) % 360,
                    compS,
                    compL
                  );

                case "复合":
                  // 复合色：在原有角度的基础上添加±10度的随机偏移
                  // 复合色方案本身就比较灵活，但仍需保持一定的和谐度
                  const compoundOffset = (Math.random() - 0.5) * 20;
                  // 轻微调整饱和度和明度
                  const compoundS = Math.max(
                    0,
                    Math.min(1, hsl.s + (Math.random() - 0.5) * 0.1)
                  );
                  const compoundL = Math.max(
                    0,
                    Math.min(1, hsl.l + (Math.random() - 0.5) * 0.1)
                  );
                  return hslToHex(
                    (hsl.h + compoundOffset + 360) % 360,
                    compoundS,
                    compoundL
                  );

                default:
                  return color;
              }
            }
          );

          // 更新颜色方块
          secondaryColorBoxes.forEach((box, index) => {
            box.style.backgroundColor = colors[index];
          });
        }
      } else {
        updateColorScheme();
      }
    });
  });

  // 添加星星按钮点击事件
  const starButton = document.querySelector(".icon-star");
  if (starButton) {
    starButton.addEventListener("click", captureAndDownloadModal);
  }

  // 添加关闭按钮点击事件
  const closeButton = document.querySelector(".icon-close");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      const container = document.querySelector(".container").parentElement;
      if (container) {
        container.remove();
      }
    });
  }
}

// 初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeColorCircles);
} else {
  initializeColorCircles();
}

// 检查是否已经存在 observer
if (!window.colorModalObserver) {
  window.colorModalObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        const modal = document.querySelector(".container");
        if (modal) {
          initializeColorCircles();
        }
      }
    });
  });

  window.colorModalObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
