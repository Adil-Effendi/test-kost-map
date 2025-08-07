window.addEventListener("DOMContentLoaded", () => {
  const svgObject = document.getElementById("svgMap");
  const popup = document.getElementById("popup");
  const popupTitle = document.getElementById("popup-title");
  const popupDesc = document.getElementById("popup-desc");
  const popupClose = document.getElementById("popup-close");

  const startSelect = document.getElementById("start-point");
  const endSelect = document.getElementById("end-point");
  const showRouteBtn = document.getElementById("show-route");
  const startNavBtn = document.getElementById("start-navigation");
  const backBtn = document.getElementById("back-to-start");

  let animationFrameId = null;
  let originalViewBox = "";
  let currentActiveEl = null; // untuk menyimpan lokasi aktif

  function animateZoom(svgRoot, fromBox, toBox, duration = 600) {
    const startTime = performance.now();

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function step(currentTime) {
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const interpolated = [
        lerp(fromBox[0], toBox[0], progress),
        lerp(fromBox[1], toBox[1], progress),
        lerp(fromBox[2], toBox[2], progress),
        lerp(fromBox[3], toBox[3], progress),
      ];
      svgRoot.setAttribute("viewBox", interpolated.join(" "));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  popupClose.addEventListener("click", () => {
    popup.classList.add("hidden");

    const svgDoc = svgObject.contentDocument;
    const svgRoot = svgDoc.documentElement;

    const fromBox = svgRoot.getAttribute("viewBox").split(" ").map(Number);
    const toBox = originalViewBox.split(" ").map(Number);
    animateZoom(svgRoot, fromBox, toBox);
  });

  svgObject.addEventListener("load", () => {
    const svgDoc = svgObject.contentDocument;
    const svgRoot = svgDoc.documentElement;

    originalViewBox = svgRoot.getAttribute("viewBox") || "0 0 1000 800";

    const locations = [
      {
        id: "kost-berkah-jaya",
        name: "Kost Berkah Jaya",
        desc: "Kost nyaman untuk pria & wanita.",
      },
      { id: "hutan1", name: "Hutan 1", desc: "Area hutan pertama." },
      { id: "hutan2", name: "Hutan 2", desc: "Area hutan kedua." },
      { id: "hutan3", name: "Hutan 3", desc: "Area hutan ketiga." },
      {
        id: "rumah-warga",
        name: "Rumah Warga",
        desc: "Tempat tinggal warga lokal.",
      },
      {
        id: "kost-wanita",
        name: "Kost Wanita",
        desc: "Khusus untuk penghuni perempuan.",
      },
      {
        id: "ramothy-kost",
        name: "Ramothy Kost",
        desc: "Kost eksklusif di ujung kompleks.",
      },
      {
        id: "_x33_g-kost",
        name: "3G Kost",
        desc: "Kost modern dengan fasilitas lengkap.",
      },
    ];

    const routeLabels = {
      "rumah-warga-ke-kost-wanita": "label-rumah-warga-ke-kost-wanita",
      "kost-berkah-jaya-ke-ramothy-kost":
        "label-kost-berkah-jaya-ke-ramothy-kost",
      "ramothy-kost-ke-kost-wanita": "label-ramothy-kost-ke-kost-wanita",
    };

    locations.forEach((item) => {
      const el = svgDoc.getElementById(item.id);
      const clickable = el?.querySelector("image, path, rect, polygon") || el;

      if (clickable) {
        clickable.style.pointerEvents = "all";
        clickable.style.cursor = "pointer";

        clickable.addEventListener("click", () => {
          // Reset warna lokasi sebelumnya
          if (currentActiveEl) {
            currentActiveEl.classList.remove("active-location");
          }
          // Tandai lokasi yang baru diklik
          clickable.classList.add("active-location");
          currentActiveEl = clickable;

          popupTitle.textContent = item.name;
          popupDesc.textContent = item.desc;
          popup.classList.remove("hidden");

          const bbox = el.getBBox();
          const padding = 300;
          const zoomBox = [
            bbox.x - padding,
            bbox.y - padding,
            bbox.width + padding * 2,
            bbox.height + padding * 2,
          ];
          const fromBox = svgRoot
            .getAttribute("viewBox")
            .split(" ")
            .map(Number);
          animateZoom(svgRoot, fromBox, zoomBox);
        });
      }
    });

    function hideAllRoutes() {
      const allRoutes = svgDoc.querySelectorAll('[id^="route-"]');
      allRoutes.forEach((route) => {
        route.style.display = "none";
        route.classList.remove("animated-route");
      });
    }

    function hideAllLabels() {
      Object.values(routeLabels).forEach((labelId) => {
        const label = svgDoc.getElementById(labelId);
        if (label) {
          label.setAttribute("visibility", "hidden");
        }
      });
    }

    showRouteBtn.addEventListener("click", () => {
      const start = startSelect.value;
      const end = endSelect.value;

      hideAllRoutes();
      hideAllLabels();

      if (start && end && start !== end) {
        const routeKey = `${start}-ke-${end}`;
        const routeId = `route-${routeKey}`;
        const route = svgDoc.getElementById(routeId);

        if (route) {
          route.style.display = "inline";
          route.classList.add("animated-route");

          const labelId = routeLabels[routeKey];
          if (labelId) {
            const label = svgDoc.getElementById(labelId);
            if (label) {
              label.setAttribute("visibility", "visible");
            }
          }
        } else {
          alert("Rute tidak ditemukan. Pastikan ID di SVG sesuaii.");
        }
      }
    });

    startNavBtn.addEventListener("click", () => {
      const start = startSelect.value;
      const end = endSelect.value;
      const routeId = `route-${start}-ke-${end}`;
      const path = svgDoc.getElementById(routeId);
      const icon = svgDoc.getElementById("navigator-icon");

      if (!path || !icon) return alert("Rute atau navigator tidak ditemukan");

      const length = path.getTotalLength();
      let progress = 0;
      icon.setAttribute("visibility", "visible");

      function animate() {
        const point = path.getPointAtLength(progress);
        icon.setAttribute("cx", point.x);
        icon.setAttribute("cy", point.y);

        progress += 1.5;
        if (progress < length) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          icon.setAttribute("visibility", "hidden");
          cancelAnimationFrame(animationFrameId);
        }
      }

      progress = 0;
      animate();
    });

    backBtn.addEventListener("click", () => {
      hideAllRoutes();
      hideAllLabels();

      const icon = svgDoc.getElementById("navigator-icon");
      if (icon) {
        icon.setAttribute("visibility", "hidden");
      }

      // Reset warna aktif
      if (currentActiveEl) {
        currentActiveEl.classList.remove("active-location");
        currentActiveEl = null;
      }

      const fromBox = svgRoot.getAttribute("viewBox").split(" ").map(Number);
      const toBox = originalViewBox.split(" ").map(Number);
      animateZoom(svgRoot, fromBox, toBox);
    });

    hideAllRoutes();
    hideAllLabels();
  });
});
