// ==UserScript==
// @name         dumpjump
// @namespace    Est-ce ton âme
// @version      1.0
// @description  take over the world!
// @author       akikohatsune
// @run-at       document-idle
// @match        https://voicejump-mbl3c5v3.manus.space/
// @icon         https://ayanomi.io.vn/img-source/img/airi/airimomoi%20(3).png
// @grant        none
// ==/UserScript==



(() => {
    'use strict';

    const TARGET =
        /\/assets\/index-C9sU8zrA\.js(?:\?.*)?$/;

    if (
        ![...document.scripts].some(
            s => TARGET.test(s.src)
        )
    ) {
        return;
    }

    const K = {
        god: 'vhc4-god',
        auto: 'vhc4-auto',
        replay: 'vhc4-replay',
        start: 'vhc4-start',
        speed: 'vhc4-speed',
        threshold: 'vhc4-threshold'
    };


    const getBool =
        (key, fallback) => {

            const value =
                localStorage.getItem(key);

            return value == null
                ? fallback
                : value === 'true';
        };


    const getNum =
        (
            key,
            fallback,
            min,
            max
        ) => {

            const value =
                Number(
                    localStorage.getItem(key)
                );

            return Number.isFinite(value)
                ? Math.max(
                    min,
                    Math.min(max, value)
                )
                : fallback;
        };


    const state = {

        god:
            getBool(
                K.god,
                true
            ),

        auto:
            getBool(
                K.auto,
                false
            ),

        replay:
            getBool(
                K.replay,
                true
            ),

        start:
            getBool(
                K.start,
                false
            ),

        speed:
            getNum(
                K.speed,
                1,
                1,
                100
            ),

        threshold:
            getNum(
                K.threshold,
                0.035,
                0.005,
                0.150
            )
    };

    let world = null;
    let originalGameOver = null;


    function findWorld() {

        for (
            const canvas
            of document.querySelectorAll('canvas')
        ) {

            let node =
                canvas;


            while (node) {

                const key =
                    Object.keys(node)
                        .find(
                            k =>
                                k.startsWith(
                                    '__reactFiber$'
                                )
                        );


                if (key) {

                    let fiber =
                        node[key];

                    let fiberGuard = 0;


                    while (
                        fiber &&
                        fiberGuard++ < 80
                    ) {

                        let hook =
                            fiber.memoizedState;

                        let hookGuard = 0;


                        while (
                            hook &&
                            hookGuard++ < 60
                        ) {

                            const m =
                                hook.memoizedState;


                            const current =

                                m &&
                                typeof m === 'object' &&
                                'current' in m

                                    ? m.current

                                    : null;


                            if (
                                current
                                    ?.scene
                                    ?.__vhjWorld
                            ) {

                                return (
                                    current
                                        .scene
                                        .__vhjWorld
                                );
                            }


                            if (
                                current
                                    ?.__vhjWorld
                            ) {

                                return (
                                    current
                                        .__vhjWorld
                                );
                            }


                            hook =
                                hook.next;
                        }


                        fiber =
                            fiber.return;
                    }
                }


                node =
                    node.parentElement;
            }
        }


        return null;
    }

    function bindWorld(w) {

        if (
            !w ||
            world === w
        ) {
            return;
        }


        world =
            w;


        originalGameOver =
            w.gameOver.bind(w);

        w.gameOver =
            function () {

                if (
                    state.god
                ) {

                    this.player.position.y =
                        Math.max(
                            this.groundY,
                            this.player
                                .position
                                .y
                        );

                    return;
                }


                return (
                    originalGameOver()
                );
            };


        console.log(
            '[VH] World hooked',
            w
        );
    }



    function getWorld() {

        const found =
            findWorld();


        if (found) {

            bindWorld(
                found
            );
        }


        return world;
    }

    const CFG = {

        easy: {
            speed: 4.8,
            gap: 6.8
        },

        normal: {
            speed: 6.1,
            gap: 5.6
        },

        hard: {
            speed: 7.5,
            gap: 4.8
        }
    };

    let lastBot =
        performance.now();

    let replayAt =
        0;


    function botLoop() {

        const w =
            getWorld();


        const now =
            performance.now();


        const dt =
            Math.min(
                (
                    now -
                    lastBot
                ) / 1000,

                0.05
            );


        lastBot =
            now;


        if (w) {

            if (
                state.start &&
                w.status === 'ready'
            ) {

                try {

                    w.start();

                } catch {}
            }

            if (
                state.replay &&
                w.status === 'gameover'
            ) {

                if (
                    !replayAt
                ) {

                    replayAt =
                        now;
                }


                if (
                    now -
                    replayAt >
                    300
                ) {

                    replayAt =
                        0;


                    try {

                        w.start();

                    } catch {}
                }

            } else {

                replayAt =
                    0;
            }



            if (
                w.status === 'playing'
            ) {

                if (
                    state.auto &&
                    w.player &&
                    Array.isArray(
                        w.obstacles
                    )
                ) {

                    const next =

                        w.obstacles

                            .filter(
                                o =>
                                    o.mesh
                                        .position
                                        .x >=

                                    w.player
                                        .position
                                        .x -
                                    0.3
                            )

                            .sort(
                                (a, b) =>

                                    a.mesh
                                        .position
                                        .x -

                                    b.mesh
                                        .position
                                        .x
                            )[0];


                    if (next) {

                        const dx =

                            next.mesh
                                .position
                                .x -

                            w.player
                                .position
                                .x;


                        const onGround =

                            w.player
                                .position
                                .y

                            <=

                            w.groundY +
                            0.08;


                        const lead =
                            Math.min(
                                8.5,

                                2.3 +
                                Math.log2(
                                    state.speed +
                                    1
                                ) *
                                0.75
                            );


                        if (
                            onGround &&
                            dx > 0 &&
                            dx < lead
                        ) {

                            try {

                                w.jump();

                            } catch {}
                        }
                    }
                }

                if (
                    state.speed >
                    1
                ) {

                    const cfg =
                        CFG[
                            w.difficulty
                        ] ||
                        CFG.normal;


                    const extra =
                        state.speed -
                        1;


                    // distance

                    w.distance +=

                        cfg.speed *
                        dt *
                        2.5 *
                        extra;

                    w.nextSpawn -=
                        dt *
                        extra;


                    let guard = 0;


                    while (
                        w.nextSpawn <= 0 &&
                        guard++ < 6
                    ) {

                        try {

                            w.spawnObstacle();

                        } catch {

                            break;
                        }


                        w.nextSpawn +=

                            w.demo

                                ? 2.1

                                : cfg.gap +
                                  Math.random() *
                                  1.7;
                    }

                    for (
                        const obstacle
                        of w.obstacles || []
                    ) {

                        const movement =

                            cfg.speed *
                            dt *
                            extra;


                        obstacle
                            .mesh
                            .position
                            .x -=
                            movement;


                        obstacle
                            .halo
                            .position
                            .x =

                            obstacle
                                .mesh
                                .position
                                .x;


                        obstacle
                            .halo
                            .position
                            .y =

                            obstacle
                                .mesh
                                .position
                                .y;
                    }
                }
            }
        }


        requestAnimationFrame(
            botLoop
        );
    }


    requestAnimationFrame(
        botLoop
    );

    function jump() {

        const w =
            getWorld();


        if (
            w?.jump
        ) {

            try {

                w.jump();

                return;

            } catch {}
        }

        window.dispatchEvent(

            new KeyboardEvent(
                'keydown',
                {
                    code: 'Space',
                    key: ' ',
                    keyCode: 32,
                    which: 32,
                    bubbles: true
                }
            )
        );


        window.dispatchEvent(

            new KeyboardEvent(
                'keyup',
                {
                    code: 'Space',
                    key: ' ',
                    keyCode: 32,
                    which: 32,
                    bubbles: true
                }
            )
        );
    }

    let audioCtx = null;
    let analyser = null;
    let samples = null;

    let sourceNode = null;
    let micStream = null;

    let audioElement = null;
    let blobUrl = null;

    let detectRun = 0;
    let lastSoundJump = 0;

    let statusEl = null;
    let levelEl = null;


    const SOUND_COOLDOWN =
        360;



    async function ensureAudio() {

        if (
            !audioCtx
        ) {

            audioCtx =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();


            analyser =
                audioCtx
                    .createAnalyser();


            analyser.fftSize =
                512;


            analyser
                .smoothingTimeConstant =
                0.1;


            samples =
                new Float32Array(
                    analyser.fftSize
                );
        }


        if (
            audioCtx.state ===
            'suspended'
        ) {

            await audioCtx.resume();
        }
    }



    function setStatus(text) {

        if (
            statusEl
        ) {

            statusEl.textContent =
                text;
        }
    }

    function stopSound() {

        detectRun++;


        try {

            sourceNode
                ?.disconnect();

        } catch {}


        try {

            analyser
                ?.disconnect();

        } catch {}


        sourceNode =
            null;



        if (
            micStream
        ) {

            micStream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );


            micStream =
                null;
        }



        if (
            audioElement
        ) {

            try {

                audioElement.pause();

            } catch {}


            audioElement.src =
                '';


            audioElement =
                null;
        }



        if (
            blobUrl
        ) {

            URL.revokeObjectURL(
                blobUrl
            );


            blobUrl =
                null;
        }


        if (
            levelEl
        ) {

            levelEl.textContent =
                '0.000';
        }


        setStatus(
            'IDLE'
        );
    }

    function startDetection(
        label
    ) {

        const run =
            ++detectRun;


        setStatus(
            label
        );


        function loop() {

            if (
                run !==
                    detectRun ||
                !analyser ||
                !samples
            ) {

                return;
            }


            analyser
                .getFloatTimeDomainData(
                    samples
                );


            let sum = 0;


            for (
                const sample
                of samples
            ) {

                sum +=
                    sample *
                    sample;
            }


            const rms =
                Math.sqrt(
                    sum /
                    samples.length
                );


            if (
                levelEl
            ) {

                levelEl.textContent =
                    rms.toFixed(3);
            }


            const now =
                performance.now();


            if (
                rms >=
                    state.threshold &&
                now -
                    lastSoundJump >=
                    SOUND_COOLDOWN
            ) {

                lastSoundJump =
                    now;


                jump();
            }


            requestAnimationFrame(
                loop
            );
        }


        requestAnimationFrame(
            loop
        );
    }

    async function useMic() {

        stopSound();

        await ensureAudio();


        micStream =

            await navigator
                .mediaDevices
                .getUserMedia(
                    {
                        audio: {

                            echoCancellation:
                                false,

                            noiseSuppression:
                                false,

                            autoGainControl:
                                false
                        }
                    }
                );


        sourceNode =
            audioCtx
                .createMediaStreamSource(
                    micStream
                );


        sourceNode.connect(
            analyser
        );

        startDetection(
            'MIC ACTIVE'
        );
    }

    async function useFile(
        file
    ) {

        stopSound();

        await ensureAudio();


        blobUrl =
            URL.createObjectURL(
                file
            );


        audioElement =
            new Audio(
                blobUrl
            );


        audioElement.loop =
            true;


        audioElement.volume =
            1;


        sourceNode =
            audioCtx
                .createMediaElementSource(
                    audioElement
                );


        sourceNode.connect(
            analyser
        );

        analyser.connect(
            audioCtx.destination
        );


        await audioElement.play();


        startDetection(
            'FILE: ' +
            file.name
        );
    }

    const style =
        document.createElement(
            'style'
        );


    style.textContent = `

#vhc4 {

    position: fixed;

    top: 14px;
    left: 14px;

    width: 230px;

    z-index: 2147483647;

    background:
        rgba(18,18,20,.96);

    border:
        1px solid #383838;

    border-radius:
        8px;

    color: #eee;

    font:
        12px Arial,
        sans-serif;

    box-shadow:
        0 6px 22px
        rgba(0,0,0,.55);

    user-select: none;
}


#vhc4 * {
    box-sizing:
        border-box;
}


#vhc4 .head,
#vhc4 .row {

    display: flex;

    align-items: center;

    justify-content:
        space-between;

    gap: 8px;
}


#vhc4 .head {

    height: 34px;

    padding:
        0 10px;

    font-weight:
        700;
}


#vhc4 .row {

    min-height:
        34px;

    padding:
        6px 10px;

    border-top:
        1px solid #2b2b2b;
}


#vhc4 .close {

    border: 0;

    background: none;

    color: #888;

    font-size: 17px;

    cursor: pointer;
}


/* SWITCH */

#vhc4 .switch {

    position: relative;

    width: 34px;
    height: 18px;
}


#vhc4 .switch input {

    display: none;
}


#vhc4 .slider {

    position: absolute;

    inset: 0;

    background:
        #4a4a4a;

    border-radius:
        20px;

    cursor: pointer;
}


#vhc4
.slider::before {

    content: "";

    position: absolute;

    width: 14px;
    height: 14px;

    left: 2px;
    top: 2px;

    background:
        white;

    border-radius:
        50%;

    transition:
        .12s;
}


#vhc4
input:checked +
.slider {

    background:
        #31975a;
}


#vhc4
input:checked +
.slider::before {

    transform:
        translateX(16px);
}


/* RANGE */

#vhc4
input[type=range] {

    width:
        115px;
}


#vhc4 .value {

    width:
        42px;

    text-align:
        right;

    font-weight:
        700;
}


#vhc4 .range {

    display: flex;

    align-items:
        center;

    gap: 4px;
}


/* BUTTONS */

#vhc4 .buttons {

    display:
        grid;

    grid-template-columns:
        1fr 1fr 1fr;

    gap:
        5px;

    width:
        100%;
}


#vhc4 .button {

    padding:
        6px 3px;

    border:
        1px solid #414141;

    border-radius:
        5px;

    background:
        #292929;

    color:
        #eee;

    font:
        inherit;

    cursor:
        pointer;
}


#vhc4 .status {

    font-size:
        10px;

    color:
        #aaa;

    overflow:
        hidden;

    text-overflow:
        ellipsis;

    white-space:
        nowrap;
}


#vhc4 .footer {

    text-align:
        center;

    padding:
        6px;

    border-top:
        1px solid #2b2b2b;

    color:
        #777;

    font-size:
        10px;
}

`;


    document.head
        .appendChild(
            style
        );



    const panel =
        document.createElement(
            'div'
        );


    panel.id =
        'vhc4';


    panel.innerHTML = `

<div class="head">

    <span>
        Voice Horror Control
    </span>

    <button
        class="close"
        id="vh-close"
    >
        ×
    </button>

</div>


<div class="row">

    <span>
        God Mode
    </span>

    <label class="switch">

        <input
            id="vh-god"
            type="checkbox"
        >

        <span
            class="slider"
        ></span>

    </label>

</div>


<div class="row">

    <span>
        Auto Jump
    </span>

    <label class="switch">

        <input
            id="vh-auto"
            type="checkbox"
        >

        <span
            class="slider"
        ></span>

    </label>

</div>


<div class="row">

    <span>
        Auto Replay
    </span>

    <label class="switch">

        <input
            id="vh-replay"
            type="checkbox"
        >

        <span
            class="slider"
        ></span>

    </label>

</div>


<div class="row">

    <span>
        Auto Start
    </span>

    <label class="switch">

        <input
            id="vh-start"
            type="checkbox"
        >

        <span
            class="slider"
        ></span>

    </label>

</div>


<div class="row">

    <span>
        Speed
    </span>

    <div class="range">

        <input
            id="vh-speed"
            type="range"
            min="1"
            max="100"
            step="1"
        >

        <span
            class="value"
            id="vh-speed-value"
        ></span>

    </div>

</div>


<div class="row">

    <span>
        Threshold
    </span>

    <div class="range">

        <input
            id="vh-threshold"
            type="range"

            min="0.005"
            max="0.150"
            step="0.005"
        >

        <span
            class="value"
            id="vh-threshold-value"
        ></span>

    </div>

</div>


<div class="row">

    <div class="buttons">

        <button
            class="button"
            id="vh-mic"
        >
            Mic
        </button>

        <button
            class="button"
            id="vh-file"
        >
            Audio
        </button>

        <button
            class="button"
            id="vh-stop"
        >
            Stop
        </button>

    </div>

</div>


<input
    id="vh-file-input"
    type="file"

    accept="
        audio/*,
        .mp3,
        .wav,
        .ogg,
        .m4a,
        .aac,
        .flac
    "

    hidden
>


<div class="row">

    <span
        class="status"
        id="vh-status"
    >
        IDLE
    </span>

    <span
        class="status"
    >
        LV
        <b id="vh-level">
            0.000
        </b>
    </span>

</div>


<div class="footer">

    F2 Menu
    ·
    G God
    ·
    A Auto

</div>

`;


    document.body
        .appendChild(
            panel
        );

    const $ =
        id =>
            panel.querySelector(
                '#' + id
            );


    const el = {

        god:
            $('vh-god'),

        auto:
            $('vh-auto'),

        replay:
            $('vh-replay'),

        start:
            $('vh-start'),

        speed:
            $('vh-speed'),

        speedValue:
            $('vh-speed-value'),

        threshold:
            $('vh-threshold'),

        thresholdValue:
            $('vh-threshold-value'),

        fileInput:
            $('vh-file-input')
    };


    statusEl =
        $('vh-status');


    levelEl =
        $('vh-level');

    function save() {

        localStorage.setItem(
            K.god,
            state.god
        );


        localStorage.setItem(
            K.auto,
            state.auto
        );


        localStorage.setItem(
            K.replay,
            state.replay
        );


        localStorage.setItem(
            K.start,
            state.start
        );


        localStorage.setItem(
            K.speed,
            state.speed
        );


        localStorage.setItem(
            K.threshold,
            state.threshold
        );
    }

    function render() {

        el.god.checked =
            state.god;


        el.auto.checked =
            state.auto;


        el.replay.checked =
            state.replay;


        el.start.checked =
            state.start;


        el.speed.value =
            state.speed;


        el.speedValue.textContent =
            state.speed +
            'x';


        el.threshold.value =
            state.threshold;


        el.thresholdValue.textContent =
            state.threshold
                .toFixed(3);
    }



    el.god.onchange =
        () => {

            state.god =
                el.god.checked;

            save();
            render();
        };


    el.auto.onchange =
        () => {

            state.auto =
                el.auto.checked;

            save();
            render();
        };


    el.replay.onchange =
        () => {

            state.replay =
                el.replay.checked;

            save();
            render();
        };


    el.start.onchange =
        () => {

            state.start =
                el.start.checked;

            save();
            render();
        };


    el.speed.oninput =
        () => {

            state.speed =
                Number(
                    el.speed.value
                );

            save();
            render();
        };


    el.threshold.oninput =
        () => {

            state.threshold =
                Number(
                    el.threshold.value
                );

            save();
            render();
        };

    $('vh-mic')
        .onclick =
        () => {

            useMic()
                .catch(
                    err => {

                        console.error(
                            err
                        );

                        setStatus(
                            'MIC ERROR'
                        );
                    }
                );
        };

    $('vh-file')
        .onclick =
        () => {

            el.fileInput.click();
        };


    el.fileInput.onchange =
        () => {

            const file =
                el.fileInput
                    .files?.[0];


            if (file) {

                useFile(
                    file
                )
                    .catch(
                        err => {

                            console.error(
                                err
                            );

                            setStatus(
                                'FILE ERROR'
                            );
                        }
                    );
            }


            el.fileInput.value =
                '';
        };

    $('vh-stop')
        .onclick =
        stopSound;

    $('vh-close')
        .onclick =
        () => {

            panel.style.display =
                'none';
        };

    window.addEventListener(

        'keydown',

        event => {

            if (
                event.code ===
                'F2'
            ) {

                event.preventDefault();

                event.stopPropagation();


                panel.style.display =

                    panel.style.display ===
                    'none'

                        ? ''

                        : 'none';

                return;
            }

            if (
                event.code ===
                    'KeyG' &&
                !event.ctrlKey &&
                !event.altKey &&
                !event.metaKey
            ) {

                state.god =
                    !state.god;


                save();
                render();

                return;
            }

            if (
                event.code ===
                    'KeyA' &&
                !event.ctrlKey &&
                !event.altKey &&
                !event.metaKey
            ) {

                state.auto =
                    !state.auto;


                save();
                render();
            }

        },

        true
    );


    render();

})();
