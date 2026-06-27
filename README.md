# Trouble Web

### A browser-based hardware tester built with React and TypeScript

[About](#about) • [Features](#features) • [Modules](#modules) • [Installation](#installation) • [Building](#building) • [Dependencies](#dependencies) • [License](#license)

---

## About

A web port of [Trouble](https://github.com/ckagias/Hardware-Doctor), the hardware testing app. Test your headphones, speakers, and microphone directly in the browser. Νo install required, all audio processing runs locally via the Web Audio API.

If you find this useful, feel free to leave a star to help others find it!

---

## Features

- Left/right/both channel test tones for headphones and speakers
- Output device picker with refresh
- Live input level meter with peak-hold for microphone testing
- Record and play back to hear exactly what your mic captures
- All audio processing handled locally in the browser via the Web Audio API

---

## Modules


| Module                | Description                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| Headphones / speakers | Pick an output device, play a tone to the left channel, right channel, or both                             |
| Microphone            | Pick an input device, watch the live input level, and record then play back to hear what your mic captures |


---

## Installation

1. **Clone the repository**
  ```bash
   git clone https://github.com/ckagias/troubleshoot.git
   cd troubleshoot
  ```
2. **Install dependencies**
  ```bash
   npm install
  ```
3. **Run in development**
  ```bash
   npm run dev
  ```

---

## Building

```bash
npm run build
```

Produces a `dist/` folder ready to be served as a static site.

---

## Dependencies


| Package                                       | Purpose                           |
| --------------------------------------------- | --------------------------------- |
| [React](https://react.dev/)                   | UI component model                |
| [Vite](https://vite.dev/)                     | Build tool and dev server         |
| [TypeScript](https://www.typescriptlang.org/) | Type safety                       |
| Web Audio API                                 | Tone generation and audio routing  |
| MediaDevices API                              | Device enumeration and mic capture |
| AnalyserNode                                  | Real-time input level metering     |
| MediaRecorder API                             | Microphone record and playback     |


---

## License

This project is licensed under the [MIT License](LICENSE).