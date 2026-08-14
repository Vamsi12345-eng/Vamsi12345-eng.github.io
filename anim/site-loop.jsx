// Site version of loop-app.jsx — renders the animation only.
// The original mounted a TweaksPanel (the authoring UI) on top; that is
// deliberately dropped here so visitors never see editor controls.
// To retune the look, edit SITE_TWEAKS below.

const SITE_TWEAKS = {
  zoomDepth: 5,          // 3–8, how hard the camera pushes per stage
  showHud: true,         // instrument frame: crosshairs, corner brackets, ticks
  lineColor: '#7FB2FF',  // schematic ink
  accentColor: '#FF7AB8',// highlight
  bg: '#0b1220',         // matches --deep on the main page
};

function SiteLoop() {
  const { CompositionStage, MoonLoop } = window;
  return React.createElement(
    'div',
    { style: { position: 'relative', width: '100%', height: '100%' } },
    React.createElement(
      CompositionStage,
      {
        width: 1920,
        height: 1080,
        bg: SITE_TWEAKS.bg,
        scenes: window.OM_SCENES,
        playback: window.OM_PLAYBACK,
      },
      React.createElement(MoonLoop, { tweaks: SITE_TWEAKS })
    )
  );
}
window.SiteLoop = SiteLoop;
