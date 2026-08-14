// Site version of loop-app-3d.jsx — renders the 3D animation only.
// The original mounted a TweaksPanel (the authoring UI) on top; that is
// deliberately dropped here so visitors never see editor controls.
// To retune the look, edit SITE_TWEAKS below.

const SITE_TWEAKS = {
  lead: 0.1,       // 0–0.5, how far the camera leads the motion
  exposure: 0.7,   // 0.5–2, brightness
  grade: true,     // vignette on/off
};

function SiteLoop3D() {
  const { CompositionStage, MoonScene3D } = window;
  return React.createElement(
    'div',
    { style: { position: 'relative', width: '100%', height: '100%' } },
    React.createElement(
      CompositionStage,
      {
        width: 1920,
        height: 1080,
        bg: '#04070c',
        scenes: window.OM_SCENES,
        playback: window.OM_PLAYBACK,
      },
      React.createElement(MoonScene3D, { tweaks: SITE_TWEAKS })
    )
  );
}
window.SiteLoop3D = SiteLoop3D;
