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
      z: 10.0,
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
      intensity: 0.2,
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
    this.planeGeometry;
    this.planeMaterial;

    this.isDown = false;

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
    window.addEventListener("resize", () => {});
  }
}
