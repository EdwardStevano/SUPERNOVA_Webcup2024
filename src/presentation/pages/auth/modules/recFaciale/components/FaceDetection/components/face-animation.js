import { useEffect, useState } from "react";

// window.onload = initFaceDetectionAnimation;
console.ward = function() {}; // what warnings?

export function initFaceDetectionAnimation(faceImage) {
  const [width, setWidth] = useState(70)
  const [height, setHeight] = useState(70)

  let root = new THREERoot({
    createCameraControls: !true,
    antialias: (window.devicePixelRatio === 1),
    fov: 80
  });

  root.renderer.setClearColor(0x000000, 0);
  root.renderer.setPixelRatio(window.devicePixelRatio || 1);
  root.camera.position.set(0, 0, 70);

  useEffect(()=>{
    window.addEventListener('resize', function() {
      const windowWidth = window.innerWidth;
      // Use the 'windowWidth' variable to perform your desired actions
      console.log('Window width:', windowWidth);
    });
  },[])

  let slide = new Slide(width, height, 'out');
	let l1 = new window.THREE.ImageLoader();
	l1.setCrossOrigin('Anonymous');
	l1.load('https://s3.eu-central-1.amazonaws.com/visagecloud-ops-xd31vmo8gohlm8zjaexj/3m1pns13lq4i9pg1139gorf5hrknebnqnvevtfris0jic1iq/goev5oqiutss2mdflo00ln879qqcupnnghoh211a645ujqbrfnh71gkjtfqkf37j', function(img) {
	  slide.setImage(img);
	})
  root.scene.add(slide);

  let slide2 = new Slide(width, height, 'in');
  let l2 = new window.THREE.ImageLoader();
	l2.setCrossOrigin('Anonymous');
	l2.load(faceImage ?? '', function(img) {
		slide2.setImage(img);
	})
	
  root.scene.add(slide2);

  let tl = new window.TimelineMax({repeat:-1, repeatDelay:1.0, yoyo: true});

  tl.add(slide.transition(), 0);
  tl.add(slide2.transition(), 0);

  createTweenScrubber(tl);

  window.addEventListener('keyup', function(e) {
    if (e.keyCode === 80) {
      tl.paused(!tl.paused());
    }
  });
}

////////////////////
// CLASSES
////////////////////

function Slide(width, height, animationPhase) {
  let plane = new window.THREE.PlaneGeometry(width, height, width * 2, height * 2);

  window.THREE.BAS.Utils.separateFaces(plane);

  let geometry = new SlideGeometry(plane);

  geometry.bufferUVs();

  let aAnimation = geometry.createAttribute('aAnimation', 2);
  let aStartPosition = geometry.createAttribute('aStartPosition', 3);
  let aControl0 = geometry.createAttribute('aControl0', 3);
  let aControl1 = geometry.createAttribute('aControl1', 3);
  let aEndPosition = geometry.createAttribute('aEndPosition', 3);

  let i, i2, i3, i4, v;

  let minDuration = 0.8;
  let maxDuration = 1.2;
  let maxDelayX = 0.9;
  let maxDelayY = 0.125;
  let stretch = 0.11;

  this.totalDuration = maxDuration + maxDelayX + maxDelayY + stretch;

  let startPosition = new window.THREE.Vector3();
  let control0 = new window.THREE.Vector3();
  let control1 = new window.THREE.Vector3();
  let endPosition = new window.THREE.Vector3();

  let tempPoint = new window.THREE.Vector3();

  function getControlPoint0(centroid) {
    let signY = Math.sign(centroid.y);

    tempPoint.x = window.THREE.Math.randFloat(0.1, 0.3) * 50;
    tempPoint.y = signY * window.THREE.Math.randFloat(0.1, 0.3) * 70;
    tempPoint.z = window.THREE.Math.randFloatSpread(20);

    return tempPoint;
  }

  function getControlPoint1(centroid) {
    let signY = Math.sign(centroid.y);

    tempPoint.x = window.THREE.Math.randFloat(0.3, 0.6) * 50;
    tempPoint.y = -signY * window.THREE.Math.randFloat(0.3, 0.6) * 70;
    tempPoint.z = window.THREE.Math.randFloatSpread(20);

    return tempPoint;
  }

  for (i = 0, i2 = 0, i3 = 0, i4 = 0; i < geometry.faceCount; i++, i2 += 6, i3 += 9, i4 += 12) {
    let face = plane.faces[i];
    let centroid = window.THREE.BAS.Utils.computeCentroid(plane, face);

    // animation
    let duration = window.THREE.Math.randFloat(minDuration, maxDuration);
    let delayX = window.THREE.Math.mapLinear(centroid.x, -width * 0.5, width * 0.5, 0.0, maxDelayX);
    let delayY;

    if (animationPhase === 'in') {
      delayY = window.THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, 0.0, maxDelayY)
    }
    else {
      delayY = window.THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, maxDelayY, 0.0)
    }

    for (v = 0; v < 6; v += 2) {
      aAnimation.array[i2 + v]     = delayX + delayY + (Math.random() * stretch * duration);
      aAnimation.array[i2 + v + 1] = duration;
    }

    // positions

    endPosition.copy(centroid);
    startPosition.copy(centroid);

    if (animationPhase === 'in') {
      control0.copy(centroid).sub(getControlPoint0(centroid));
      control1.copy(centroid).sub(getControlPoint1(centroid));
    }
    else { // out
      control0.copy(centroid).add(getControlPoint0(centroid));
      control1.copy(centroid).add(getControlPoint1(centroid));
    }

    for (v = 0; v < 9; v += 3) {
      aStartPosition.array[i3 + v]     = startPosition.x;
      aStartPosition.array[i3 + v + 1] = startPosition.y;
      aStartPosition.array[i3 + v + 2] = startPosition.z;

      aControl0.array[i3 + v]     = control0.x;
      aControl0.array[i3 + v + 1] = control0.y;
      aControl0.array[i3 + v + 2] = control0.z;

      aControl1.array[i3 + v]     = control1.x;
      aControl1.array[i3 + v + 1] = control1.y;
      aControl1.array[i3 + v + 2] = control1.z;

      aEndPosition.array[i3 + v]     = endPosition.x;
      aEndPosition.array[i3 + v + 1] = endPosition.y;
      aEndPosition.array[i3 + v + 2] = endPosition.z;
    }
  }

  let material = new window.THREE.BAS.BasicAnimationMaterial(
    {
      shading: window.THREE.FlatShading,
      side: window.THREE.DoubleSide,
      uniforms: {
        uTime: {type: 'f', value: 0}
      },
      shaderFunctions: [
        window.THREE.BAS.ShaderChunk['cubic_bezier'],
        //window.THREE.BAS.ShaderChunk[(animationPhase === 'in' ? 'ease_out_cubic' : 'ease_in_cubic')],
        window.THREE.BAS.ShaderChunk['ease_in_out_cubic'],
        window.THREE.BAS.ShaderChunk['quaternion_rotation']
      ],
      shaderParameters: [
        'uniform float uTime;',
        'attribute vec2 aAnimation;',
        'attribute vec3 aStartPosition;',
        'attribute vec3 aControl0;',
        'attribute vec3 aControl1;',
        'attribute vec3 aEndPosition;',
      ],
      shaderVertexInit: [
        'float tDelay = aAnimation.x;',
        'float tDuration = aAnimation.y;',
        'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
        'float tProgress = ease(tTime, 0.0, 1.0, tDuration);'
        //'float tProgress = tTime / tDuration;'
      ],
      shaderTransformPosition: [
        (animationPhase === 'in' ? 'transformed *= tProgress;' : 'transformed *= 1.0 - tProgress;'),
        'transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);'
      ]
    },
    {
      map: new window.THREE.Texture(),
    }
  );

  window.THREE.Mesh.call(this, geometry, material);

  this.frustumCulled = false;
}
Slide.prototype = Object.create(window.THREE.Mesh.prototype);
Slide.prototype.constructor = Slide;
Object.defineProperty(Slide.prototype, 'time', {
  get: function () {
    return this.material.uniforms['uTime'].value;
  },
  set: function (v) {
    this.material.uniforms['uTime'].value = v;
  }
});

Slide.prototype.setImage = function(image) {
  this.material.uniforms.map.value.image = image;
  this.material.uniforms.map.value.needsUpdate = true;
};

Slide.prototype.transition = function() {
  return window.TweenMax.fromTo(this, 3.0, {time:0.0}, {time:this.totalDuration, ease:window.Power0.easeInOut});
};


function SlideGeometry(model) {
  window.THREE.BAS.ModelBufferGeometry.call(this, model);
}
SlideGeometry.prototype = Object.create(window.THREE.BAS.ModelBufferGeometry.prototype);
SlideGeometry.prototype.constructor = SlideGeometry;
SlideGeometry.prototype.bufferPositions = function () {
  let positionBuffer = this.createAttribute('position', 3).array;

  for (let i = 0; i < this.faceCount; i++) {
    let face = this.modelGeometry.faces[i];
    let centroid = window.THREE.BAS.Utils.computeCentroid(this.modelGeometry, face);

    let a = this.modelGeometry.vertices[face.a];
    let b = this.modelGeometry.vertices[face.b];
    let c = this.modelGeometry.vertices[face.c];

    positionBuffer[face.a * 3]     = a.x - centroid.x;
    positionBuffer[face.a * 3 + 1] = a.y - centroid.y;
    positionBuffer[face.a * 3 + 2] = a.z - centroid.z;

    positionBuffer[face.b * 3]     = b.x - centroid.x;
    positionBuffer[face.b * 3 + 1] = b.y - centroid.y;
    positionBuffer[face.b * 3 + 2] = b.z - centroid.z;

    positionBuffer[face.c * 3]     = c.x - centroid.x;
    positionBuffer[face.c * 3 + 1] = c.y - centroid.y;
    positionBuffer[face.c * 3 + 2] = c.z - centroid.z;
  }
};


function THREERoot(params) {
  params = utils.extend({
    fov: 60,
    zNear: 10,
    zFar: 100000,

    createCameraControls: true
  }, params);

  this.renderer = new window.THREE.WebGLRenderer({
    antialias: params.antialias,
    alpha: true
  });
  this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  document.getElementById('three-container').appendChild(this.renderer.domElement);

  this.camera = new window.THREE.PerspectiveCamera(
    params.fov,
    window.innerWidth / window.innerHeight,
    params.zNear,
    params.zfar
  );

  this.scene = new window.THREE.Scene();

  if (params.createCameraControls) {
    this.controls = new window.THREE.OrbitControls(this.camera, this.renderer.domElement);
  }

  this.resize = this.resize.bind(this);
  this.tick = this.tick.bind(this);

  this.resize();
  this.tick();

  window.addEventListener('resize', this.resize, false);
}
THREERoot.prototype = {
  tick: function () {
    this.update();
    this.render();
    requestAnimationFrame(this.tick);
  },
  update: function () {
    this.controls && this.controls.update();
  },
  render: function () {
    this.renderer.render(this.scene, this.camera);
  },
  resize: function () {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
};

////////////////////
// UTILS
////////////////////

let utils = {
  extend: function (dst, src) {
    for (let key in src) {
      dst[key] = src[key];
    }

    return dst;
  },
  randSign: function () {
    return Math.random() > 0.5 ? 1 : -1;
  },
  ease: function (ease, t, b, c, d) {
    return b + ease.getRatio(t / d) * c;
  },
  fibSpherePoint: (function () {
    let vec = {x: 0, y: 0, z: 0};
    let G = Math.PI * (3 - Math.sqrt(5));

    return function (i, n, radius) {
      let step = 2.0 / n;
      let r, phi;

      vec.y = i * step - 1 + (step * 0.5);
      r = Math.sqrt(1 - vec.y * vec.y);
      phi = i * G;
      vec.x = Math.cos(phi) * r;
      vec.z = Math.sin(phi) * r;

      radius = radius || 1;

      vec.x *= radius;
      vec.y *= radius;
      vec.z *= radius;

      return vec;
    }
  })(),
  spherePoint: (function () {
    return function (u, v) {
      u === undefined && (u = Math.random());
      v === undefined && (v = Math.random());

      let theta = 2 * Math.PI * u;
      let phi = Math.acos(2 * v - 1);

      let vec = {};
      vec.x = (Math.sin(phi) * Math.cos(theta));
      vec.y = (Math.sin(phi) * Math.sin(theta));
      vec.z = (Math.cos(phi));

      return vec;
    }
  })()
};

function createTweenScrubber(tween, seekSpeed) {
  seekSpeed = seekSpeed || 0.001;

  function stop() {
    window.TweenMax.to(tween, 1, {timeScale:0});
  }

  function resume() {
    window.TweenMax.to(tween, 1, {timeScale:1});
  }

  function seek(dx) {
    let progress = tween.progress();
    let p = window.THREE.Math.clamp((progress + (dx * seekSpeed)), 0, 1);

    tween.progress(p);
  }

  let _cx = 0;

  // desktop
  let mouseDown = false;
  document.body.style.cursor = 'pointer';

  window.addEventListener('mousedown', function(e) {
    mouseDown = true;
    document.body.style.cursor = 'ew-resize';
    _cx = e.clientX;
    stop();
  });
  window.addEventListener('mouseup', function(e) {
    mouseDown = false;
    document.body.style.cursor = 'pointer';
    resume();
  });
  window.addEventListener('mousemove', function(e) {
    if (mouseDown === true) {
      let cx = e.clientX;
      let dx = cx - _cx;
      _cx = cx;

      seek(dx);
    }
  });
  // mobile
  window.addEventListener('touchstart', function(e) {
    _cx = e.touches[0].clientX;
    stop();
    e.preventDefault();
  });
  window.addEventListener('touchend', function(e) {
    resume();
    e.preventDefault();
  });
  window.addEventListener('touchmove', function(e) {
    let cx = e.touches[0].clientX;
    let dx = cx - _cx;
    _cx = cx;

    seek(dx);
    e.preventDefault();
  });
}
