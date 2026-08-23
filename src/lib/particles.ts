/* -----------------------------------------------
/* Author : Vincent Garreau  - vincentgarreau.com
/* MIT license: http://opensource.org/licenses/MIT
/* Demo / Generator : vincentgarreau.com/particles.js
/* GitHub : github.com/VincentGarreau/particles.js
/* v2.0.0
/* ----------------------------------------------- */

/* eslint-disable */
// @ts-nocheck

const pJSDom: any[] = [];

function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function clamp(number: number, min: number, max: number) {
  return Math.min(Math.max(number, min), max);
}

function isInArray(value: any, array: any) {
  return array.indexOf(value) > -1;
}

function deepExtend(destination: any, source: any) {
  for (const property in source) {
    if (
      source[property] &&
      source[property].constructor &&
      source[property].constructor === Object
    ) {
      destination[property] = destination[property] || {};
      deepExtend(destination[property], source[property]);
    } else {
      destination[property] = source[property];
    }
  }
  return destination;
}

const pJS = function (this: any, tag_id: string, params: any) {
  const pJS_tag = document.getElementById(tag_id);
  if (!pJS_tag) return;
  const canvas_el = pJS_tag.querySelector<HTMLCanvasElement>(".particles-js-canvas-el");
  if (!canvas_el) return;

  this.pJS = {
    canvas: {
      el: canvas_el,
      w: canvas_el.offsetWidth,
      h: canvas_el.offsetHeight,
      ctx: canvas_el.getContext("2d"),
      pxratio: 1,
    },
    particles: {
      number: {
        value: 400,
        density: {
          enable: true,
          value_area: 800,
        },
      },
      color: {
        value: "#fff",
      },
      shape: {
        type: "circle",
        stroke: {
          width: 0,
          color: "#ff0000",
        },
        polygon: {
          nb_sides: 5,
        },
        image: {
          src: "",
          width: 100,
          height: 100,
        },
      },
      opacity: {
        value: 1,
        random: false,
        anim: {
          enable: false,
          speed: 2,
          opacity_min: 0,
          sync: false,
        },
      },
      size: {
        value: 20,
        random: false,
        anim: {
          enable: false,
          speed: 20,
          size_min: 0,
          sync: false,
        },
      },
      line_linked: {
        enable: true,
        distance: 100,
        color: "#fff",
        opacity: 1,
        width: 1,
        color_rgb_line: { r: 255, g: 255, b: 255 },
      },
      move: {
        enable: true,
        speed: 2,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
        bounce: false,
        attract: {
          enable: false,
          rotateX: 3000,
          rotateY: 3000,
        },
      },
      array: [],
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: {
          enable: true,
          mode: "grab",
        },
        onclick: {
          enable: true,
          mode: "push",
        },
        resize: true,
      },
      modes: {
        grab: {
          distance: 100,
          line_linked: {
            opacity: 1,
          },
        },
        bubble: {
          distance: 200,
          size: 80,
          duration: 0.4,
        },
        repulse: {
          distance: 200,
          duration: 0.4,
        },
        push: {
          particles_nb: 4,
        },
        remove: {
          particles_nb: 2,
        },
      },
      mouse: {
        pos_x: null,
        pos_y: null,
        click_pos_x: null,
        click_pos_y: null,
        click_time: null,
      },
    },
    retina_detect: false,
    fn: {
      interact: {} as any,
      modes: {} as any,
      vendors: {} as any,
    },
    tmp: {} as any,
  };

  const pJS = this.pJS;

  if (params) {
    deepExtend(pJS, params);
  }

  pJS.tmp.obj = {
    size_value: pJS.particles.size.value,
    size_anim_speed: pJS.particles.size.anim.speed,
    move_speed: pJS.particles.move.speed,
    line_linked_distance: pJS.particles.line_linked.distance,
    line_linked_width: pJS.particles.line_linked.width,
    mode_grab_distance: pJS.interactivity.modes.grab.distance,
    mode_bubble_distance: pJS.interactivity.modes.bubble.distance,
    mode_bubble_size: pJS.interactivity.modes.bubble.size,
    mode_repulse_distance: pJS.interactivity.modes.repulse.distance,
  };

  pJS.fn.retinaInit = function () {
    if (pJS.retina_detect && window.devicePixelRatio > 1) {
      pJS.canvas.pxratio = window.devicePixelRatio;
      pJS.tmp.retina = true;
    } else {
      pJS.canvas.pxratio = 1;
      pJS.tmp.retina = false;
    }

    pJS.canvas.w = pJS.canvas.el.offsetWidth * pJS.canvas.pxratio;
    pJS.canvas.h = pJS.canvas.el.offsetHeight * pJS.canvas.pxratio;

    pJS.particles.size.value = pJS.tmp.obj.size_value * pJS.canvas.pxratio;
    pJS.particles.size.anim.speed = pJS.tmp.obj.size_anim_speed * pJS.canvas.pxratio;
    pJS.particles.move.speed = pJS.tmp.obj.move_speed * pJS.canvas.pxratio;
    pJS.particles.line_linked.distance = pJS.tmp.obj.line_linked_distance * pJS.canvas.pxratio;
    pJS.interactivity.modes.grab.distance = pJS.tmp.obj.mode_grab_distance * pJS.canvas.pxratio;
    pJS.interactivity.modes.bubble.distance = pJS.tmp.obj.mode_bubble_distance * pJS.canvas.pxratio;
    pJS.particles.line_linked.width = pJS.tmp.obj.line_linked_width * pJS.canvas.pxratio;
    pJS.interactivity.modes.bubble.size = pJS.tmp.obj.mode_bubble_size * pJS.canvas.pxratio;
    pJS.interactivity.modes.repulse.distance = pJS.tmp.obj.mode_repulse_distance * pJS.canvas.pxratio;
  };

  pJS.fn.canvasInit = function () {
    pJS.canvas.ctx = pJS.canvas.el.getContext("2d");
  };

  pJS.fn.canvasSize = function () {
    pJS.canvas.el.width = pJS.canvas.w;
    pJS.canvas.el.height = pJS.canvas.h;

    if (pJS && pJS.interactivity.events.resize) {
      pJS.fn.vendors.resizeListener = function () {
        pJS.canvas.w = pJS.canvas.el.offsetWidth;
        pJS.canvas.h = pJS.canvas.el.offsetHeight;

        if (pJS.tmp.retina) {
          pJS.canvas.w *= pJS.canvas.pxratio;
          pJS.canvas.h *= pJS.canvas.pxratio;
        }

        pJS.canvas.el.width = pJS.canvas.w;
        pJS.canvas.el.height = pJS.canvas.h;

        if (!pJS.particles.move.enable) {
          pJS.fn.particlesEmpty();
          pJS.fn.particlesCreate();
          pJS.fn.particlesDraw();
          pJS.fn.vendors.densityAutoParticles();
        }

        pJS.fn.vendors.densityAutoParticles();
      };
      window.addEventListener("resize", pJS.fn.vendors.resizeListener);
    }
  };

  pJS.fn.canvasPaint = function () {
    // Keep background transparent so it doesn't cover UI
    pJS.canvas.ctx.clearRect(0, 0, pJS.canvas.w, pJS.canvas.h);
  };

  pJS.fn.canvasClear = function () {
    pJS.canvas.ctx.clearRect(0, 0, pJS.canvas.w, pJS.canvas.h);
  };

  pJS.fn.particle = function (this: any, color: any, opacity: number, position?: any) {
    this.radius = (pJS.particles.size.random ? Math.random() : 1) * pJS.particles.size.value;
    if (pJS.particles.size.anim.enable) {
      this.size_status = false;
      this.vs = pJS.particles.size.anim.speed / 100;
      if (!pJS.particles.size.anim.sync) {
        this.vs = this.vs * Math.random();
      }
    }

    this.x = position ? position.x : Math.random() * pJS.canvas.w;
    this.y = position ? position.y : Math.random() * pJS.canvas.h;

    if (this.x > pJS.canvas.w - this.radius * 2) this.x = this.x - this.radius;
    else if (this.x < this.radius * 2) this.x = this.x + this.radius;
    if (this.y > pJS.canvas.h - this.radius * 2) this.y = this.y - this.radius;
    else if (this.y < this.radius * 2) this.y = this.y + this.radius;

    if (pJS.particles.move.bounce) {
      pJS.fn.vendors.checkOverlap(this, position);
    }

    this.color = {} as any;
    if (typeof color.value === "object") {
      if (color.value instanceof Array) {
        const color_selected = color.value[Math.floor(Math.random() * pJS.particles.color.value.length)];
        this.color.rgb = hexToRgb(color_selected);
      } else {
        if (color.value.r !== undefined && color.value.g !== undefined && color.value.b !== undefined) {
          this.color.rgb = { r: color.value.r, g: color.value.g, b: color.value.b };
        }
      }
    } else if (typeof color.value === "string") {
      this.color.rgb = hexToRgb(color.value);
    }

    this.opacity = (pJS.particles.opacity.random ? Math.random() : 1) * pJS.particles.opacity.value;
    if (pJS.particles.opacity.anim.enable) {
      this.opacity_status = false;
      this.vo = pJS.particles.opacity.anim.speed / 100;
      if (!pJS.particles.opacity.anim.sync) {
        this.vo = this.vo * Math.random();
      }
    }

    let v_rnd = {} as any;
    switch (pJS.particles.move.direction) {
      case "top":
        v_rnd = { x: 0, y: -1 };
        break;
      case "top-right":
        v_rnd = { x: 0.5, y: -0.5 };
        break;
      case "right":
        v_rnd = { x: 1, y: -0 };
        break;
      case "bottom-right":
        v_rnd = { x: 0.5, y: 0.5 };
        break;
      case "bottom":
        v_rnd = { x: 0, y: 1 };
        break;
      case "bottom-left":
        v_rnd = { x: -0.5, y: 1 };
        break;
      case "left":
        v_rnd = { x: -1, y: 0 };
        break;
      case "top-left":
        v_rnd = { x: -0.5, y: -0.5 };
        break;
      default:
        v_rnd = { x: 0, y: 0 };
        break;
    }

    if (pJS.particles.move.straight) {
      this.vx = v_rnd.x;
      this.vy = v_rnd.y;
      if (pJS.particles.move.random) {
        this.vx = this.vx * Math.random();
        this.vy = this.vy * Math.random();
      }
    } else {
      this.vx = v_rnd.x + Math.random() - 0.5;
      this.vy = v_rnd.y + Math.random() - 0.5;
    }

    this.vx_i = this.vx;
    this.vy_i = this.vy;
  };

  pJS.fn.particle.prototype.draw = function () {
    const p = this;
    let radius = p.radius_bubble !== undefined ? p.radius_bubble : p.radius;
    let opacity = p.opacity_bubble !== undefined ? p.opacity_bubble : p.opacity;

    let color_value = "";
    if (p.color.rgb) {
      color_value = `rgba(${p.color.rgb.r},${p.color.rgb.g},${p.color.rgb.b},${opacity})`;
    } else {
      color_value = `rgba(${p.color.hsl.h},${p.color.hsl.s}%,${p.color.hsl.l}%,${opacity})`;
    }

    pJS.canvas.ctx.fillStyle = color_value;
    pJS.canvas.ctx.beginPath();
    pJS.canvas.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2, false);
    pJS.canvas.ctx.closePath();
    pJS.canvas.ctx.fill();
  };

  pJS.fn.particlesCreate = function () {
    for (let i = 0; i < pJS.particles.number.value; i++) {
      pJS.particles.array.push(new (pJS.fn.particle as any)(pJS.particles.color, pJS.particles.opacity.value));
    }
  };

  pJS.fn.particlesUpdate = function () {
    for (let i = 0; i < pJS.particles.array.length; i++) {
      const p = pJS.particles.array[i];

      if (pJS.particles.move.enable) {
        const ms = pJS.particles.move.speed / 2;
        p.x += p.vx * ms;
        p.y += p.vy * ms;
      }

      if (pJS.particles.move.out_mode === "bounce") {
        if (p.x + p.radius > pJS.canvas.w) p.vx = -p.vx;
        else if (p.x - p.radius < 0) p.vx = -p.vx;
        if (p.y + p.radius > pJS.canvas.h) p.vy = -p.vy;
        else if (p.y - p.radius < 0) p.vy = -p.vy;
      } else {
        if (p.x - p.radius > pJS.canvas.w) {
          p.x = p.radius;
          p.y = Math.random() * pJS.canvas.h;
        } else if (p.x + p.radius < 0) {
          p.x = pJS.canvas.w + p.radius;
          p.y = Math.random() * pJS.canvas.h;
        }
        if (p.y - p.radius > pJS.canvas.h) {
          p.y = p.radius;
          p.x = Math.random() * pJS.canvas.w;
        } else if (p.y + p.radius < 0) {
          p.y = pJS.canvas.h + p.radius;
          p.x = Math.random() * pJS.canvas.w;
        }
      }

      if (pJS.particles.line_linked.enable) {
        for (let j = i + 1; j < pJS.particles.array.length; j++) {
          const p2 = pJS.particles.array[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= pJS.particles.line_linked.distance) {
            const line_opacity =
              pJS.particles.line_linked.opacity - dist / (1 / pJS.particles.line_linked.opacity) / pJS.particles.line_linked.distance;
            if (line_opacity > 0) {
              const opt = pJS.particles.line_linked.color_rgb_line;
              pJS.canvas.ctx.strokeStyle = `rgba(${opt.r},${opt.g},${opt.b},${line_opacity})`;
              pJS.canvas.ctx.lineWidth = pJS.particles.line_linked.width;
              pJS.canvas.ctx.beginPath();
              pJS.canvas.ctx.moveTo(p.x, p.y);
              pJS.canvas.ctx.lineTo(p2.x, p2.y);
              pJS.canvas.ctx.stroke();
              pJS.canvas.ctx.closePath();
            }
          }
        }
      }

      // Interactivity grab
      if (
        pJS.interactivity.events.onhover.enable &&
        pJS.interactivity.status === "mousemove" &&
        pJS.interactivity.mouse.pos_x &&
        pJS.interactivity.mouse.pos_y
      ) {
        const dx = p.x - pJS.interactivity.mouse.pos_x;
        const dy = p.y - pJS.interactivity.mouse.pos_y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= pJS.interactivity.modes.grab.distance) {
          const line_opacity =
            pJS.interactivity.modes.grab.line_linked.opacity -
            dist / (1 / pJS.interactivity.modes.grab.line_linked.opacity) / pJS.interactivity.modes.grab.distance;
          if (line_opacity > 0) {
            const opt = pJS.particles.line_linked.color_rgb_line;
            pJS.canvas.ctx.strokeStyle = `rgba(${opt.r},${opt.g},${opt.b},${line_opacity})`;
            pJS.canvas.ctx.lineWidth = pJS.particles.line_linked.width;
            pJS.canvas.ctx.beginPath();
            pJS.canvas.ctx.moveTo(p.x, p.y);
            pJS.canvas.ctx.lineTo(pJS.interactivity.mouse.pos_x, pJS.interactivity.mouse.pos_y);
            pJS.canvas.ctx.stroke();
            pJS.canvas.ctx.closePath();
          }
        }
      }
    }
  };

  pJS.fn.particlesDraw = function () {
    pJS.canvas.ctx.clearRect(0, 0, pJS.canvas.w, pJS.canvas.h);
    pJS.fn.particlesUpdate();
    for (let i = 0; i < pJS.particles.array.length; i++) {
      pJS.particles.array[i].draw();
    }
  };

  pJS.fn.particlesEmpty = function () {
    pJS.particles.array = [];
  };

  pJS.fn.vendors.densityAutoParticles = function () {
    if (pJS.particles.number.density.enable) {
      let area = (pJS.canvas.el.width * pJS.canvas.el.height) / 1000;
      if (pJS.tmp.retina) {
        area = area / (pJS.canvas.pxratio * 2);
      }
      const nb_particles = (area * pJS.particles.number.value) / pJS.particles.number.density.value_area;
      const missing_particles = pJS.particles.array.length - nb_particles;
      if (missing_particles < 0) {
        pJS.fn.particlesCreate();
      }
    }
  };

  pJS.fn.vendors.checkOverlap = function (p1: any, position?: any) {
    for (let i = 0; i < pJS.particles.array.length; i++) {
      const p2 = pJS.particles.array[i];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= p1.radius + p2.radius) {
        p1.x = position ? position.x : Math.random() * pJS.canvas.w;
        p1.y = position ? position.y : Math.random() * pJS.canvas.h;
        pJS.fn.vendors.checkOverlap(p1);
      }
    }
  };

  pJS.fn.vendors.eventsListeners = function () {
    pJS.fn.vendors.mouseMoveListener = function (e: MouseEvent) {
      pJS.interactivity.mouse.pos_x = e.clientX;
      pJS.interactivity.mouse.pos_y = e.clientY;
      if (pJS.tmp.retina) {
        pJS.interactivity.mouse.pos_x *= pJS.canvas.pxratio;
        pJS.interactivity.mouse.pos_y *= pJS.canvas.pxratio;
      }
      pJS.interactivity.status = "mousemove";
    };
    window.addEventListener("mousemove", pJS.fn.vendors.mouseMoveListener);

    pJS.fn.vendors.mouseLeaveListener = function () {
      pJS.interactivity.mouse.pos_x = null;
      pJS.interactivity.mouse.pos_y = null;
      pJS.interactivity.status = "mouseleave";
    };
    window.addEventListener("mouseleave", pJS.fn.vendors.mouseLeaveListener);

    pJS.fn.vendors.clickListener = function (e: MouseEvent) {
      if (pJS.interactivity.events.onclick.enable) {
        const nb = pJS.interactivity.modes.push.particles_nb;
        for (let i = 0; i < nb; i++) {
          pJS.particles.array.push(
            new (pJS.fn.particle as any)(
              pJS.particles.color,
              pJS.particles.opacity.value,
              { x: e.clientX * pJS.canvas.pxratio, y: e.clientY * pJS.canvas.pxratio }
            )
          );
        }
      }
    };
    window.addEventListener("click", pJS.fn.vendors.clickListener);
  };

  pJS.fn.vendors.draw = function () {
    pJS.fn.particlesDraw();
    if (pJS.particles.move.enable) {
      pJS.fn.drawAnimFrame = requestAnimationFrame(pJS.fn.vendors.draw);
    }
  };

  pJS.fn.vendors.destroypJS = function () {
    cancelAnimationFrame(pJS.fn.drawAnimFrame);
    if (pJS.fn.vendors.resizeListener) window.removeEventListener("resize", pJS.fn.vendors.resizeListener);
    if (pJS.fn.vendors.mouseMoveListener) window.removeEventListener("mousemove", pJS.fn.vendors.mouseMoveListener);
    if (pJS.fn.vendors.mouseLeaveListener) window.removeEventListener("mouseleave", pJS.fn.vendors.mouseLeaveListener);
    if (pJS.fn.vendors.clickListener) window.removeEventListener("click", pJS.fn.vendors.clickListener);
    canvas_el.remove();
  };

  pJS.fn.vendors.init = function () {
    pJS.fn.retinaInit();
    pJS.fn.canvasInit();
    pJS.fn.canvasSize();
    pJS.fn.canvasPaint();
    pJS.fn.particlesCreate();
    pJS.fn.vendors.densityAutoParticles();
    pJS.particles.line_linked.color_rgb_line = hexToRgb(pJS.particles.line_linked.color) || { r: 255, g: 255, b: 255 };
  };

  pJS.fn.vendors.eventsListeners();
  pJS.fn.vendors.init();
  pJS.fn.vendors.draw();
};

export function particlesJS(tag_id: string, params: any) {
  const pJS_tag = document.getElementById(tag_id);
  if (!pJS_tag) return;

  const exist_canvas = pJS_tag.getElementsByClassName("particles-js-canvas-el");
  while (exist_canvas.length > 0) {
    pJS_tag.removeChild(exist_canvas[0]);
  }

  const canvas_el = document.createElement("canvas");
  canvas_el.className = "particles-js-canvas-el";
  canvas_el.style.position = "absolute";
  canvas_el.style.top = "0";
  canvas_el.style.left = "0";
  canvas_el.style.width = "100%";
  canvas_el.style.height = "100%";
  canvas_el.style.pointerEvents = "none";
  canvas_el.style.zIndex = "0";

  pJS_tag.appendChild(canvas_el);
  const instance = new (pJS as any)(tag_id, params);
  pJSDom.push(instance);
  return instance;
}

export function destroyParticles() {
  while (pJSDom.length > 0) {
    const inst = pJSDom.pop();
    if (inst?.pJS?.fn?.vendors?.destroypJS) {
      inst.pJS.fn.vendors.destroypJS();
    }
  }
}
