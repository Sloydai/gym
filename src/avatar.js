import * as THREE from 'three';

const skin = new THREE.MeshLambertMaterial({ color: 0xf0c7a4 });
const dark = new THREE.MeshLambertMaterial({ color: 0x2b3133 });
const white = new THREE.MeshLambertMaterial({ color: 0xf4f2ee });
const towelWhite = new THREE.MeshLambertMaterial({ color: 0xfbfbf8 });
const water = new THREE.MeshLambertMaterial({ color: 0x9fd3f0, opacity: 0.8, transparent: true });

export const SHOULDER_HEIGHT = 1.36;
export const ARM_REACH = 0.62;

function limb(radius, length, material) {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, 10), material);
  mesh.position.y = -length / 2 - radius * 0.6;
  mesh.castShadow = true;
  pivot.add(mesh);
  return pivot;
}

export function createAvatar(color, props) {
  const shirt = new THREE.MeshLambertMaterial({ color });
  const beanie = new THREE.MeshLambertMaterial({ color: new THREE.Color(color).offsetHSL(0.5, -0.1, 0.1) });
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const hips = new THREE.Group();
  hips.position.y = 0.78;
  body.add(hips);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.38, 4, 12), shirt);
  torso.position.y = 0.33;
  torso.castShadow = true;
  const chest = new THREE.Group();
  chest.add(torso);
  hips.add(chest);

  const towel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.29, 0.46, 18), towelWhite);
  towel.position.y = -0.12;
  towel.castShadow = true;
  towel.visible = false;
  hips.add(towel);

  const head = new THREE.Group();
  head.position.y = 0.86;
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), skin);
  face.castShadow = true;
  const hat = new THREE.Group();
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.21, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), beanie);
  cap.position.y = 0.03;
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), white);
  pom.position.y = 0.24;
  hat.add(cap, pom);
  const eyes = [-0.07, 0.07].map((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), dark);
    eye.position.set(x, -0.02, 0.18);
    return eye;
  });
  head.add(face, hat, ...eyes);
  chest.add(head);

  const arms = [-1, 1].map((side) => {
    const arm = limb(0.065, 0.42, shirt);
    arm.position.set(side * 0.3, SHOULDER_HEIGHT - 0.78, 0);
    chest.add(arm);
    return arm;
  });
  const legs = [-1, 1].map((side) => {
    const leg = limb(0.085, 0.5, dark);
    leg.position.set(side * 0.11, 0.02, 0);
    hips.add(leg);
    return leg;
  });
  const shoes = legs.map((leg) => {
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.26), white);
    shoe.position.set(0, -0.72, 0.05);
    leg.add(shoe);
    return shoe;
  });

  const barbell = props.barbell.clone();
  barbell.visible = false;
  chest.add(barbell);
  const dumbbells = arms.map((arm) => {
    const dumbbell = props.dumbbell.clone();
    dumbbell.position.set(0, -0.72, 0);
    dumbbell.visible = false;
    arm.add(dumbbell);
    return dumbbell;
  });
  const bottle = new THREE.Group();
  const bottleBody = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 12), water);
  const bottleCap = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.04, 10), white);
  bottleCap.position.y = -0.12;
  bottle.add(bottleBody, bottleCap);
  bottle.position.set(0, -0.62, 0.05);
  bottle.visible = false;
  arms[1].add(bottle);

  root.userData = { arms, barbell, body, bottle, chest, dumbbells, hat, head, hips, legs, shirt, shoes, towel, towelOn: false };
  return root;
}

/** Bare skin and a white towel round the waist in the sauna; gym clothes everywhere else. */
export function setTowel(avatar, on) {
  const parts = avatar.userData;
  if (parts.towelOn === on) return;
  parts.towelOn = on;
  parts.towel.visible = on;
  parts.hat.visible = !on;
  for (const shoe of parts.shoes) shoe.visible = !on;
  parts.chest.children[0].material = on ? skin : parts.shirt;
  for (const arm of parts.arms) arm.children[0].material = on ? skin : parts.shirt;
  for (const leg of parts.legs) leg.children[0].material = on ? skin : dark;
}

const ease = (t) => 0.5 - Math.cos(Math.PI * Math.min(Math.max(t, 0), 1)) / 2;
const arc = (t) => Math.sin(Math.PI * Math.min(Math.max(t, 0), 1));

export const ACTION_SECONDS = { curl: 1.4, drink: 2, fill: 2.5, loyly: 3, press: 1.8, pullup: 1.6, squat: 1.8, wave: 2 };

/** Poses the avatar for this frame: `anim` is the steady state, `action` a one-shot on top, `stride` the cardio phase. */
export function animateAvatar(avatar, { action, actionTime, anim, hang = 0, lift = 0, seatHeight = 0.45, speed, stride = 0, time }) {
  const { arms, barbell, body, bottle, chest, dumbbells, head, hips, legs } = avatar.userData;
  let hipY = 0.78, hipTilt = 0, chestTilt = 0, headTilt = 0, barReach = ARM_REACH;
  const armX = [0, 0], armZ = [0.08, -0.08], legX = [0, 0];

  if (anim === 'sit') {
    hipY = seatHeight + 0.05;
    legX[0] = legX[1] = -Math.PI / 2;
    armX[0] = armX[1] = -0.5;
  } else if (anim === 'hang') {
    hipY += hang;
    armX[0] = armX[1] = -Math.PI;
    armZ[0] = 0.12;
    armZ[1] = -0.12;
    legX[0] = legX[1] = 0.25 + Math.sin(time * 2) * 0.05;
  } else if (anim === 'cycle') {
    hipY = 0.98;
    chestTilt = 0.55;
    armX[0] = armX[1] = -1.15;
    legX[0] = -1 + Math.sin(stride) * 0.45;
    legX[1] = -1 - Math.sin(stride) * 0.45;
  } else if (anim === 'run') {
    const swing = Math.sin(stride);
    legX[0] = swing * 0.8;
    legX[1] = -swing * 0.8;
    armX[0] = -swing * 0.9;
    armX[1] = swing * 0.9;
    chestTilt = 0.12;
    hipY += Math.abs(Math.cos(stride)) * 0.06;
  } else if (anim === 'bench') {
    hipY = 0.68;
    hipTilt = -Math.PI / 2;
    legX[0] = legX[1] = Math.PI / 2 - 0.35;
    armX[0] = armX[1] = -Math.PI / 2;
  } else if (anim === 'squat') {
    armX[0] = armX[1] = -2.6;
    armZ[0] = 0.5;
    armZ[1] = -0.5;
  } else if (speed > 0.1) {
    const swing = Math.sin(time * 9) * Math.min(speed / 3, 1) * 0.7;
    legX[0] = swing;
    legX[1] = -swing;
    armX[0] = -swing * 0.8;
    armX[1] = swing * 0.8;
    hipY += Math.abs(Math.cos(time * 9)) * 0.04;
  } else {
    chestTilt = Math.sin(time * 1.6) * 0.015;
  }

  barbell.visible = anim === 'squat' || anim === 'bench';
  for (const dumbbell of dumbbells) dumbbell.visible = anim === 'curl';
  bottle.visible = action === 'drink' || action === 'fill';

  if (action) {
    const t = actionTime / ACTION_SECONDS[action];
    if (action === 'squat') {
      const depth = arc(t);
      hipY -= depth * 0.38;
      legX[0] = legX[1] = -depth * 1.3;
      chestTilt = depth * 0.4;
    } else if (action === 'press') {
      const lower = arc(t);
      armZ[0] = lower * 1.15;
      armZ[1] = -lower * 1.15;
      barReach = ARM_REACH * Math.cos(lower * 1.15);
    } else if (action === 'curl') {
      armX[0] = armX[1] = -arc(t) * 2.3;
    } else if (action === 'pullup') {
      const pull = ease(t < 0.5 ? t * 2 : 2 - t * 2);
      hipY += pull * 0.45;
      armZ[0] = 0.12 + pull * 0.9;
      armZ[1] = -0.12 - pull * 0.9;
      legX[0] = legX[1] = 0.25 + pull * 0.3;
    } else if (action === 'drink') {
      const raise = arc(t);
      armX[1] = -raise * 2.5;
      armZ[1] = -raise * 0.35;
      headTilt = -raise * 0.35;
    } else if (action === 'fill') {
      const reach = arc(Math.min(t * 1.4, 1));
      armX[1] = -reach * 1.25;
      chestTilt = reach * 0.15;
    } else if (action === 'wave') {
      const raise = ease(Math.min(t / 0.18, 1)) * ease(Math.min((1 - t) / 0.18, 1));
      armX[1] = -raise * 0.25;
      armZ[1] = -0.08 - raise * (2.5 + Math.sin(actionTime * 14) * 0.2);
      headTilt = -raise * 0.08;
    } else if (action === 'loyly') {
      armX[1] = -arc(t) * 1.9;
      chestTilt = arc(t) * 0.2;
    }
  }

  if (anim === 'bench') barbell.position.set(0, SHOULDER_HEIGHT - 0.78, barReach + 0.04);
  else barbell.position.set(0, 0.64, -0.2);
  body.position.y = lift;
  hips.position.y = hipY;
  hips.rotation.x = hipTilt;
  chest.rotation.x = chestTilt;
  head.rotation.x = headTilt;
  arms.forEach((arm, i) => { arm.rotation.x = armX[i]; arm.rotation.z = armZ[i]; });
  legs.forEach((leg, i) => { leg.rotation.x = legX[i]; });
}
