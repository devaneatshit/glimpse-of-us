import Motion from "./motion.js"

export default class Record {
  record = {
    deg: 0.0,
    scale: 1.0,
    maxScale: 1.6,
    minScale: 1.0,
    isGrowing: false,
    isShrinking: false,
  }

  sTimeout = null
  gTimeout = null

  constructor() {
    this.asset = document.querySelector('.js-vinyl')
  }

  update(value) {
    const absValue = Math.abs(value)
    // Spin the asset.
    //
    // value = deg/s. We get a reading once every `Motion.MotionReadInverval` ms.
    // number_of_deg = deg/s * (% of second)
    this.record.deg += value * (Motion.MotionReadInterval / 1000) * 1.1 * -1
    this.asset.style.transform = `rotate3d(0, 0, 1, ${this.record.deg}deg)`
  }
}
