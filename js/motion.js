export default class Motion {
  values = []
  lastMotionEventAt = new Date()
  facingUp = false

  constructor(motionHandler, window) {
    this.window = window
    this.motionHandler = motionHandler
  }

  // smoothness and deceleration
  static MotionReadInterval = 45
  static MaxValues = 10

  static requestPermission(callback) {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      return DeviceMotionEvent.requestPermission()
    } else {
      return Promise.resolve("granted")
    }
  }

  beginListeningToMotionUpdates() {
    window.addEventListener('devicemotion', this.onMotionUpdate.bind(this))
    window.addEventListener('deviceorientation', this.onOrientationUpdate.bind(this))
  }

  onMotionUpdate(e) {
    const { beta, gamma } = e.rotationRate
    let now = new Date()

    if ((now - this.lastMotionEventAt) > Motion.MotionReadInterval) {
      this.lastMotionEventAt = now

      let value = this.isEnabled ? (this.facingUp ? gamma : beta) * -1 : 0
      this.addValue(value)

      const smoothed = this.values.reduce((a, b) => { return a + b}, 0) / this.values.length

      if (this.motionHandler) {
        this.motionHandler(smoothed)
      }
    }
  }

  onOrientationUpdate(e) {
    const { alpha, beta, gamma } = e

    this.facingUp = beta < 45
  }

  addValue(value) {
    this.values = this.values.slice(0, Motion.MaxValues - 1)
    this.values.unshift(value)
  }
}
