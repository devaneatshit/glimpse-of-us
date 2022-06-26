const showTopThing = (id) => {
  const topThing = document.querySelector('.js-top-thing')
  const template = document.getElementById(id)
  const content = template.content.cloneNode(true)
  topThing.replaceChildren(content)

  topThing.style.top = '-1000px'
  topThing.classList.add('showing') // 24px padding
  setTimeout(() => {
    const height = topThing.getBoundingClientRect().height
    topThing.style.transform = `translate3d(0px, -${height}px, 0px)`
    topThing.style.top = '0px'

    setTimeout(() => {
      topThing.style.transitionDuration = '700ms'
      topThing.style.transitionProperty = 'transform';
      setTimeout(() => { topThing.style.transform = `translate3d(0px, 0px, 0px)` }, 10)
    }, 10)
  }, 100)
}

export const hideTopThing = (callback) => {
  const topThing = document.querySelector('.js-top-thing')
  const height = topThing.getBoundingClientRect().height + 6
  topThing.style.transform = `translate3d(0px, -${height}px, 0px)`

  setTimeout(() => {
    if (callback) { callback() }
    else { topThing.classList.remove('showing') }
  }, 800)
}

export const dismissIntroScreen = (sections, introContainer, vinyl) => {
  for (const section of sections) {
    section.classList.add('byebye')
  }
  vinyl.classList.remove('in-sleeve')
  setTimeout(() => { introContainer.style.display = 'none' }, 2100)

  vinyl.querySelector("div").classList.add('animate')
}


export const showPermissionsScreen = (callback) => {
  showTopThing('request-permissions')
  const requestPermissionsButton = document.querySelector('.js-request-permissions')
  const topThingOverlay = document.querySelector('.js-top-thing-overlay')
  requestPermissionsButton.addEventListener("click", callback)
  topThingOverlay.classList.add('show')
}

export const showPermissionsDeniedScreen = () => {
  hideTopThing(() => { 
    showTopThing("permissions-denied")
  })
}

export const showUnmuteScreen = (callback) => {
  showTopThing('unmute')
  const confirmButton = document.querySelector('.js-unmute')
  confirmButton.addEventListener("click", () => {
    const topThingOverlay = document.querySelector('.js-top-thing-overlay')
    topThingOverlay.classList.remove('show')
    callback()
  })
}

export const showLoadingScreen = () => {
  const template = document.getElementById('loading-screen')
  const content = template.content.cloneNode(true)
  document.body.appendChild(content)
  setTimeout(() => {
    document.querySelector('.js-loading-screen').classList.add('show')
  }, 10)
}

export const hideLoadingScreen = () => {
  try {
    const el = document.querySelector('.js-loading-screen')
    el.classList.remove('show')
    setTimeout(() => el.remove(), 600)
  } catch(e) {
    // noop
  }
}

export const showInfoScreen = () => {
  const template = document.getElementById('info-screen')
  const content = template.content.cloneNode(true)
  document.body.appendChild(content)
  document.body.classList.add('bg-gold')
  document.body.classList.remove('bg-dark-blue')
}

export const hideInfoScreen = () => {
  document.body.classList.remove('bg-gold')
  document.body.classList.add('bg-dark-blue')
  document.querySelector('.js-info-screen').remove()
}

export const showSongCompletedScreen = (onShareClick, onDoOverClick) => {
  showTopThing('song-completed')
  const completedShareButton = document.querySelector('.js-completed-share-button')
  completedShareButton.addEventListener('click', onShareClick)
  const restartButton = document.querySelector('.js-completed-restart')
  restartButton.addEventListener('click', onDoOverClick)
}
