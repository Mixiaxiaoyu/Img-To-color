window.addEventListener("load", () => {
  // 初始化所有元素为隐藏状态
  gsap.set(".text-content h1", { opacity: 0, y: 30, splitText: true });
  gsap.set(".text-content p", { opacity: 0 });
  gsap.set(".banner-image", { opacity: 0 });
  gsap.set(".three-images img", { opacity: 0 });
  gsap.set(".features", { opacity: 0 });
  gsap.set(".annotation", { opacity: 0 });

  // 创建 Intersection Observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;

          // 根据不同的元素触发不同的动画
          if (target.classList.contains("text-content")) {
            // 标题动画
            gsap.to(".text-content h1", {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: "power2.out",
              onComplete: () => {
                // 在h1动画完成后开始图片循环动画
                startImageSequence();
              },
            });

            // 标题中的color文字特殊动画
            gsap.from(".color-text", {
              opacity: 0,
              y: 20,
              duration: 0.8,
              stagger: 0.2,
              ease: "back.out(1.7)",
              delay: 0.3,
            });

            gsap.to(".text-content p", {
              opacity: 1,
              duration: 0.8,
              y: 0,
              ease: "power2.out",
              delay: 0.4,
            });
          }

          if (target.classList.contains("banner-image")) {
            gsap.to(target, {
              opacity: 1,
              duration: 0.8,
              scale: 1,
              ease: "power2.out",
            });

            // 为色块添加入场动画
            gsap.from("#colorBlocks rect, #colorBlocks path", {
              opacity: 0,
              scale: 0.8,
              rotation: "random(-45, 45)",
              duration: 0.8,
              stagger: 0.1,
              ease: "back.out(1.7)",
            });
          }

          if (target.classList.contains("features")) {
            gsap.to(target, {
              opacity: 1,
              duration: 0.8,
              y: 0,
              ease: "power2.out",
            });

            // 为标题和描述添加入场动画
            gsap.from(".features h1", {
              opacity: 0,
              y: 30,
              duration: 0.8,
              ease: "back.out(1.7)",
            });

            gsap.from(".features p", {
              opacity: 0,
              y: 20,
              duration: 0.8,
              delay: 0.2,
              ease: "power2.out",
            });
          }

          if (target.classList.contains("feature-points")) {
            // 确保所有内容都是可见的
            const featurePoints = document.querySelectorAll(
              ".feature-points > div"
            );

            featurePoints.forEach((point, index) => {
              // 设置初始状态
              gsap.set(point, {
                opacity: 0,
                x: -50,
              });

              // 创建显示动画
              gsap.to(point, {
                opacity: 1,
                x: 0,
                duration: 0.8,
                delay: index * 0.2,
                ease: "back.out(1.7)",
              });

              // 为每个功能点的标题添加动画
              const title = point.querySelector("h3");
              gsap.from(title, {
                opacity: 0,
                y: 20,
                duration: 0.8,
                delay: index * 0.2 + 0.3,
                ease: "power2.out",
              });

              // 为每个功能点的段落添加动画
              const paragraphs = point.querySelectorAll("p");
              paragraphs.forEach((p, pIndex) => {
                gsap.from(p, {
                  opacity: 0,
                  y: 20,
                  duration: 0.8,
                  delay: index * 0.2 + 0.4 + pIndex * 0.1,
                  ease: "power2.out",
                });
              });
            });
          }

          if (target.classList.contains("annotation")) {
            gsap.to(target, {
              opacity: 1,
              duration: 0.8,
              ease: "power2.out",
            });

            // 为注释部分添加入场动画
            gsap.from(".annotation h1", {
              opacity: 0,
              y: 30,
              duration: 0.8,
              ease: "back.out(1.7)",
            });

            gsap.from(".annotation p", {
              opacity: 0,
              y: 20,
              duration: 0.8,
              stagger: 0.2,
              delay: 0.2,
              ease: "power2.out",
            });
          }

          // 一旦元素出现过，就不再观察它
          observer.unobserve(target);
        }
      });
    },
    {
      threshold: 0.1, // 当元素10%进入视口时触发
    }
  );

  // 观察需要动画的元素
  document
    .querySelectorAll(
      ".text-content, .banner-image, .three-images img, .features, .feature-points, .annotation"
    )
    .forEach((element) => {
      observer.observe(element);
    });

  // 鼠标跟随动画
  const cursorFollower = document.querySelector(".cursor-follower");
  let mouseX = 0;
  let mouseY = 0;
  let cursorX = 0;
  let cursorY = 0;

  // 初始化鼠标跟随圆圈
  gsap.set(cursorFollower, {
    xPercent: -50,
    yPercent: -50,
    opacity: 0,
  });

  // 监听鼠标移动
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // 显示鼠标跟随圆圈
    gsap.to(cursorFollower, {
      duration: 0.1,
      opacity: 1,
    });
  });

  // 监听鼠标移出页面
  document.addEventListener("mouseleave", () => {
    gsap.to(cursorFollower, {
      duration: 0.1,
      opacity: 0,
    });
  });

  // 平滑动画
  gsap.ticker.add(() => {
    const speed = 0.15;
    cursorX += (mouseX - cursorX) * speed;
    cursorY += (mouseY - cursorY) * speed;

    gsap.set(cursorFollower, {
      x: cursorX,
      y: cursorY,
    });
  });

  const colorBlocks = document.querySelectorAll(
    "#colorBlocks rect, #colorBlocks path"
  );
  const descriptionText = document.querySelector(".text-content p");
  const titleElement = document.querySelector(".text-content h1");
  const colorTexts = document.querySelectorAll(".color-text");
  const originalPositions = [];

  // 图片序列动画
  const threeImages = document.querySelectorAll(".three-images img");

  function startImageSequence() {
    let currentIndex = 0;
    threeImages[currentIndex].style.opacity = "1";

    function switchImage() {
      threeImages[currentIndex].style.opacity = "0";
      currentIndex = (currentIndex + 1) % threeImages.length;
      threeImages[currentIndex].style.opacity = "1";

      // 根据是否是最后一张图片来决定下一次切换的时间
      const delay = currentIndex === threeImages.length - 1 ? 2000 : 1000;
      setTimeout(switchImage, delay);
    }

    setTimeout(switchImage, 1000);
  }

  // 功能点悬浮动画
  const featurePoints = document.querySelectorAll(".feature-points > div");

  featurePoints.forEach((point) => {
    const circle = point.querySelector(".hover-circle");
    const text = point.querySelector(".hover-text");
    const content = point.querySelectorAll("h3, p");

    const containerWidth = point.offsetWidth;
    const containerHeight = point.offsetHeight;
    const scaleFactor = (Math.max(containerWidth, containerHeight) * 3) / 20;

    const hoverAnimation = gsap.timeline({ paused: true });

    hoverAnimation
      .to(circle, {
        duration: 0.3,
        scale: scaleFactor,
        opacity: 1,
        ease: "power1.out",
      })
      .to(
        text,
        {
          duration: 0.2,
          opacity: 1,
          ease: "power1.out",
        },
        "-=0.1"
      )
      .to(
        content,
        {
          duration: 0.2,
          opacity: 0,
          ease: "power1.out",
        },
        "-=0.2"
      );

    point.addEventListener("mouseenter", () => {
      hoverAnimation.timeScale(1).play();
    });

    point.addEventListener("mouseleave", () => {
      hoverAnimation.timeScale(1.2).reverse();
      // Add animation to restore content opacity
      gsap.to(content, {
        duration: 0.2,
        opacity: 1,
        ease: "power1.out",
        delay: 0.2,
      });
    });
  });

  // Store original positions
  colorBlocks.forEach((block) => {
    const bbox = block.getBBox();
    originalPositions.push({
      x: bbox.x,
      y: bbox.y,
    });
  });

  // Color text animation
  let colorAnimation;
  titleElement.addEventListener("mouseenter", () => {
    colorAnimation = gsap.to(colorTexts, {
      duration: 0.4,
      color: gsap.utils.wrap(["#FF3366", "#33FF66", "#3366FF"]),
      stagger: {
        each: 0.1,
        repeat: -1,
        yoyo: true,
      },
      ease: "power2.out",
    });
  });

  titleElement.addEventListener("mouseleave", () => {
    if (colorAnimation) {
      colorAnimation.kill();
    }
    gsap.to(colorTexts, {
      duration: 0.4,
      color: "#030020",
      ease: "power2.out",
    });
  });

  // Text hover animation
  descriptionText.addEventListener("mouseenter", () => {
    gsap.to(descriptionText, {
      duration: 0.4,
      fontWeight: 700,
      ease: "power2.out",
    });
  });

  descriptionText.addEventListener("mouseleave", () => {
    gsap.to(descriptionText, {
      duration: 0.4,
      fontWeight: 400,
      ease: "power2.out",
    });
  });

  // Mouse hover animation for blocks
  document.querySelector(".banner-image").addEventListener("mouseenter", () => {
    gsap.to(colorBlocks, {
      duration: 0.8,
      x: "random(-100, 100)",
      y: "random(-100, 100)",
      rotation: "random(-45, 45)",
      ease: "power2.out",
      stagger: {
        amount: 0.3,
      },
    });
  });

  // Mouse leave animation for blocks
  document.querySelector(".banner-image").addEventListener("mouseleave", () => {
    colorBlocks.forEach((block, index) => {
      gsap.to(block, {
        duration: 0.8,
        x: 0,
        y: 0,
        rotation: 0,
        ease: "power2.inOut",
      });
    });
  });
});
