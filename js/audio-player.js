export default class AudioPlayer {
  isPlaying = false
  isLoaded = false
  isEnded = false

  track = {
    file: null,
    isReversed: false,
    playbackRate: 1.0
  }

  // maintains our position within the song, independent
  // of ctx.currentTime which perpectually moves forward
  time = { prev: 0, curr: 0, total: 0 }

  // References to our two audio buffers. 
  // l = reverse (left)
  // r = forward (right)
  buff = { l: null, r: null }

  audioSrc

  interval 

  constructor(track, audioContext, onInitialize, onTimeUpdate) {
    this.isLoaded = false
    this.track.file = track
    this.onTimeUpdate = onTimeUpdate
    this.onInitialize = onInitialize

    this.audioCtx = audioContext
  }

  init() {
    let request = new XMLHttpRequest()
    request.open('GET', this.track.file, true)
    request.responseType = 'arraybuffer'

    request.onload = () => {
      this.audioCtx.decodeAudioData(request.response).then(buffer => {
        if (buffer.length === 0) { throw 'Why u no there?' }
        this.buff.r = buffer
        this.buff.l = AudioPlayer.reverseBuffer(buffer)

        this.time.total = buffer.duration

        // Callback for enabling the 'play' button
        if (this.onInitialize) {
          this.onInitialize()
        }

        this.isLoaded = true

        this.interval = setInterval(this.updateCurrentTime.bind(this), 10)
      }).catch(e => {
        console.error("Error with decoding audio data: " + e)
      })
    }

    request.send()
  }

  play() {
    if (this.isPlaying) return
    if (this.isEnded) return
    // Remove the following line to simulate the behavior of a
    // record player (continue spinning when the needle is up)
    this.time.prev = this.audioCtx.currentTime

    this.audioSrc = this.audioCtx.createBufferSource()

    if (this.track.isReversed) {
      this.switchTrack('l')
    } else {
      this.switchTrack('r')
    }

    this.isPlaying = true
  }

  pause() {
    if (!this.isPlaying) return
    this.isPlaying = false

    this.audioSrc.stop(0)
    this.audioSrc.disconnect(0)

    this.audioSrc = null
  }

  end() {
    this.isEnded = true
    this.pause()

    clearInterval(this.interval, 10)
  }


  static formatTime(time) {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)

    const pad = (n) => {
      if (n < 10) return `0${n}`
      else return n
    }

    return `${pad(minutes)}:${pad(seconds)}`
  }

  updatePlaybackRate(newRate, isNegative) {
    if (isNegative && !this.track.isReversed) {
      this.switchTrack('l')
      this.track.isReversed = true
    }
    if (!isNegative && this.track.isReversed) {
      this.switchTrack('r')
      this.track.isReversed = false
    }

    this.track.playbackRate = newRate

    if (this.isPlaying) {
      this.audioSrc.playbackRate.value = newRate 
    }
  }

  // It's necessary to maintain our own concept of "current time."
  // The complexity is 2-fold:
  //
  // 1. The playback rate is constantly changing. A playback rate of
  //    1.0 would map to ctx.currentTime 1:1. A playback rate of 0.5
  //    would map to ctx.currentTime 0.5:1. Our playback rate is
  //    variable so we're sampling the amount of "real time" that 
  //    has passed between reads and multiplying it by the playback
  //    rate at that moment. Close enough.
  //
  //  2. Playback can happen both forwards and backwards. As ctx.currentTime
  //  marches forward, we keep track of "current time" by either adding
  //  or subtracting based on the current direction
  //
  updateCurrentTime() {
    if (!this.isPlaying) return

    const delta = this.audioCtx.currentTime - this.time.prev
    const adjusted = delta * this.track.playbackRate
    this.time.prev = this.audioCtx.currentTime

    if (this.track.isReversed) {
      this.time.curr -= adjusted
    } else {
      this.time.curr += adjusted
    }

    this.time.curr = Math.max(this.time.curr, 0)
    this.time.curr = Math.min(this.time.curr, this.time.total)

    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.time.curr)
    }
  }

  switchTrack(direction) {
    if (!this.audioSrc) return

    if (this.isPlaying) {
      this.audioSrc.stop(0)
      this.audioSrc.disconnect(0)
    }

    const buffer = direction === 'l' ? this.buff.l : this.buff.r
    const offset = direction === 'l' ? buffer.duration - this.time.curr : this.time.curr

    const src = this.audioCtx.createBufferSource()
    src.buffer = buffer
    src.connect(this.audioCtx.destination)
    src.start(0, offset)

    this.audioSrc = src
  }

  static reverseBuffer(buffer) {
    let c0 = new Float32Array(buffer.length)
    let c1 = new Float32Array(buffer.length)

    buffer.copyFromChannel(c0, 0)
    buffer.copyFromChannel(c1, 1)

    const lBuff = new AudioBuffer({
      length: buffer.length,
      sampleRate: buffer.sampleRate,
      numberOfChannels: 2
    })

    lBuff.copyToChannel(c0.reverse(), 0)
    lBuff.copyToChannel(c1.reverse(), 1)

    return lBuff
  }

  static supportedCodec() {
    let audioElement = document.createElement('audio')
    let codec = null
    if (!!audioElement.canPlayType('audio/ogg')) {
      codec = 'ogg'
    } else if (!!audioElement.canPlayType('audio/mp3')) {
      codec =  'mp3'
    }


    return codec
  }
}
