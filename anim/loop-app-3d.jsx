function LoopApp3D() {
  const [t, setTweak] = window.useTweaks(window.TWEAK_DEFAULTS);
  const { TweaksPanel, TweakSection, TweakToggle, TweakSlider, CompositionStage, MoonScene3D } = window;
  return React.createElement('div', { style: { position: 'relative', width: '100%', height: '100%' } },
    React.createElement(CompositionStage, {
      width: 1920, height: 1080, bg: '#04070c',
      scenes: window.OM_SCENES, playback: window.OM_PLAYBACK,
    }, React.createElement(MoonScene3D, { tweaks: t })),
    React.createElement(TweaksPanel, null,
      React.createElement(TweakSection, { label: 'Camera' }),
      React.createElement(TweakSlider, {
        label: 'Lead angle', value: t.lead, min: 0, max: 0.5, step: 0.05,
        onChange: (v) => setTweak('lead', v) }),
      React.createElement(TweakSection, { label: 'Image' }),
      React.createElement(TweakSlider, {
        label: 'Exposure', value: t.exposure, min: 0.5, max: 2, step: 0.1,
        onChange: (v) => setTweak('exposure', v) }),
      React.createElement(TweakToggle, {
        label: 'Vignette', value: t.grade, onChange: (v) => setTweak('grade', v) }),
      React.createElement(TweakSection, { label: 'Workspace' }),
      React.createElement(TweakToggle, {
        label: 'Motion editor', value: t.motionEditor, onChange: (v) => setTweak('motionEditor', v) })));
}
window.LoopApp3D = LoopApp3D;
