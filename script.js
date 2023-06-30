import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/OrbitControls.js";
import { GLTFLoader } from "./lib/GLTFLoader.js";

window.addEventListener(
  "DOMContentLoaded",
  () => {
    const app = new App3();

    app.load().then(() => {
      app.init();
      app.render();
    });
  },
  false
);

/**
 * three.jsを効率よく使うための自家製制御クラスを定義
 */
class App3 {
  /**
   * カメラ定義のための定数
   */
  static get CAMERA_PARAM() {
    return {
      fovy: 60,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 20.0,
      x: 0.0,
      y: 1.0,
      z: 5.0,
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }
  /**
   * レンダラー定義のための定数
   */
  static get RENDERER_PARAM() {
    return {
      clearColor: 0xffffff,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  /**
   * ディレクショナルライト定義のための定数
   */
  static get DIRECTIONAL_LIGHT_PARAM() {
    return {
      color: 0xffffff,
      intensity: 1.0,
      x: 1.0,
      y: 1.0,
      z: 1.0,
    };
  }
  /**
   * アンビエントライト定義のための定数
   */
  static get AMBIENT_LIGHT_PARAM() {
    return {
      color: 0xffffff,
      intensity: 1.0,
    };
  }
  /**
   * マテリアル定義のための定数
   */
  static get MATERIAL_PARAM() {
    return {
      color: 0xffffff,
    };
  }
  /**
   * フォグ定義のための定数
   */
  static get FOG_PARAM() {
    return {
      fogColor: 0xffffff,
      fogNear: 10.0,
      fogFar: 20.0,
    };
  }

  // 飛行機と地球の距離
  static get PLANE_DISTANCE() {
    return 1.2;
  }

  // カメラと飛行機の距離
  static get CAMEARA_DISTANCE() {
    return 2;
  }

  /**
   * constructor
   */
  constructor() {
    this.renderer;
    this.scene;
    this.camera;
    this.gui;
    this.directionalLight;
    this.ambientLight;
    this.controls;
    this.axesHelper;

    this.earth;
    this.earthGeometry;
    this.earthMaterial;

    this.plane;
    this.planeBody;
    this.planePropela;
    this.planeGeometry;
    this.planeMaterial;
    this.planeDirection;

    this.planeGourp;

    this.frontHelper;
    this.frontVector = this.isDown = false;

    this.clock = new THREE.Clock();

    this.render = this.render.bind(this);

    /**
     * キーイベント
     */
    window.addEventListener(
      "keydown",
      (keyEvent) => {
        switch (keyEvent.key) {
          case " ":
            this.isDown = true;
            break;
          default:
        }
      },
      false
    );
    window.addEventListener(
      "keyup",
      (keyEvent) => {
        this.isDown = false;
      },
      false
    );

    /**
     * マウスカーソルイベント
     */
    window.addEventListener("pointermove", (pointerEvent) => {
      // ポインターのクライアント上の座標
      const pointerX = pointerEvent.clientX;
      const pointerY = pointerEvent.clientY;

      // 座標系をthree.jsに合わせる位
      const scaleX = (pointerX / window.innerWidth) * 2.0 - 1;
      const scaleY = (pointerY / window.innerHeight) * 2.0 - 1;

      // ベクトルを単位化
      const vector = new THREE.Vector2(scaleX, scaleY).normalize();
    });

    /**
     * リサイズイベント
     */
    window.addEventListener(
      "resize",
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      },
      false
    );
  }

  /**
   * アセットのロード
   */
  async load() {
    const self = this;
    const earthModelPath = "./assets/earth2.glb";
    const planeBodyModelPath = "./assets/toy-plane-body.glb";
    const planePropelaModelPath = "./assets/toy-plane-propela.glb";
    const earthModel = await self.loadModel(earthModelPath);
    const planeBodyModel = await self.loadModel(planeBodyModelPath);
    const planePropelaModel = await self.loadModel(planePropelaModelPath);
    this.earth = earthModel.scene;
    this.planeBody = planeBodyModel.scene;
    this.planePropela = planePropelaModel.scene;
  }

  /**
   * モデルを読み込む関数
   * @param {string} modelPath 読み込むモデルのパス
   * @returns 読み込んだモデル
   */
  async loadModel(modelPath) {
    return new Promise((resolve) => {
      const loader = new GLTFLoader();
      loader.load(modelPath, (data) => {
        resolve(data);
      });
    });
  }

  /**
   * 初期化
   */
  init() {
    // レンダラー
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(
      new THREE.Color(App3.RENDERER_PARAM.clearColor)
    );
    this.renderer.setSize(
      App3.RENDERER_PARAM.width,
      App3.RENDERER_PARAM.height
    );
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const wrapper = document.querySelector("#webgl");
    wrapper.appendChild(this.renderer.domElement);

    // シーンとフォグ
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(
      App3.FOG_PARAM.fogColor,
      App3.FOG_PARAM.fogNear,
      App3.FOG_PARAM.fogFar
    );

    // カメラ
    this.camera = new THREE.PerspectiveCamera(
      App3.CAMERA_PARAM.fovy,
      App3.CAMERA_PARAM.aspect,
      App3.CAMERA_PARAM.near,
      App3.CAMERA_PARAM.far
    );
    this.camera.position.set(
      App3.CAMERA_PARAM.x,
      App3.CAMERA_PARAM.y,
      App3.CAMERA_PARAM.z
    );
    this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

    // ディレクショナルライト
    this.directionalLight = new THREE.DirectionalLight(
      App3.DIRECTIONAL_LIGHT_PARAM.color,
      App3.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.scene.add(this.directionalLight);

    //アンビエントライト
    this.ambientLight = new THREE.AmbientLight(
      App3.AMBIENT_LIGHT_PARAM.color,
      App3.AMBIENT_LIGHT_PARAM.intensity
    );
    this.scene.add(this.ambientLight);

    // 3dmodelを調整
    this.planeBody.scale.set(0.1, 0.1, 0.1);
    this.planeBody.rotation.y = Math.PI / 2;
    this.planePropela.scale.set(0.1, 0.1, 0.1);

    this.planeGourp = new THREE.Group();
    this.planeGourp.add(this.planeBody);
    this.planeGourp.add(this.planePropela);

    // planeの進行方向の初期値
    this.planeDirection = new THREE.Vector3(0.0, 1.0, 0.0).normalize();

    // シーンに追加
    this.scene.add(this.earth);
    this.scene.add(this.planeGourp);

    // OrbitControls
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // ヘルパー
    const cameraHelper = new THREE.CameraHelper(this.camera);
    this.scene.add(cameraHelper);

    this.frontHelper = new THREE.ArrowHelper(
      this.frontVector,
      new THREE.Vector3(0, 0, 0),
      10
    );
    // this.scene.add(this.frontHelper);

    // GUI
  }

  /**
   * 描画処理
   */
  render() {
    requestAnimationFrame(this.render);
    // this.controls.update();

    this.planePropela.rotation.y += 0.1;

    const time = this.clock.getElapsedTime();
    const sin = Math.sin(time);
    const cos = Math.cos(time);

    // 現在の進行方向を変数に変数にほじ
    const previousDirection = this.planeDirection.clone();

    //現在の位置を保持
    const oldPosition = this.planeGourp.position.clone();

    this.planeGourp.position.set(
      sin * App3.PLANE_DISTANCE,
      0.0,
      cos * App3.PLANE_DISTANCE
    );
    // アニメーション後の位置を取得
    const newPosition = this.planeGourp.position.clone();
    // 前の位置 - 現在の位置ですすんでいる方向のベクトルを算出
    const frontVector = newPosition.clone().sub(oldPosition);
    // ノーマライズ
    frontVector.normalize();
    this.planeDirection = frontVector.clone();
    // this.frontHelper.setDirection(frontVector);

    const normalAxis = new THREE.Vector3().crossVectors(
      previousDirection,
      frontVector
    );
    normalAxis.normalize();

    const cos2 = previousDirection.dot(frontVector);
    const radians = Math.acos(cos2);
    const qtn = new THREE.Quaternion().setFromAxisAngle(normalAxis, radians);
    this.planeGourp.quaternion.premultiply(qtn);

    const backVector = frontVector.clone().negate();
    backVector.multiplyScalar(App3.CAMEARA_DISTANCE);
    const cameraPosition = backVector.add(this.planeGourp.position);
    this.camera.position.copy(cameraPosition);
    this.camera.up.copy(this.planeGourp.position); // vector3(0,1,0);
    this.camera.lookAt(this.planeGourp.position);
    this.renderer.render(this.scene, this.camera);
  }
}
