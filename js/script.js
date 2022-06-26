import AudioPlayer from './audio-player.js'
import Motion from './motion.js'
import Record from './record.js'
import unmuteAudio from './unmute.js'
import { map, degToRpm } from './utils.js'
import {
  hideTopThing,
  dismissIntroScreen,
  showPermissionsScreen,
  showPermissionsDeniedScreen,
  showLoadingScreen,
  hideLoadingScreen,
  showUnmuteScreen,
  showInfoScreen,
  hideInfoScreen,
  showSongCompletedScreen
} from './ui.js?v=1'

const playbackRateOutput = document.querySelector('.js-playback-rate')
const currentTimeOutput = document.querySelector('.js-current-time')
const currentTimeFormattedOutput = document.querySelector('.js-current-time-formatted')
const playerControlButton = document.querySelector('.js-player-control-button')
const loader = document.querySelector('.js-loader')
const playbackTime = document.querySelector('.js-playback-time')
const shareButton = document.querySelector('.js-share-button')
const infoButton = document.querySelector('.js-info-button')

const vinyl = document.querySelector('.js-vinyl')
const wizard = document.querySelector('.js-wizard')
const tapAndHold = document.querySelector('.js-tap-and-hold')

const artworkSection = document.querySelector('.js-artwork-section')
const startSection = document.querySelector('.js-start-section')
const heroSection = document.querySelector('.js-hero-section')
const introContainer = document.querySelector('.js-intro')
const progressShadow = document.querySelector('.progress-shadow')

let isPlaying = false
let hasFinishedOnboarding = false
let hasReceivedMotion = false

const codec = AudioPlayer.supportedCodec()
if (codec === null) {
  alert("Your browser doesn't play audio")
}

unmuteAudio(true)

// Initialize audio player
const AudioContext = window.AudioContext || window.webkitAudioContext
let audioPlayer = new AudioPlayer(
  `/music/song.${codec}`,
  new AudioContext(),
  () => { // on load
    setTimeout(() => {
      if (!isPlaying && hasFinishedOnboarding) {
        hideLoadingScreen()
        setPlayingUI()
      }
    }, 1000)
    const curr = AudioPlayer.formatTime(audioPlayer.time.curr)
    const tot = AudioPlayer.formatTime(audioPlayer.time.total)
    playbackTime.textContent = `${curr}/${tot}`
  },
  (time) => { // on update
    const perc = (time / audioPlayer.time.total) * 100
    const scaleVal = map(perc, 0, 100, 0, 48)
    let sizeVal = map(perc, 0, 100, 150, 248)
    sizeVal = ((248 - sizeVal) + 150)
    const bottomVal = map(perc, 0, 100, -234, -136)

    progressShadow.style.boxShadow = `0 0 4px ${scaleVal}vw rgba(0,0,0,0.3)`
    progressShadow.style.height = `${sizeVal}vw`
    progressShadow.style.width = `${sizeVal}vw`
    progressShadow.style.bottom = `${bottomVal}vw`

    const curr = AudioPlayer.formatTime(audioPlayer.time.curr)
    const tot = AudioPlayer.formatTime(audioPlayer.time.total)
    playbackTime.textContent = `${curr}/${tot}`

    if (audioPlayer.time.curr >= audioPlayer.time.total) {
      audioPlayer.end()

      showSongCompletedScreen(
      () => { // share button clicked
        showShareSheet()
      }, () => { // on do over button clicked
        window.location.reload()
      })
    }
  }
)

const requestPermissions = () => {
  Motion.requestPermission().then((state) => {
    if (state === "granted") {
      hideTopThing(() => {
        showUnmuteScreen(() => {
          bindTouchEvents()
          hideTopThing()

          if (!audioPlayer.isLoaded) {
            showLoadingScreen()
          } else {
            setPlayingUI()
          }

          hasFinishedOnboarding = true
        })
      })
    } else {
      showPermissionsDeniedScreen()
    }
  })
}

///// motion

const getStartedButton = document.querySelector('.js-start-button')
const introScreen = document.querySelector(".js-intro")
const playerScreen = document.querySelector(".js-player")
const rotationRateOutput = document.querySelector(".js-rotation-rate")
const rpmOutput = document.querySelector(".js-rpm")

const record = new Record()
let isWizardShowing = false
const motion = new Motion((value) => {
  hasReceivedMotion = true // hack bc desktop browsers say they do motion

  const absValue = Math.abs(value)

  if (absValue < 20) {
    if (!isWizardShowing) {
      wizard.classList.add('show')
      isWizardShowing = true
      tapAndHold.classList.add('show')
    }
  } else {
    if (isWizardShowing) {
      wizard.classList.remove('show')
      isWizardShowing = false
      tapAndHold.classList.remove('show')
    }
  }

  updatePlaybackRate(Math.abs(value), value < 0)
  record.update(value)

  // Update RPM UI
  const rpm = degToRpm(absValue).toFixed(0)
  // rotationRateOutput.textContent = `${value.toFixed(0)} deg/s (${rpm} RPM)`
  // rpmOutput.textContent = `${rpm} RPM`
}, window)

let groove = { min: 60, max: 100 }

const updatePlaybackRate = (rotationRate, isNegative) => {
  let playbackRate = 1.0

  // In the groove
  if (rotationRate > groove.min && rotationRate < groove.max) {
    playbackRate = 1.0
    if (!audioPlayer.track.isReversed) {
      document.body.classList.add('groovin')
    }
  }

  // Below the groove (map to [0, 0.99])
  else if (rotationRate < groove.min) {
    playbackRate = map(rotationRate, 0, groove.min, 0, 0.99)
    document.body.classList.remove('groovin')
  }

  // Above the groove (map to [1.01, 2.0])
  else {
    playbackRate = map(rotationRate, groove.max, 250, 1.01, 2.0)
    document.body.classList.remove('groovin')
  }

  audioPlayer.updatePlaybackRate(playbackRate, isNegative)
}

// CLICK
getStartedButton.addEventListener("click", () => {
  const sections = [startSection, artworkSection, heroSection]

  dismissIntroScreen(sections, introContainer, vinyl)

  setTimeout(() => {
    showPermissionsScreen(() => {
      requestPermissions()
    })
  }, 600)

  audioPlayer.init()
})

const bindTouchEvents = () => {
  vinyl.addEventListener('touchstart', e => {
    e.preventDefault()
    if (e.touches.length > 1) return
    if (!hasReceivedMotion) return

    motion.isEnabled = true
    document.body.classList.add('touching-record')
    audioPlayer.play()
  }, false)

  vinyl.addEventListener('touchend', e => {
    if (e.touches.length > 0) { return }

    motion.isEnabled = false
    document.body.classList.remove('touching-record')
    // audioPlayer.pause()
  }, false)
}

setTimeout(() => {
  vinyl.style.transitionDelay = '0.6s';
  vinyl.style.transitionDuration = '1s';
}, 10)

infoButton.addEventListener('click', function() {
  showInfoScreen()

  const closeInfoButton = document.querySelector('.js-close-info-button')
  closeInfoButton.addEventListener('click', function() {
    hideInfoScreen()
  })
})

const setPlayingUI = () => {
  isPlaying = true
  vinyl.style.transitionDelay = '0.0s';
  vinyl.style.transitionDuration = '0.1s';
  Array.from(vinyl.children).forEach(item => {
    item.classList.add(`scale-up`)
  })
  setTimeout(() => { 
    wizard.classList.add('show')
    tapAndHold.classList.add('show') 
  }, 600)
  shareButton.classList.add('show')
  playbackTime.classList.add('show')
  motion.beginListeningToMotionUpdates()
}

const showShareSheet = () => {
  const percentage = (audioPlayer.time.curr / audioPlayer.time.total) * 10
  const dist = Math.floor(percentage)
  const numOrangeSquares = dist == 0 ? 1 : dist
  const numWhiteSquares = 10 - numOrangeSquares

  let result = ""
  for (var i = 0; i < numOrangeSquares; i++) {
    result += "🟧"
  }
  for (var i = 0; i < numWhiteSquares; i++) {
    result += "⬜️"
  }

  const currentTimeFormatted = AudioPlayer.formatTime(audioPlayer.time.curr)
  const totalTimeFormatted = AudioPlayer.formatTime(audioPlayer.time.total)

  if(navigator.share) {
    navigator.share({
      text: `Played ${currentTimeFormatted}/${totalTimeFormatted} of Joji — Glimpse Of Us\n\n${result}\n\nhttps://glimpse.wavecat.xyz`
    })
  }
}

shareButton.addEventListener('click', showShareSheet)

window.addEventListener('blur', () => {
  if (audioPlayer.isPlaying) {
    audioPlayer.pause()
    motion.isEnabled = false
  }
})

if (window.innerWidth >= 480) {
  const v = document.querySelector('video')
  const mp4 = ['/video/movie.mp4', 'video/mp4']
  const webm = ['/video/movie.webm', 'video/webm']
  const formats = [mp4, webm]

  for (const format of formats) {
    const source = document.createElement('source')
    source.src = format[0]
    source.type = format[1]
    v.appendChild(source)
  }
}

// preload images
(function() {
  const srcs = ['motion_error.svg', 'motion.svg', 'tap-and-hold.svg', 'volume.svg', 'arrows-right.png', 'completed.webp']
  for (const src of srcs) {
    let image = new Image()
    image.src = `/images/${src}`
  }
}())
