import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
import { Vector3 } from 'three';

const DIRECTIONS = ['w', 'a', 's', 'd'];

export class CharacterControls {
  model: THREE.Group;
  mixer: THREE.AnimationMixer;
  animsMap: Map<string, THREE.AnimationAction> = new Map();
  orbitControls: OrbitControls;
  camera: THREE.Camera;

  toggleRun: boolean = true;
  currentAction: string;

  walkDir = new THREE.Vector3();
  rotAngle = new THREE.Vector3(0, 1, 0);
  rotQuaternion: THREE.Quaternion = new THREE.Quaternion();
  cameraTarget = new THREE.Vector3();

  fade: number = 0.2;
  runVelocity = 5.0;
  walkVelocity = 2.0;

  constructor(
    model: THREE.Group,
    mixer: THREE.AnimationMixer,
    animsMap: Map<string, THREE.AnimationAction>,
    orbitControls: OrbitControls,
    camera: THREE.Camera,
    currentAction: string,
  ) {
    this.model = model;
    this.mixer = mixer;
    this.animsMap = animsMap;
    this.currentAction = currentAction;
    this.animsMap.forEach((value, key) => {
      if (key == currentAction) {
        value.play;
      }
    });
    this.orbitControls = orbitControls;
    this.camera = camera;
  }

  public runToggle() {
    this.toggleRun = !this.toggleRun;
  }

  public update(delta: number, keysPressed: any) {
    const dirPressed = DIRECTIONS.some(
      (key: any) => keysPressed[key] == true,
    );

    var play = '';
    if (dirPressed && this.toggleRun) {
      play = 'run';
    } else if (dirPressed) {
      play = 'walk';
    } else {
      play = 'idle';
    }

    if (this.currentAction != play) {
      const toPlay = this.animsMap.get(play);
      const current = this.animsMap.get(this.currentAction);

      current?.fadeOut(this.fade);
      toPlay?.reset().fadeIn(this.fade).play();

      this.currentAction = play;
    }

    this.mixer.update(delta);

    if (this.currentAction == 'run' || this.currentAction == 'walk') {
      // camera direction
      var angleYCamDir = Math.atan2(
        this.camera.position.x - this.model.position.x,
        this.camera.position.z - this.model.position.z,
      );
      // diagonal offset
      var dirOffs = this.dirOffs(keysPressed);

      // rotation
      this.rotQuaternion.setFromAxisAngle(
        this.rotAngle,
        angleYCamDir + dirOffs,
      );
      this.model.quaternion.rotateTowards(this.rotQuaternion, 0.2);

      // direction
      this.camera.getWorldDirection(this.walkDir);
      this.walkDir.y = 0;
      this.walkDir.normalize();
      this.walkDir.applyAxisAngle(this.rotAngle, dirOffs);

      // velocity
      const velocity =
        this.currentAction == 'run' ? this.runVelocity : this.walkVelocity;

      // model and camera movement
      const moveX = this.walkDir.x * velocity * delta;
      const moveZ = this.walkDir.z * velocity * delta;
      this.model.position.x -= moveX;
      this.model.position.z -= moveZ;
      this.updateCameraTarget(moveX, moveZ);
    }
  }

  private updateCameraTarget(moveX: number, moveZ: number) {
    this.camera.position.x -= moveX;
    this.camera.position.z -= moveZ;

    this.cameraTarget.x = this.model.position.x;
    this.cameraTarget.y = this.model.position.y + 1;
    this.cameraTarget.z = this.model.position.z;
    this.orbitControls.target = this.cameraTarget;
  }

  private dirOffs(keysPressed: any) {
    var dirOffs = Math.PI;

    if (keysPressed['w']) {
      if (keysPressed['a']) {
        dirOffs = -Math.PI / 4 - Math.PI / 2;
      } else if (keysPressed['d']) {
        dirOffs = Math.PI / 4 + Math.PI / 2;
      }
    } else if (keysPressed['s']) {
      if (keysPressed['a']) {
        dirOffs = -Math.PI / 4;
      } else if (keysPressed['d']) {
        dirOffs = Math.PI / 4;
      } else {
        dirOffs = 0;
      }
    } else if (keysPressed['a']) {
      dirOffs = -Math.PI / 2;
    } else if (keysPressed['d']) {
      dirOffs = Math.PI / 2;
    }

    return dirOffs;
  }
}
