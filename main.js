import {Howl} from 'howler'


const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight

const scoreEl = document.querySelector('#scoreEl')
const startGameBtn = document.querySelector('#startGameBtn')
const modalEl = document.querySelector('#modalEl')
const bigScoreEl = document.querySelector('#bigScoreEl')
const soundOffEl = document.querySelector('#soundOffEl')
const soundOnEl = document.querySelector('#soundOnEl')
const powerUpImg = new Image()
powerUpImg.src = './img/lightning.png'
const friction = 0.99 // effet de particules

// AUDIO
const startGameAudio = new Audio('./audio/gamestart.mp3')
const endGameAudio = new Audio('./audio/vgdeathsound.ogg')
const shootAudio = new Howl({src: ['./audio/laserfire01.mp3']})
const enemyHitAudio = new Howl({src: ['./audio/enemihit.mp3']})
const enemyEliminatedAudio = new Howl({src: ['./audio/muffled.mp3']})
const obtainPowerUpAudio = new Howl({src: ['./audio/threeTone2.mp3']})
const backgroundMusicAudio = new Audio('./audio/8BitRetroFunk-DavidRenda.mp3')

startGameAudio.volume = 0.5
backgroundMusicAudio.volume = 0.2
backgroundMusicAudio.loop = true


const scene = {
    active: false
}

class Player {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = {
            x: 0,
            y: 0
        }
        this.friction = 0.99
        this.powerUp = ''
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)

        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        this.velocity.x *= this.friction
        this.velocity.y *= this.friction

        if (
            this.x - this.radius + this.velocity.x > 0 &&
            this.x + this.radius + this.velocity.x < canvas.width) {
            this.x = this.x + this.velocity.x
        } else {
            this.velocity.x = 0
        }

        if (
            this.y - this.radius + this.velocity.y > 0 &&
            this.y + this.radius + this.velocity.y < canvas.height) {
            this.y = this.y + this.velocity.y
        } else {
            this.velocity.y = 0
        }
    }

    shoot(mouse, color = 'white') {
        const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x)
        const velocity = {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5
        }
        projectiles.push(new Projectile(this.x, this.y, 5, color, velocity))
        shootAudio.play()
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {

        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)

        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

class PowerUp {
    constructor(x, y, velocity) {
        this.x = x
        this.y = y
        this.velocity = velocity
        this.width = 14
        this.height = 18
        this.radians = 0
    }

    draw() {
        c.save()
        c.translate(this.x + this.width / 2, this.y + this.height / 2)
        c.rotate(this.radians)
        c.translate(-this.x - this.width / 2, -this.y - this.height / 2)
        c.drawImage(powerUpImg, this.x, this.y, 14, 18)
        c.restore()
    }

    update() {
        this.radians += 0.007 // increase / decrease the power-up rotation
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {

        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.type = 'linear'
        this.center = {
            x: x,
            y: y
        }
        this.radians = 0

        if (Math.random() < 0.25) { // chance de spawn un guidé
            this.type = 'homing'

            if (Math.random() < 0.5) { // chance de spawn un spinning
                this.type = 'spinning'

                if (Math.random() < 0.30) { // chance spawn un spinning guidé
                    this.type = 'homingSpinning'
                }
            }
        }
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)

        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()

        if (this.type === 'linear') {
            this.x = this.x + this.velocity.x
            this.y = this.y + this.velocity.y
        } else if (this.type === 'homing') {
            const angle = Math.atan2(player.y - this.y, player.x - this.x)

            this.velocity = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            }
            // linear travel (vers le milieu)
            this.x = this.x + this.velocity.x
            this.y = this.y + this.velocity.y
        } else if (this.type === 'spinning') {
            this.radians += 0.05
            this.center.x += this.velocity.x
            this.center.y += this.velocity.y

            this.x = this.center.x + Math.cos(this.radians) * 80
            this.y = this.center.y + Math.sin(this.radians) * 80
        } else if (this.type === 'homingSpinning') {
            const angle = Math.atan2(player.y - this.y, player.x - this.x)

            this.velocity = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            }

            this.radians += 0.05
            this.center.x += this.velocity.x
            this.center.y += this.velocity.y

            this.x = this.center.x + Math.cos(this.radians) * 70 // taille du homing spinning
            this.y = this.center.y + Math.sin(this.radians) * 70 // taille du homing spinning
        }
    }
}

class Particle {
    constructor(x, y, radius, color, velocity) {

        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1
    }

    draw() {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)

        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update() {
        this.draw()
        this.velocity.x *= friction
        this.velocity.y *= friction
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
        this.alpha -= 0.01
    }
}

class BackgroundParticle {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.alpha = 0.04 // 0.05
        this.initialAlpha = this.alpha
    }

    draw() {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)

        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update() {
        this.draw()
//        this.alpha -= 0.01
    }
}

let player
let powerUps = []
let projectiles = []
let enemies = []
let particles = []
let backgroundParticles = []

function init() {
    const x = canvas.width / 2
    const y = canvas.height / 2
    player = new Player(x, y, 10, 'white')
    powerUps = []
    projectiles = []
    enemies = []
    particles = []
    backgroundParticles = []

    for (let x = 0; x < canvas.width; x += 30) {
        for (let y = 0; y < canvas.height; y += 30) {
            backgroundParticles.push(new BackgroundParticle(x, y, 3, 'blue'))
        }
    }
}

function spawnEnemies() {
    const radius = Math.random() * (30 - 4) + 4
    let x
    let y

    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
        y = Math.random() * canvas.height
    } else {
        x = Math.random() * canvas.width
        y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
    }

    const color = `hsl(${Math.random() * 360}, 50%, 50%)` // template litteral

    const angle = Math.atan2(canvas.height / 2 - y,
        canvas.width / 2 - x
    )
    const velocity = {
        x: Math.cos(angle),
        y: Math.sin(angle)
    }

    enemies.push(new Enemy(x, y, radius, color, velocity))
}

// revoir la vidéo des power up pour diminuer le nombre qui spawn
function spawnPowerUps() {
    setInterval(() => {
        let x
        let y

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - 7 : canvas.width + 7
            y = Math.random() * canvas.height
        } else {
            x = Math.random() * canvas.width
            y = Math.random() < 0.5 ? 0 - 9 : canvas.height + 9
        }

        const angle = Math.atan2(canvas.height / 2 - y,
            canvas.width / 2 - x
        )
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }

        powerUps.push(new PowerUp(x, y, velocity))
    }, 15000) // temps de spawn de power up
}

function createScoreLabel(projectile, score) {
    const scoreLabel = document.createElement('label')
    scoreLabel.innerHTML = score
    scoreLabel.style.position = 'absolute'
    scoreLabel.style.color = 'white'
    scoreLabel.style.userSelect = 'none'
    scoreLabel.style.left = projectile.x + 'px'
    scoreLabel.style.top = projectile.y + 'px'
    document.body.appendChild(scoreLabel)

    gsap.to(scoreLabel, {
        opacity: 0,
        y: -30,
        duration: 0.75,
        onComplete: () => {
            scoreLabel.parentNode.removeChild(scoreLabel)
        }
    })
}

let animationId
let score = 0
let frame = 0

function animate() {
    animationId = requestAnimationFrame(animate)
    frame++
    c.fillStyle = 'rgba(0,0,0,0.1)'
    c.fillRect(0, 0, canvas.width, canvas.height)

    if (frame % 100 === 0) spawnEnemies() // make the 100 random so game is harder

    // Background-Particles
    backgroundParticles.forEach((backgroundParticle) => {
        const dist = Math.hypot(
            player.x - backgroundParticle.x,
            player.y - backgroundParticle.y
        )

        const hideRadius = 100
        if (dist < hideRadius) {
            if (dist < 70) {
                backgroundParticle.alpha = 0
            } else {
                backgroundParticle.alpha = 0.50 // Brightness Around Radius
            }
        } else if (dist >= hideRadius && backgroundParticle.alpha < backgroundParticle.initialAlpha) {
            backgroundParticle.alpha += 0.01
        } else if (dist >= hideRadius && backgroundParticle.alpha > backgroundParticle.initialAlpha) {
            backgroundParticle.alpha -= 0.01
        }
        backgroundParticle.update()
    })

    player.update()
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1)
        } else {
            particle.update()
        }
    })

    // CONDITION DU POWER-UP
    if (player.powerUp === 'Automatic' && mouse.down) {
        if (frame % 5 === 0) { // puissance du power up
            player.shoot(mouse, '#FFF500')
        }
    }

    powerUps.forEach((powerUp, index) => {
        const dist = Math.hypot(player.x - powerUp.x, player.y - powerUp.y)

        // Gain the automatic shooting ability
        if (dist - player.radius - powerUp.width / 2 < 1) {
            player.color = '#FFF500'
            player.powerUp = 'Automatic' // machinegun

            powerUps.splice(index, 1) // retire le power up de l'écran
            obtainPowerUpAudio.play()

            setTimeout(() => {
                player.powerUp = ''
                player.color = '#FFFFFF'
            }, 4000)

        } else {
            powerUp.update()
        }
    })

    projectiles.forEach((projectile, index) => {
            projectile.update()

            // ne plus calculer les boules qui sortent du cadre (Garbage Collection)
            if (projectile.x + projectile.radius < 0 ||
                projectile.x - projectile.radius > canvas.width ||
                projectile.y + projectile.radius < 0 ||
                projectile.y - projectile.radius > canvas.height
            ) {
                setTimeout(() => {
                    projectiles.splice(index, 1)
                }, 0)
            }
        }
    )

    enemies.forEach((enemy, index) => {
        enemy.update()

        // distance entre player et boule
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)

        // end game
        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId)
            modalEl.style.display = 'flex'
            bigScoreEl.innerHTML = score
            backgroundMusicAudio.pause()
            endGameAudio.play()
            scene.active = false

            gsap.to('#whiteModalEl', {
                opacity: 1,
                scale: 1,
                duration: 0.30,
                ease: 'expo', //gsap ease documentation
            })
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)

            // hit enemy
            // quand projectiles touchent enemies
            if (dist - enemy.radius - projectile.radius < 0.25) {
                // create explosions
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(
                        new Particle(projectile.x, projectile.y,
                            Math.random() * 2,
                            enemy.color,
                            {
                                x: (Math.random() - 0.5) * (Math.random() * 7),
                                y: (Math.random() - 0.5) * (Math.random() * 7)
                            }
                        )
                    )
                }


                // shrink enemy
                if (enemy.radius - 10 > 5) {
                    enemyHitAudio.play()
                    // incrémenter le score
                    score += 100
                    scoreEl.innerHTML = score
                    createScoreLabel(projectile, 100)

                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    })
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1)
                    }, 0)
                } else {
                    // remove from scene altogether
                    enemyEliminatedAudio.play()
                    score += 250
                    scoreEl.innerHTML = score
                    createScoreLabel(projectile, 250)

                    // change backgroundParticle colors
                    backgroundParticles.forEach(
                        backgroundParticles => {
                            backgroundParticles.color = enemy.color
                            gsap.to(backgroundParticles, {
                                alpha: 0.18, // augmenter le brightness temporaire
                                duration: 0.016, // durée du fade out du brightness
                                // optional
                                // onComplete: () => {
                                //     gsap.to(backgroundParticles, {
                                //         alpha: backgroundParticles.initialAlpha,
                                //         duration: 0.016
                                //     })
                                // }
                            })
                        }
                    )

                    // taking out enemies
                    setTimeout(() => {
                        const enemyFound = enemies.find((enemyValue) => {
                            return enemyValue === enemy
                        })
                        if (enemyFound) {
                            enemies.splice(index, 1)
                            projectiles.splice(projectileIndex, 1)
                        }
                    }, 0)
                }
            }
        })
    })
}

const mouse = {
    down: false,
    x: undefined,
    y: undefined
}

addEventListener('mousedown', ({clientX, clientY}) => {
    mouse.x = clientX
    mouse.y = clientY
    mouse.down = true
})

addEventListener('mousemove', ({clientX, clientY}) => {
    mouse.x = clientX
    mouse.y = clientY
})

addEventListener('mouseup', () => {
    mouse.down = false
})

// Mobile
addEventListener('touchstart', (event) => {
    mouse.x = event.touches[0].clientX
    mouse.y = event.touches[0].clientY
    mouse.down = true
})

addEventListener('touchmove', (event) => {
    mouse.x = event.touches[0].clientX
    mouse.y = event.touches[0].clientY
})

addEventListener('touchend', () => {
    mouse.down = false
})

// Créer les projectiles du joueur (onClick)
addEventListener('click', ({clientX, clientY}) => {
    if (scene.active && player.powerUp !== 'Automatic') {
        mouse.x = clientX
        mouse.y = clientY
        player.shoot(mouse)
    }
})

addEventListener('resize', () => {
    canvas.width = innerWidth
    canvas.height = innerHeight
    init()
})

startGameBtn.addEventListener('click', () => {
    init()
    animate()
    spawnPowerUps()
    startGameAudio.play()
    scene.active = true
    score = 0
    scoreEl.innerHTML = score
    bigScoreEl.innerHTML = score
    backgroundMusicAudio.play()

    gsap.to('#whiteModalEl', {
        opacity: 0,
        scale: 0.75,
        duration: 0.30,
        ease: 'expo', //gsap ease documentation
        onComplete: () => {
            modalEl.style.display = 'none'
        }
    })
})

// j'aime pas du tout, faudrait faire des switch / case ?
// Z = 90, Q = 81, S = 83, D = 68
addEventListener('keydown', ({keyCode}) => {
    if (keyCode === 90) {
        player.velocity.y -= 1
    } else if (keyCode === 81) {
        player.velocity.x -= 1
    } else if (keyCode === 83) {
        player.velocity.y += 1
    } else if (keyCode === 68) {
        player.velocity.x += 1
    }

    switch (keyCode) {
        case 38:
            player.velocity.y -= 1
            break

        case 37:
            player.velocity.x -= 1
            break

        case 40:
            player.velocity.y += 1
            break

        case 39:
            player.velocity.x += 1
            break
    }

    soundOffEl.addEventListener('click', () => {
        // console.log('mute')
        backgroundMusicAudio.volume = 0
        soundOnEl.style.display = 'block'
        soundOffEl.style.display = 'none'
    })

    soundOnEl.addEventListener('click', () => {
        // console.log('sound on')
        backgroundMusicAudio.volume = 0.2
        soundOnEl.style.display = 'none'
        soundOffEl.style.display = 'block'
    })
})


// taille des enemis parfois trop petite