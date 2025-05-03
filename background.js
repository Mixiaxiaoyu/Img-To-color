// Create context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "showPopup",
    title: "Img To color",
    contexts: ["image", "selection", "link"], // 扩展上下文范围
  });
});

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "showPopup") {
    let imageUrl = info.srcUrl;

    // 如果没有直接获取到图片URL，尝试从选中内容或链接中获取
    if (!imageUrl) {
      if (
        info.selectionText &&
        info.selectionText.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)
      ) {
        imageUrl = info.selectionText;
      } else if (
        info.linkUrl &&
        info.linkUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)
      ) {
        imageUrl = info.linkUrl;
      }
    }

    // 如果仍然没有获取到图片URL，尝试注入脚本获取更多信息
    if (!imageUrl) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => {
            // 优化后的图片查找函数
            const getImageFromElement = (element) => {
              if (!element) return null;

              // 辅助函数：处理 srcset
              const getBehanceImageFromSrcset = (srcset) => {
                if (!srcset) return null;
                const urls = srcset
                  .split(",")
                  .map((s) => s.trim().split(" ")[0])
                  .filter((url) =>
                    url.includes("mir-s3-cdn-cf.behance.net/projects")
                  );
                const maxUrl = urls.find(
                  (url) => url.includes("max_808") || url.includes("/808/")
                );
                return maxUrl || urls[0] || null;
              };

              // 处理 Behance 封面的遮罩层情况
              if (element.classList?.contains("Cover-overlay-r1A")) {
                const parent = element.parentElement;
                if (parent) {
                  const contentDiv = parent.querySelector(".Cover-content-yv3");
                  if (contentDiv) {
                    const picture = contentDiv.querySelector(
                      ".ProjectCoverNeue-picture-NuE"
                    );
                    if (picture) {
                      const webpSource = picture.querySelector(
                        'source[type="image/webp"]'
                      );
                      if (webpSource && webpSource.srcset) {
                        const imageUrl = getBehanceImageFromSrcset(
                          webpSource.srcset
                        );
                        if (imageUrl) return imageUrl;
                      }
                    }
                  }
                }
              }

              // 优先处理 Behance 封面图片
              const behancePicture = element.closest?.(
                ".ProjectCoverNeue-picture-NuE"
              );
              if (behancePicture) {
                // 优先获取 webp 格式
                const webpSource = behancePicture.querySelector(
                  'source[type="image/webp"]'
                );
                if (webpSource && webpSource.srcset) {
                  const imageUrl = getBehanceImageFromSrcset(webpSource.srcset);
                  if (imageUrl) return imageUrl;
                }

                // 回退到 jpg 格式
                const jpgSource = behancePicture.querySelector(
                  'source[type="image/jpg"]'
                );
                if (jpgSource && jpgSource.srcset) {
                  const imageUrl = getBehanceImageFromSrcset(jpgSource.srcset);
                  if (imageUrl) return imageUrl;
                }

                // 最后尝试获取 img 标签
                const img = behancePicture.querySelector(
                  "img.ProjectCoverNeue-image-TFB"
                );
                if (img) return img.src || img.currentSrc;
              }

              // 先检查是否在封面容器内
              const coverParent =
                element.closest?.(".Cover-content-yv3") ||
                element
                  .closest?.("[data-id]")
                  ?.querySelector(".Cover-content-yv3");
              if (coverParent) {
                // 直接尝试获取封面图片，忽略其他元素
                const picture = coverParent.querySelector("picture");
                if (picture) {
                  const sources = picture.querySelectorAll("source[srcset]");
                  for (let source of sources) {
                    const imageUrl = getBehanceImageFromSrcset(source.srcset);
                    if (imageUrl) return imageUrl;
                  }
                }

                // 尝试所有可能的图片元素
                const possibleImages = coverParent.querySelectorAll(
                  'img.ProjectCoverNeue-image-TFB, source[srcset*="mir-s3-cdn-cf.behance.net/projects"]'
                );
                for (const img of possibleImages) {
                  if (img.tagName === "SOURCE") {
                    const imageUrl = getBehanceImageFromSrcset(img.srcset);
                    if (imageUrl) return imageUrl;
                  } else {
                    if (img.src || img.currentSrc)
                      return img.src || img.currentSrc;
                  }
                }
              }

              // ribbon 跳过
              if (
                element.classList &&
                element.classList.contains("rf-ribbon") &&
                element.classList.contains("Feature-ribbon-Tyk")
              ) {
                return null;
              }

              // 处理 .Cover-content-yv3 容器内的图片
              const coverContainer = element.closest?.(".Cover-content-yv3");
              if (coverContainer) {
                // 处理 picture 元素
                const picture = coverContainer.querySelector("picture");
                if (picture) {
                  const sources = picture.querySelectorAll("source[srcset]");
                  for (let source of sources) {
                    const imageUrl = getBehanceImageFromSrcset(source.srcset);
                    if (imageUrl) return imageUrl;
                  }
                  const img = picture.querySelector(
                    "img.ProjectCoverNeue-image-TFB"
                  );
                  if (img) return img.src || img.currentSrc;
                }

                // 处理直接的 img
                const img = coverContainer.querySelector(
                  "img.ProjectCoverNeue-image-TFB"
                );
                if (img) return img.src || img.currentSrc;

                // 处理其他 source 元素
                const sources = coverContainer.querySelectorAll(
                  'source[srcset*="mir-s3-cdn-cf.behance.net/projects"]'
                );
                if (sources.length > 0) {
                  const imageUrl = getBehanceImageFromSrcset(sources[0].srcset);
                  if (imageUrl) return imageUrl;
                }

                // 处理特定的 img
                const coverImg = coverContainer.querySelector(
                  'img.ProjectCoverNeue-image-TFB[src*="mir-s3-cdn-cf.behance.net/projects"]'
                );
                if (coverImg) return coverImg.src || coverImg.currentSrc;
              }

              // 通用图片查找
              if (element.tagName === "PICTURE") {
                const sources = element.getElementsByTagName("source");
                for (let source of sources) {
                  const srcset = source.srcset;
                  if (srcset) {
                    const srcsetUrls = srcset
                      .split(",")
                      .map((s) => s.trim().split(" ")[0])
                      .filter((url) => url);
                    if (srcsetUrls.length > 0) {
                      return srcsetUrls[srcsetUrls.length - 1];
                    }
                  }
                }
              }
              if (element.tagName === "SOURCE") {
                return (
                  element.srcset?.split(",")[0].trim().split(" ")[0] ||
                  element.src
                );
              }
              if (element.tagName === "IMG") {
                return element.src || element.currentSrc || element.dataset.src;
              }

              // 背景图片
              const computedStyle = window.getComputedStyle(element);
              const bgImage = computedStyle.backgroundImage;
              if (bgImage && bgImage !== "none") {
                const urls = bgImage.match(/url\(['"]?([^'"()]+)['"]?\)/g);
                if (urls && urls.length > 0) {
                  return urls[0]
                    .replace(/^url\(['"]?/, "")
                    .replace(/['"]?\)$/, "");
                }
              }

              // data-* 属性
              for (let attr of [
                "data-original",
                "data-src",
                "data-url",
                "data-image",
              ]) {
                if (element.getAttribute(attr)) {
                  return element.getAttribute(attr);
                }
              }

              // 递归查找子元素
              const imgElement = element.querySelector?.(
                'picture, source, img[src], [style*="background-image"]'
              );
              if (imgElement) {
                return imgElement.src || getImageFromElement(imgElement);
              }

              return null;
            };

            const clickX = window.lastRightClickEvent?.clientX || 0;
            const clickY = window.lastRightClickEvent?.clientY || 0;

            const element = document.elementFromPoint(clickX, clickY);
            if (!element) return null;

            // 优先在最近的 .Cover-content-yv3 容器内查找图片
            let imgUrl = getImageFromElement(element);
            if (imgUrl) return imgUrl;

            // 向上查找最近的可能包含图片的容器
            const container = element.closest("a, div, article, figure");
            if (container) {
              imgUrl = getImageFromElement(container);
              if (imgUrl) return imgUrl;
            }

            // 查找周围的图片元素
            const nearbyElements = document.elementsFromPoint(clickX, clickY);
            for (let el of nearbyElements) {
              imgUrl = getImageFromElement(el);
              if (imgUrl) return imgUrl;
            }

            return null;
          },
        },
        (results) => {
          const foundImageUrl = results?.[0]?.result;
          if (foundImageUrl) {
            showModal(foundImageUrl, tab.id);
          }
        }
      );
    } else {
      showModal(imageUrl, tab.id);
    }
  }
});

// 提取显示模态框的逻辑为单独的函数
function showModal(imgUrl, tabId) {
  const processedImgUrl = processBehanceImageUrl(imgUrl);

  chrome.scripting.insertCSS({
    target: { tabId },
    files: ["modal.css"],
  });

  // 添加这段代码
  chrome.scripting.executeScript({
    target: { tabId },
    files: ["modalInteraction.js"],
  });

  chrome.scripting.executeScript({
    target: { tabId },
    args: [processedImgUrl],
    func: (imgUrl) => {
      // 先创建并显示弹窗
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      `;

      // 创建弹窗容器
      const container = document.createElement("div");
      container.className = "container";

      // 立即加载和显示弹窗
      fetch(chrome.runtime.getURL("modal.html"))
        .then((response) => response.text())
        .then((html) => {
          const processedHtml = html.replace(
            "chrome-extension://__MSG_@@extension_id__/modal.css",
            chrome.runtime.getURL("modal.css")
          );
          container.innerHTML = processedHtml;

          // 立即显示图片
          const modalImg = container.querySelector(".left-column img");
          if (modalImg) {
            modalImg.src = imgUrl;
          }

          overlay.appendChild(container);
          document.body.appendChild(overlay);

          // 点击遮罩层关闭弹窗
          overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
              document.body.removeChild(overlay);
            }
          });

          // 异步计算颜色
          setTimeout(() => {
            // K-means聚类算法和其他辅助函数的定义保持不变
            function kMeans(data, k) {
              // 优化1: 使用中位切分法选择初始中心点
              function selectInitialCentroids(data, k) {
                const n = data.length;
                const centroids = [];
                // 选择第一个中心点
                centroids.push(data[Math.floor(Math.random() * n)]);

                // 选择剩余的中心点
                for (let i = 1; i < k; i++) {
                  let maxDistance = -1;
                  let farthest = null;

                  // 找到距离现有中心点最远的点
                  for (let j = 0; j < n; j++) {
                    let minDist = Infinity;
                    for (let c of centroids) {
                      const dist = distance(data[j], c);
                      minDist = Math.min(minDist, dist);
                    }
                    if (minDist > maxDistance) {
                      maxDistance = minDist;
                      farthest = data[j];
                    }
                  }
                  centroids.push(farthest);
                }
                return centroids;
              }

              let centroids = selectInitialCentroids(data, k);
              let oldCentroids = [];
              let iterations = 0;
              const maxIterations = 10; // 优化2: 减少最大迭代次数

              while (iterations < maxIterations) {
                const clusters = Array.from({ length: k }, () => []);

                data.forEach((point) => {
                  let minDist = Infinity;
                  let closestCentroid = 0;

                  centroids.forEach((centroid, i) => {
                    const dist = distance(point, centroid);
                    if (dist < minDist) {
                      minDist = dist;
                      closestCentroid = i;
                    }
                  });

                  clusters[closestCentroid].push(point);
                });

                oldCentroids = [...centroids];

                centroids = clusters.map((cluster) => {
                  if (cluster.length === 0) return oldCentroids[0];
                  return cluster
                    .reduce(
                      (acc, point) => {
                        return acc.map((val, i) => val + point[i]);
                      },
                      [0, 0, 0]
                    )
                    .map((sum) => Math.round(sum / cluster.length));
                });

                if (
                  centroids.every(
                    (centroid, i) => distance(centroid, oldCentroids[i]) < 1
                  )
                ) {
                  break;
                }

                iterations++;
              }

              return centroids;
            }

            function distance(p1, p2) {
              return Math.sqrt(
                p1.reduce((sum, val, i) => sum + Math.pow(val - p2[i], 2), 0)
              );
            }

            const img = new Image();
            img.crossOrigin = "Anonymous";

            img.onload = () => {
              const canvas = document.createElement("canvas");
              const maxSize = 150;
              let width = img.width;
              let height = img.height;

              if (width > height && width > maxSize) {
                height = Math.round((height * maxSize) / width);
                width = maxSize;
              } else if (height > maxSize) {
                width = Math.round((width * maxSize) / height);
                height = maxSize;
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, width, height);

              const imageData = ctx.getImageData(0, 0, width, height);
              const pixels = imageData.data;

              const colors = [];
              const skipPixels = 4;
              for (let i = 0; i < pixels.length; i += 4 * skipPixels) {
                colors.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
              }

              const mainColors = kMeans(colors, 6);

              // 更新颜色显示
              const colorCircles = container.querySelectorAll(
                ".color-circles .color-circle"
              );
              mainColors.forEach((color, index) => {
                if (colorCircles[index]) {
                  const [r, g, b] = color;
                  colorCircles[
                    index
                  ].style.backgroundColor = `rgb(${r},${g},${b})`;
                }
              });
            };

            img.src = imgUrl;
          }, 100); // 延迟100ms开始计算颜色
        })
        .catch((error) => console.error("Error loading modal:", error));
    },
  });
}

// 添加处理 Behance 和 ArtStation 图片 URL 的函数
function processBehanceImageUrl(url) {
  if (!url) return url;

  // 检查是否是 Behance 图片
  if (url.includes("mir-s3-cdn-cf.behance.net")) {
    // 移除 URL 中的协议部分
    const urlWithoutProtocol = url.replace(/^https?:\/\//, "");
    // 构建 images.weserv.nl 代理 URL
    return `https://images.weserv.nl/?url=${encodeURIComponent(
      urlWithoutProtocol
    )}`;
  }
  
  // 检查是否是 ArtStation 图片
  if (url.includes("artstation.com") || url.includes("cdn.artstation.com")) {
    // 移除 URL 中的协议部分
    const urlWithoutProtocol = url.replace(/^https?:\/\//, "");
    // 构建 images.weserv.nl 代理 URL
    return `https://images.weserv.nl/?url=${encodeURIComponent(
      urlWithoutProtocol
    )}`;
  }

  return url;
}

// K-means聚类算法
function kMeans(data, k) {
  // 随机选择初始中心点
  let centroids = data.slice(0, k);
  let oldCentroids = [];
  let iterations = 0;
  const maxIterations = 50;

  while (iterations < maxIterations) {
    // 分配点到最近的中心
    const clusters = Array.from({ length: k }, () => []);

    data.forEach((point) => {
      let minDist = Infinity;
      let closestCentroid = 0;

      centroids.forEach((centroid, i) => {
        const dist = distance(point, centroid);
        if (dist < minDist) {
          minDist = dist;
          closestCentroid = i;
        }
      });

      clusters[closestCentroid].push(point);
    });

    // 保存旧的中心点
    oldCentroids = [...centroids];

    // 更新中心点
    centroids = clusters.map((cluster) => {
      if (cluster.length === 0) return oldCentroids[0];
      return cluster
        .reduce(
          (acc, point) => {
            return acc.map((val, i) => val + point[i]);
          },
          [0, 0, 0]
        )
        .map((sum) => Math.round(sum / cluster.length));
    });

    // 检查是否收敛
    if (
      centroids.every((centroid, i) => distance(centroid, oldCentroids[i]) < 1)
    ) {
      break;
    }

    iterations++;
  }

  return centroids;
}

// 计算两点之间的欧几里得距离
function distance(p1, p2) {
  return Math.sqrt(
    p1.reduce((sum, val, i) => sum + Math.pow(val - p2[i], 2), 0)
  );
}
